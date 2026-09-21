from unittest.mock import patch

from django.db import connection, IntegrityError
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient

from catalog.models import Product
from marketplace.models import Inventory, Outlet, Seller, StockMovement
from orders.models import Fulfillment, Order, OrderItem
from orders.services import checkout
from payments.models import Payment
from .tests import payload


class LargeCartTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        seller = Seller.objects.create(name="Scale test", slug="scale-test", kind="owned", is_active=True)
        cls.products = Product.objects.bulk_create([
            Product(seller=seller, name_en=f"Item {i}", slug=f"scale-{i}", base_price=100) for i in range(100)])
        outlets = Outlet.objects.bulk_create([
            Outlet(seller=seller, name=f"Outlet {i}", code=f"scale-{i}", city="Dhaka", zone="dhaka", is_active=True) for i in range(100)])
        Inventory.objects.bulk_create([
            Inventory(outlet=outlet, product=product, available=10) for outlet, product in zip(outlets, cls.products)])

    def cart(self):
        data = payload(self.products[0])
        data["items"] = [{"product_id": p.pk, "qty": 1} for p in self.products]
        return data

    def test_hundred_line_split_checkout_has_bounded_database_round_trips(self):
        with CaptureQueriesContext(connection) as small:
            checkout(payload(self.products[0]))
        with CaptureQueriesContext(connection) as large:
            order, _ = checkout(self.cart())
        self.assertLessEqual(len(large), len(small) + 8, f"1 line: {len(small)} queries; 100 lines: {len(large)} queries")
        self.assertEqual(order.total, 18000)
        self.assertEqual(Fulfillment.objects.filter(order=order).count(), 100)
        self.assertEqual(OrderItem.objects.filter(order=order).count(), 100)
        self.assertEqual(StockMovement.objects.filter(order=order).count(), 100)
        self.assertEqual(Payment.objects.get(order=order).amount, 18000)

    def test_payment_failure_rolls_back_every_outlet_and_stock_change(self):
        with patch("orders.services.Payment.objects.create", side_effect=IntegrityError("Simulated payment write failure")):
            with self.assertRaises(IntegrityError):
                checkout(self.cart())
        self.assertEqual(Inventory.objects.filter(available=10).count(), 100)
        for model in (Order, OrderItem, Fulfillment, StockMovement, Payment):
            self.assertFalse(model.objects.exists(), model.__name__)

    def test_api_serialization_does_not_query_per_outlet(self):
        client = APIClient()
        with CaptureQueriesContext(connection) as small:
            first = client.post("/api/v1/checkout/create-order", payload(self.products[0]), format="json")
        self.assertEqual(first.status_code, 201)
        with CaptureQueriesContext(connection) as large:
            response = client.post("/api/v1/checkout/create-order", self.cart(), format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(response.data["fulfillments"]), 100)
        self.assertLessEqual(len(large), len(small) + 8, f"API: 1 line {len(small)}, 100 lines {len(large)} queries")
