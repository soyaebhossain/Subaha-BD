from django.db import models

from common.models import TimestampedModel
from orders.models import Order


class Payment(TimestampedModel):
    PROVIDER_CHOICES = (
        ("sslcommerz", "SSLCOMMERZ"),
        ("bkash", "bKash"),
        ("nagad", "Nagad"),
        ("cod", "COD"),
    )
    STATUS_CHOICES = (
        ("INITIATED", "Initiated"),
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
        ("CANCELLED", "Cancelled"),
        ("PENDING", "Pending"),
    )

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="payments")
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    trx_id = models.CharField(max_length=128, blank=True)
    raw_response_json = models.JSONField(null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.provider} {self.status} for {self.order_id}"


class WebhookLog(TimestampedModel):
    provider = models.CharField(max_length=20)
    payload = models.JSONField()
    received_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Webhook {self.provider} @ {self.received_at}"
