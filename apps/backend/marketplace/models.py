from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q

from common.models import TimestampedModel


class Seller(TimestampedModel):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    kind = models.CharField(max_length=16, choices=[("owned", "Owned"), ("franchise", "Franchise"), ("seller", "Seller")])
    is_active = models.BooleanField(default=False)
    commission_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0,
        validators=[MinValueValidator(Decimal("0")), MaxValueValidator(Decimal("100"))])

    class Meta:
        constraints = [models.CheckConstraint(condition=Q(commission_percent__gte=0, commission_percent__lte=100), name="seller_commission_range")]

    def __str__(self):
        return self.name


class Outlet(TimestampedModel):
    seller = models.ForeignKey(Seller, on_delete=models.PROTECT, related_name="outlets")
    name = models.CharField(max_length=200)
    code = models.SlugField(unique=True)
    country = models.CharField(max_length=2, default="BD")
    city = models.CharField(max_length=128)
    division = models.CharField(max_length=64, blank=True, db_index=True)
    district = models.CharField(max_length=64, blank=True)
    outlet_type = models.CharField(max_length=16, default="district", choices=[("flagship", "Divisional flagship"), ("district", "District outlet")])
    is_demo = models.BooleanField(default=False)
    zone = models.CharField(max_length=16, choices=[("dhaka", "Dhaka"), ("outside", "Outside")])
    address = models.CharField(max_length=500, blank=True)
    is_active = models.BooleanField(default=False)
    priority = models.PositiveIntegerField(default=100, help_text="Lower values are routed first.")

    class Meta:
        ordering = ("priority", "id")
        indexes = [models.Index(fields=["zone", "is_active", "priority"])]

    def __str__(self):
        return f"{self.code} — {self.name}"


class Membership(TimestampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="seller_memberships")
    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name="memberships")
    role = models.CharField(max_length=16, choices=[("manager", "Manager"), ("operator", "Operator"), ("finance", "Finance")])

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "seller"], name="unique_seller_member")]


class Inventory(TimestampedModel):
    outlet = models.ForeignKey(Outlet, on_delete=models.PROTECT, related_name="inventory")
    product = models.ForeignKey("catalog.Product", on_delete=models.PROTECT, related_name="outlet_inventory")
    variant = models.ForeignKey("catalog.ProductVariant", null=True, blank=True, on_delete=models.PROTECT)
    available = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("id",)
        constraints = [
            models.UniqueConstraint(fields=["outlet", "product", "variant"], condition=Q(variant__isnull=False), name="unique_outlet_variant"),
            models.UniqueConstraint(fields=["outlet", "product"], condition=Q(variant__isnull=True), name="unique_outlet_product"),
        ]
        indexes = [models.Index(fields=["product", "variant", "outlet"])]

    def clean(self):
        if self.variant_id and self.variant.product_id != self.product_id:
            raise ValidationError("Variant does not belong to the product.")
        if self.outlet_id and self.product_id and self.outlet.seller_id != self.product.seller_id:
            raise ValidationError("Product and outlet must belong to the same seller.")


class StockMovement(TimestampedModel):
    operation_key = models.UUIDField(null=True, blank=True, unique=True, editable=False)
    inventory = models.ForeignKey(Inventory, on_delete=models.PROTECT, related_name="movements")
    delta = models.IntegerField()
    reason = models.CharField(max_length=200)
    order = models.ForeignKey("orders.Order", null=True, blank=True, on_delete=models.PROTECT)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)


class SettlementEntry(TimestampedModel):
    """Delivered merchandise accrual, not a bank payout or proof of COD collection."""
    fulfillment = models.OneToOneField("orders.Fulfillment", on_delete=models.PROTECT, related_name="settlement")
    gross = models.DecimalField(max_digits=14, decimal_places=2)
    commission = models.DecimalField(max_digits=14, decimal_places=2)
    net = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=3, default="BDT")

    class Meta:
        indexes = [models.Index(fields=["created_at"])]
