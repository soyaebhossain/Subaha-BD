from rest_framework import serializers

from .models import Fulfillment, Order, OrderItem
from .services import checkout


class OrderItemSerializer(serializers.ModelSerializer):
    variant_label = serializers.CharField(source="variant.weight_label", read_only=True, default="")

    class Meta:
        model = OrderItem
        fields = ("product", "variant", "qty", "price", "total", "product_name", "variant_label")


class FulfillmentSerializer(serializers.ModelSerializer):
    outlet_name = serializers.CharField(source="outlet.name")
    seller_name = serializers.CharField(source="outlet.seller.name")
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Fulfillment
        fields = ("id", "outlet", "outlet_name", "seller_name", "status", "subtotal", "items")


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    fulfillments = FulfillmentSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ("id", "status", "currency", "total", "subtotal", "discount", "delivery_fee", "delivery_time",
            "zone", "name", "phone", "guest_email", "address_line1", "area", "city", "items", "fulfillments", "created_at")


class CartLineSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(min_value=1)
    variant_id = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    qty = serializers.IntegerField(min_value=1, max_value=100)


class CartQuoteSerializer(serializers.Serializer):
    items = CartLineSerializer(many=True, allow_empty=False, max_length=100)
    zone = serializers.ChoiceField(choices=["dhaka", "outside"])
    delivery_time = serializers.ChoiceField(choices=["60", "120"])
    outlet_id = serializers.IntegerField(min_value=1, required=False)
    coupon_code = serializers.CharField(required=False, allow_blank=True, max_length=64)

    def validate(self, attrs):
        if attrs["zone"] == "outside" and attrs["delivery_time"] == "60":
            raise serializers.ValidationError("60 minute delivery is not available outside Dhaka.")
        if attrs.get("coupon_code"):
            raise serializers.ValidationError({"coupon_code": "Coupons are not enabled yet."})
        return attrs


class CustomerSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=32)
    email = serializers.EmailField(required=False, allow_blank=True)


class CheckoutAddressSerializer(serializers.Serializer):
    line1 = serializers.CharField(max_length=255)
    area = serializers.CharField(max_length=128, required=False, allow_blank=True)
    city = serializers.CharField(max_length=128, required=False, allow_blank=True)


class OrderCreateSerializer(CartQuoteSerializer):
    customer = CustomerSerializer()
    address = CheckoutAddressSerializer()
    checkout_key = serializers.UUIDField()
    payment_method = serializers.ChoiceField(choices=["cod"])

    def create(self, validated_data):
        order, self.was_created = checkout(validated_data, self.context["request"].user)
        return order
