import copy
import uuid
from unittest.mock import patch
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient

from catalog.models import Product, ProductVariant
from orders.models import Fulfillment, Order
from orders.services import checkout, transition_fulfillment
from payments.models import Payment
from .models import Inventory, Membership, Outlet, Seller, SettlementEntry, StockMovement


def fixtures():
    seller = Seller.objects.create(name="Owned", slug="owned", kind="owned", is_active=True, commission_percent=10)
    other = Seller.objects.create(name="Franchise", slug="franchise", kind="franchise", is_active=True, commission_percent=15)
    outlet = Outlet.objects.create(seller=seller, name="Dhaka A", code="a", city="Dhaka", zone="dhaka", is_active=True)
    second = Outlet.objects.create(seller=other, name="Dhaka B", code="b", city="Dhaka", zone="dhaka", is_active=True)
    product = Product.objects.create(seller=seller, name_en="Rice", slug="rice", base_price=100)
    another = Product.objects.create(seller=other, name_en="Oil", slug="oil", base_price=200)
    variant = ProductVariant.objects.create(product=product, weight_label="1kg", extra_price=5)
    stock = Inventory.objects.create(outlet=outlet, product=product, variant=variant, available=10)
    other_stock = Inventory.objects.create(outlet=second, product=another, available=20)
    return seller, other, outlet, second, product, another, variant, stock, other_stock


def payload(product, variant=None):
    return {"checkout_key": str(uuid.uuid4()), "customer": {"name": "Customer", "phone": "01700000000"},
        "address": {"line1": "Test road"}, "items": [{"product_id": product.pk, "variant_id": variant.pk if variant else None, "qty": 2}],
        "zone": "dhaka", "delivery_time": "120", "payment_method": "cod"}


