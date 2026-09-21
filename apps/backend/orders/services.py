import hashlib
import json
from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.db.models import F
from rest_framework.exceptions import APIException, ValidationError

from catalog.models import Product, ProductVariant
from marketplace.models import Inventory, SettlementEntry, StockMovement
from payments.models import Payment
from .models import Fulfillment, Order, OrderItem, OrderStatusLog


class CheckoutConflict(APIException):
    status_code = 409
    default_detail = "This checkout key was already used for a different request."


def plan_cart(data):
    """Price from the catalogue and route each line to one eligible outlet."""
    quantities = defaultdict(int)
    for item in data["items"]:
        quantities[(item["product_id"], item.get("variant_id"))] += item["qty"]
    if any(qty > 100 for qty in quantities.values()):
        raise ValidationError({"items": "Maximum quantity is 100 per product variant."})
    products = Product.objects.filter(pk__in=[p for p, _ in quantities], is_active=True, seller__is_active=True).in_bulk()
    variants = ProductVariant.objects.filter(pk__in=[v for _, v in quantities if v], is_active=True).in_bulk()
    inventory = Inventory.objects.filter(
        product_id__in=products, outlet__is_active=True, outlet__seller__is_active=True,
        outlet__zone=data["zone"], outlet__country="BD", available__gt=0,
        outlet__seller_id=F("product__seller_id"),
    ).select_related("outlet", "outlet__seller").order_by("outlet__priority", "outlet_id", "id")
    if data.get("outlet_id"):
        inventory = inventory.filter(outlet_id=data["outlet_id"])
    candidates = defaultdict(list)
    for row in inventory:
        candidates[(row.product_id, row.variant_id)].append(row)
    lines = []
    for (product_id, variant_id), qty in sorted(quantities.items(), key=lambda pair: (pair[0][0], pair[0][1] or 0)):
        product = products.get(product_id)
        variant = variants.get(variant_id) if variant_id else None
        if not product or (variant_id and (not variant or variant.product_id != product_id)):
            raise ValidationError({"items": "A product or variant is unavailable or does not match."})
        row = next((row for row in candidates[(product_id, variant_id)] if row.available >= qty), None)
        if row is None:
            raise ValidationError({"items": f"Insufficient outlet stock for {product.name_en} in this delivery zone."})
        price = product.base_price + (variant.extra_price if variant else Decimal("0"))
        if price < 0:
            raise ValidationError({"items": "Invalid catalogue price. Contact support."})
        lines.append({"inventory": row, "product": product, "variant": variant, "qty": qty, "price": price, "total": price * qty})
    subtotal = sum((line["total"] for line in lines), Decimal("0"))
    outlet_count = len({line["inventory"].outlet_id for line in lines})
    fee = Decimal("80") if data["zone"] == "dhaka" else Decimal("120")
    if data["delivery_time"] == "60":
        fee += Decimal("20")
    delivery_fee = fee * outlet_count
    if subtotal + delivery_fee > Decimal("99999999.99"):
        raise ValidationError({"items": "Order total exceeds the supported limit."})
    return lines, {"subtotal": subtotal, "discount": Decimal("0"), "delivery_fee": delivery_fee,
        "total": subtotal + delivery_fee, "currency": "BDT", "shipments": outlet_count}


