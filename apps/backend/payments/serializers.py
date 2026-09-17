from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ("id", "order", "provider", "amount", "status", "trx_id", "created_at")
        read_only_fields = ("id", "status", "trx_id", "created_at")
