from django.conf import settings
from django.db import models

from common.models import TimestampedModel

User = settings.AUTH_USER_MODEL


class Coupon(TimestampedModel):
    TYPE_CHOICES = (("flat", "Flat"), ("percent", "Percent"))
    code = models.CharField(max_length=64, unique=True)
    type = models.CharField(max_length=16, choices=TYPE_CHOICES)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_discount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    start_at = models.DateTimeField(null=True, blank=True)
    end_at = models.DateTimeField(null=True, blank=True)
    usage_limit = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return self.code


class CouponUsage(TimestampedModel):
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name="usages")
    order = models.ForeignKey("orders.Order", on_delete=models.CASCADE, related_name="coupon_usages")
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="coupon_usages")

    def __str__(self) -> str:
        return f"{self.coupon.code} on {self.order_id}"
