from django.db import models

from common.models import TimestampedModel
from orders.models import Order


class Shipment(TimestampedModel):
    COURIER_CHOICES = (("steadfast", "Steadfast"), ("sundarban", "Sundarban"))

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="shipment")
    courier = models.CharField(max_length=32, choices=COURIER_CHOICES)
    tracking_id = models.CharField(max_length=128, blank=True)
    status = models.CharField(max_length=64, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    meta_json = models.JSONField(null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.courier} - {self.tracking_id}"
