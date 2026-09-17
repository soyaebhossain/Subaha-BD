from decimal import Decimal

from django.conf import settings
from django.db import models

from catalog.models import Product, ProductVariant
from common.models import TimestampedModel

User = settings.AUTH_USER_MODEL


class Order(TimestampedModel):
    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("CONFIRMED", "Confirmed"),
        ("PREPARING", "Preparing"),
        ("OUT_FOR_DELIVERY", "Out for delivery"),
        ("DELIVERED", "Delivered"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    )
    DELIVERY_CHOICES = (("60", "60"), ("120", "120"))
    ZONE_CHOICES = (("dhaka", "Dhaka"), ("outside", "Outside"))

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders")
    guest_email = models.EmailField(blank=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=32)
    address_line1 = models.CharField(max_length=255)
    area = models.CharField(max_length=128, blank=True)
    city = models.CharField(max_length=128, blank=True)
    zone = models.CharField(max_length=16, choices=ZONE_CHOICES, default="dhaka")
    delivery_time = models.CharField(max_length=8, choices=DELIVERY_CHOICES, default="120")
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="PENDING")

    def __str__(self) -> str:
        return f"Order #{self.pk} - {self.status}"

    def recalc_totals(self):
        subtotal = sum((item.total for item in self.items.all()), Decimal("0"))
        self.subtotal = subtotal
        self.total = subtotal + self.delivery_fee - self.discount
        self.save(update_fields=["subtotal", "total"])


class OrderItem(TimestampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name="+")
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    qty = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self) -> str:
        return f"{self.product} x {self.qty}"


class OrderStatusLog(TimestampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="logs")
    from_status = models.CharField(max_length=32, blank=True)
    to_status = models.CharField(max_length=32)
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")

    def __str__(self) -> str:
        return f"{self.order} -> {self.to_status}"