class MarketplaceTests(TestCase):
    def setUp(self):
        (self.seller, self.other, self.outlet, self.second, self.product, self.another,
            self.variant, self.stock, self.other_stock) = fixtures()
        self.client = APIClient()
        self.data = payload(self.product, self.variant)
        self.manager = get_user_model().objects.create_user(email="manager@example.test", password="test-long-password-47")
        Membership.objects.create(user=self.manager, seller=self.seller, role="manager")

    def post_checkout(self, data=None):
        return self.client.post("/api/v1/checkout/create-order", data or self.data, format="json")

    def test_checkout_allocates_and_prices_from_database(self):
        self.data["items"][0]["price"] = 1
        response = self.post_checkout()
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Decimal(response.data["total"]), Decimal("290"))
        self.stock.refresh_from_db()
        self.assertEqual(self.stock.available, 8)
        self.assertEqual(Payment.objects.get().status, "PENDING")
        self.assertEqual(StockMovement.objects.get().delta, -2)

    def test_retry_does_not_duplicate_order_payment_or_stock(self):
        first = self.post_checkout()
        second = self.post_checkout()
        self.assertEqual(second.status_code, 200)
        self.assertEqual(first.data["id"], second.data["id"])
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(Payment.objects.count(), 1)
        self.stock.refresh_from_db()
        self.assertEqual(self.stock.available, 8)

    def test_key_cannot_be_reused_for_different_payload_or_user(self):
        self.post_checkout()
        changed = copy.deepcopy(self.data)
        changed["items"][0]["qty"] = 3
        self.assertEqual(self.post_checkout(changed).status_code, 409)
        self.client.force_authenticate(self.manager)
        self.assertEqual(self.post_checkout().status_code, 409)

    def test_out_of_stock_rolls_back_everything(self):
        self.data["items"][0]["qty"] = 11
        response = self.post_checkout()
        self.assertEqual(response.status_code, 400)
        self.assertFalse(Order.objects.exists())
        self.assertFalse(Payment.objects.exists())
        self.stock.refresh_from_db()
        self.assertEqual(self.stock.available, 10)

    def test_failure_after_allocation_rolls_back_everything(self):
        with patch("orders.services.Payment.objects.create", side_effect=RuntimeError("database write failed")):
            with self.assertRaises(RuntimeError):
                checkout(self.data)
        self.stock.refresh_from_db()
        self.assertEqual(self.stock.available, 10)
        self.assertFalse(Order.objects.exists())
        self.assertFalse(Fulfillment.objects.exists())
        self.assertFalse(StockMovement.objects.exists())

    def test_invalid_variant_is_rejected(self):
        self.data["items"][0]["product_id"] = self.another.pk
        self.assertEqual(self.post_checkout().status_code, 400)
        self.assertFalse(Order.objects.exists())

    def test_invalid_inputs_are_rejected(self):
        for key, value in [("zone", "unknown"), ("delivery_time", "30"), ("payment_method", "bkash"), ("checkout_key", "bad")]:
            with self.subTest(key=key):
                data = {**self.data, key: value}
                self.assertEqual(self.post_checkout(data).status_code, 400)
        for qty in [0, -1, 101, "invalid"]:
            data = copy.deepcopy(self.data)
            data["items"][0]["qty"] = qty
            self.assertEqual(self.post_checkout(data).status_code, 400)

    def test_duplicate_lines_are_merged_before_stock_check(self):
        self.data["items"] *= 6
        self.assertEqual(self.post_checkout().status_code, 400)
        self.assertFalse(Order.objects.exists())

    def test_inactive_outlet_or_seller_cannot_fulfill(self):
        self.outlet.is_active = False
        self.outlet.save()
        self.assertEqual(self.post_checkout().status_code, 400)
        self.outlet.is_active = True
        self.outlet.save()
        self.seller.is_active = False
        self.seller.save()
        self.assertEqual(self.post_checkout().status_code, 400)

    def test_cross_seller_stock_is_never_routed(self):
        self.stock.available = 0
        self.stock.save()
        Inventory.objects.create(outlet=self.second, product=self.product, variant=self.variant, available=50)
        self.assertEqual(self.post_checkout().status_code, 400)

    def test_multiple_sellers_split_order_and_snapshot_commission(self):
        self.data["items"].append({"product_id": self.another.pk, "qty": 1})
        response = self.post_checkout()
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(len(response.data["fulfillments"]), 2)
        self.assertEqual(Decimal(response.data["delivery_fee"]), 160)
        self.assertEqual(Fulfillment.objects.get(outlet=self.outlet).commission, 21)
        self.assertEqual(Fulfillment.objects.get(outlet=self.second).commission, 30)

    def test_quote_ignores_client_prices_and_does_not_allocate(self):
        self.data["items"][0]["price"] = "0.01"
        response = self.client.post("/api/v1/cart/quote", self.data, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["subtotal"], 210)
        self.assertEqual(response.data["shipments"], 1)
        self.stock.refresh_from_db()
        self.assertEqual(self.stock.available, 10)
        self.assertFalse(Order.objects.exists())

    def test_delivery_zone_routing(self):
        self.data["zone"] = "outside"
        self.assertEqual(self.post_checkout().status_code, 400)
        self.outlet.zone = "outside"
        self.outlet.save()
        response = self.post_checkout()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Decimal(response.data["delivery_fee"]), 120)

    def test_explicit_outlet_does_not_fallback(self):
        self.data["outlet_id"] = self.second.pk
        self.assertEqual(self.post_checkout().status_code, 400)

    def test_cancel_restores_stock_once_and_reduces_cod(self):
        self.post_checkout()
        fulfillment = Fulfillment.objects.get()
        transition_fulfillment(fulfillment.pk, "CANCELLED", self.manager)
        transition_fulfillment(fulfillment.pk, "CANCELLED", self.manager)
        self.stock.refresh_from_db()
        self.assertEqual(self.stock.available, 10)
        self.assertEqual(StockMovement.objects.filter(delta=2).count(), 1)
        self.assertEqual(Order.objects.get().total, 0)
        self.assertEqual(Payment.objects.get().status, "CANCELLED")

    def test_partial_cancel_preserves_other_fulfillment(self):
        self.data["items"].append({"product_id": self.another.pk, "qty": 1})
        self.post_checkout()
        transition_fulfillment(Fulfillment.objects.get(outlet=self.outlet).pk, "CANCELLED", self.manager)
        self.assertEqual(Order.objects.get().total, 280)
        self.assertEqual(Payment.objects.get().amount, 280)
        self.other_stock.refresh_from_db()
        self.assertEqual(self.other_stock.available, 19)

    def test_delivery_accrues_once_without_marking_cod_paid(self):
        self.post_checkout()
        fulfillment = Fulfillment.objects.get()
        for target in ["PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "DELIVERED"]:
            transition_fulfillment(fulfillment.pk, target, self.manager)
            self.assertEqual(Order.objects.get().status, target)
        self.assertEqual(SettlementEntry.objects.count(), 1)
        self.assertEqual(SettlementEntry.objects.get().net, 189)
        self.assertEqual(Payment.objects.get().status, "PENDING")

    def test_tenant_read_and_write_isolation(self):
        self.data["items"].append({"product_id": self.another.pk, "qty": 1})
        self.post_checkout()
        self.client.force_authenticate(self.manager)
        response = self.client.get("/api/v1/operations/fulfillments/")
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(len(response.data["results"][0]["items"]), 1)
        foreign = Fulfillment.objects.get(outlet=self.second)
        self.assertEqual(self.client.post(f"/api/v1/operations/fulfillments/{foreign.pk}/transition/", {"status": "CANCELLED"}).status_code, 404)
        self.assertEqual(self.client.get(f"/api/v1/operations/inventory/{self.other_stock.pk}/").status_code, 404)
        overview = self.client.get("/api/v1/operations/overview").data
        self.assertEqual(overview["outlets"], 1)

    def test_customer_and_finance_permissions(self):
        self.assertEqual(self.client.get("/api/v1/operations/overview").status_code, 401)
        user = get_user_model().objects.create_user(email="customer@example.test")
        self.client.force_authenticate(user)
        self.assertEqual(self.client.get("/api/v1/operations/overview").status_code, 403)
        Membership.objects.create(user=user, seller=self.seller, role="finance")
        response = self.client.post(f"/api/v1/operations/inventory/{self.stock.pk}/adjust/", {"delta": 2, "reason": "test"})
        self.assertEqual(response.status_code, 403)

    def test_adjustment_audit_and_underflow(self):
        self.client.force_authenticate(self.manager)
        url = f"/api/v1/operations/inventory/{self.stock.pk}/adjust/"
        self.assertEqual(self.client.post(url, {"delta": -11, "reason": "count", "operation_key": str(uuid.uuid4())}).status_code, 400)
        adjustment = {"delta": 5, "reason": "received", "operation_key": str(uuid.uuid4())}
        self.assertEqual(self.client.post(url, adjustment).status_code, 200)
        self.assertEqual(self.client.post(url, adjustment).status_code, 200)
        self.stock.refresh_from_db()
        self.assertEqual(self.stock.available, 15)
        self.assertEqual(StockMovement.objects.get().actor_id, self.manager.pk)

    def test_stock_adjustment_key_rejects_changed_payload(self):
        self.client.force_authenticate(self.manager)
        url = f"/api/v1/operations/inventory/{self.stock.pk}/adjust/"
        adjustment = {"delta": 1, "reason": "count", "operation_key": str(uuid.uuid4())}
        self.assertEqual(self.client.post(url, adjustment).status_code, 200)
        self.assertEqual(self.client.post(url, {**adjustment, "delta": 2}).status_code, 409)

    def test_invalid_status_transition(self):
        self.post_checkout()
        self.client.force_authenticate(self.manager)
        url = f"/api/v1/operations/fulfillments/{Fulfillment.objects.get().pk}/transition/"
        self.assertEqual(self.client.post(url, {"status": "DELIVERED"}).status_code, 400)

    def test_catalog_bounded_and_uses_outlet_stock(self):
        response = self.client.get("/api/v1/products/?page_size=100000")
        self.assertEqual(response.status_code, 200)
        self.assertIn("results", response.data)
        rice = next(p for p in response.data["results"] if p["id"] == self.product.pk)
        self.assertEqual(rice["variants"][0]["stock"], 10)
        Product.objects.bulk_create([Product(seller=self.seller, name_en=f"Product {i}", slug=f"product-{i}", base_price=10) for i in range(101)])
        bounded = self.client.get("/api/v1/products/?page_size=100000")
        self.assertEqual(len(bounded.data["results"]), 100)
        self.assertIsNotNone(bounded.data["next"])

    def test_customer_order_visibility(self):
        self.client.force_authenticate(self.manager)
        self.post_checkout()
        self.assertEqual(self.client.get("/api/v1/my/orders/").data["count"], 1)
        user = get_user_model().objects.create_user(email="other@example.test")
        self.client.force_authenticate(user)
        self.assertEqual(self.client.get("/api/v1/my/orders/").data["count"], 0)

    def test_online_payment_fails_closed(self):
        for path in ["bkash/create", "bkash/execute", "sslcommerz/init", "sslcommerz/ipn", "nagad/init"]:
            self.assertEqual(self.client.post(f"/api/v1/payments/{path}", {}).status_code, 503)
        self.assertFalse(Payment.objects.exists())

    def test_non_superuser_cannot_access_platform_admin(self):
        self.manager.is_staff = True
        self.manager.save()
        self.client.force_login(self.manager)
        self.assertEqual(self.client.get("/admin/").status_code, 302)

    def test_inventory_uniqueness_and_nonnegative_constraint(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Inventory.objects.create(outlet=self.outlet, product=self.product, variant=self.variant, available=1)
        with self.assertRaises(IntegrityError), transaction.atomic():
            Inventory.objects.filter(pk=self.stock.pk).update(available=-1)