@transaction.atomic
def checkout(data, user=None):
    actor = user if user and user.is_authenticated else None
    fingerprint = hashlib.sha256(json.dumps({"data": data, "user": actor.pk if actor else None}, sort_keys=True, default=str).encode()).hexdigest()
    # A unique key serializes simultaneous retries across API replicas.
    order, created = Order.objects.get_or_create(checkout_key=data["checkout_key"], defaults={
        "request_hash": fingerprint, "user": actor, "status": "CONFIRMED",
        "guest_email": data["customer"].get("email", ""), "name": data["customer"]["name"],
        "phone": data["customer"]["phone"], "address_line1": data["address"]["line1"],
        "area": data["address"].get("area", ""), "city": data["address"].get("city", ""),
        "zone": data["zone"], "delivery_time": data["delivery_time"],
    })
    if not created:
        if order.request_hash != fingerprint:
            raise CheckoutConflict()
        return order, False
    lines, totals = plan_cart(data)
    ids = [line["inventory"].pk for line in lines]
    locked = {row.pk: row for row in Inventory.objects.select_for_update().filter(pk__in=ids).order_by("pk")}
    grouped = defaultdict(list)
    for line in lines:
        row = locked[line["inventory"].pk]
        if row.available < line["qty"]:
            raise CheckoutConflict("Stock changed during checkout. Refresh your cart and retry.")
        row.available -= line["qty"]
        grouped[line["inventory"].outlet_id].append(line)
    # All affected rows are locked in primary-key order until this transaction commits.
    # Batch writes avoid a round trip per item/outlet for large split carts.
    Inventory.objects.bulk_update(list(locked.values()), ["available"])
    fulfillments = []
    for outlet_id, group in grouped.items():
        subtotal = sum(line["total"] for line in group)
        rate = group[0]["inventory"].outlet.seller.commission_percent
        fulfillments.append(Fulfillment(order=order, outlet_id=outlet_id, subtotal=subtotal,
            commission_percent=rate, commission=(subtotal * rate / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)))
    Fulfillment.objects.bulk_create(fulfillments)
    fulfillment_by_outlet = {row.outlet_id: row for row in fulfillments}
    OrderItem.objects.bulk_create([OrderItem(order=order,
        fulfillment=fulfillment_by_outlet[line["inventory"].outlet_id],
        inventory=line["inventory"], product=line["product"], variant=line["variant"],
        product_name=line["product"].name_en, qty=line["qty"], price=line["price"], total=line["total"]) for line in lines])
    StockMovement.objects.bulk_create([StockMovement(inventory=line["inventory"], delta=-line["qty"],
        reason="Checkout allocation", order=order, actor=actor) for line in lines])
    for key in ("subtotal", "discount", "delivery_fee", "total"):
        setattr(order, key, totals[key])
    order.save(update_fields=["subtotal", "discount", "delivery_fee", "total", "updated_at"])
    Payment.objects.create(order=order, provider="cod", amount=order.total, status="PENDING")
    OrderStatusLog.objects.create(order=order, from_status="", to_status="CONFIRMED", note="COD checkout allocated", created_by=actor)
    return order, True


TRANSITIONS = {
    "CONFIRMED": {"PREPARING", "CANCELLED"}, "PREPARING": {"OUT_FOR_DELIVERY", "CANCELLED"},
    "OUT_FOR_DELIVERY": {"DELIVERED"}, "DELIVERED": set(), "CANCELLED": set(),
}


@transaction.atomic
def transition_fulfillment(fulfillment_id, target, user):
    order_id = Fulfillment.objects.values_list("order_id", flat=True).get(pk=fulfillment_id)
    order = Order.objects.select_for_update().get(pk=order_id)
    fulfillment = Fulfillment.objects.select_for_update().get(pk=fulfillment_id)
    if target == fulfillment.status:
        return fulfillment
    if target not in TRANSITIONS.get(fulfillment.status, set()):
        raise ValidationError({"status": "This status transition is not allowed."})
    previous = fulfillment.status
    if target == "CANCELLED":
        items = list(fulfillment.items.order_by("inventory_id"))
        list(Inventory.objects.select_for_update().filter(pk__in=[i.inventory_id for i in items]).order_by("pk"))
        for item in items:
            Inventory.objects.filter(pk=item.inventory_id).update(available=F("available") + item.qty)
        StockMovement.objects.bulk_create([StockMovement(inventory_id=item.inventory_id, delta=item.qty,
            reason="Fulfillment cancelled", order=order, actor=user) for item in items])
        subtotals = list(order.fulfillments.exclude(pk=fulfillment.pk).exclude(status="CANCELLED").values_list("subtotal", flat=True))
        order.subtotal = sum(subtotals, Decimal("0"))
        unit_fee = Decimal("80") if order.zone == "dhaka" else Decimal("120")
        if order.delivery_time == "60":
            unit_fee += Decimal("20")
        order.delivery_fee = unit_fee * len(subtotals)
        order.total = order.subtotal + order.delivery_fee - order.discount
        Payment.objects.filter(order=order, provider="cod", status="PENDING").update(amount=order.total)
    if target == "DELIVERED":
        SettlementEntry.objects.get_or_create(fulfillment=fulfillment, defaults={"gross": fulfillment.subtotal,
            "commission": fulfillment.commission, "net": fulfillment.subtotal - fulfillment.commission, "currency": order.currency})
    fulfillment.status = target
    fulfillment.save(update_fields=["status", "updated_at"])
    states = set(order.fulfillments.values_list("status", flat=True))
    if states == {"CANCELLED"}:
        order.status = "CANCELLED"
        Payment.objects.filter(order=order, provider="cod", status="PENDING").update(status="CANCELLED")
    elif states <= {"DELIVERED", "CANCELLED"}:
        order.status = "DELIVERED"
    else:
        active = states - {"CANCELLED"}
        order.status = next(value for value in ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"] if value in active)
    order.save(update_fields=["status", "subtotal", "delivery_fee", "total", "updated_at"])
    OrderStatusLog.objects.create(order=order, from_status=previous, to_status=target,
        note=f"Fulfillment #{fulfillment.pk}", created_by=user)
    return fulfillment
