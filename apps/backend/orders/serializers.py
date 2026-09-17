from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import serializers

from catalog.models import Product, ProductVariant
from .models import Order, OrderItem

User = get_user_model()


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name_en", read_only=True)
    variant_label = serializers.CharField(source="variant.weight_label", read_only=True)

    class Meta:
        model = OrderItem
        fields = ("product", "variant", "qty", "price", "total", "product_name", "variant_label")
        read_only_fields = ("price", "total", "product_name", "variant_label")


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "total",
            "subtotal",
            "discount",
            "delivery_fee",
            "delivery_time",
            "zone",
            "name",
            "phone",
            "guest_email",
            "address_line1",
            "area",
            "city",
            "items",
            "created_at",
        )
        read_only_fields = ("id", "status", "total", "subtotal", "discount", "delivery_fee", "created_at")


class OrderCreateSerializer(serializers.Serializer):
    customer = serializers.DictField()
    address = serializers.DictField()
    items = serializers.ListField(child=serializers.DictField(), allow_empty=False)
    zone = serializers.CharField()
    delivery_time = serializers.CharField()
    payment_method = serializers.CharField()
    coupon_code = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["zone"] == "outside" and attrs["delivery_time"] == "60":
            raise serializers.ValidationError("60 min delivery not available outside Dhaka.")
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request and request.user.is_authenticated else None
        customer = validated_data["customer"]
        address = validated_data["address"]
        zone = validated_data["zone"]
        delivery_time = validated_data["delivery_time"]

        delivery_fee = Decimal("80") if zone == "dhaka" else Decimal("120")
        if delivery_time == "60":
            delivery_fee += Decimal("20")

        order = Order.objects.create(
            user=user,
            guest_email=customer.get("email", ""),
            name=customer.get("name", ""),
            phone=customer.get("phone", ""),
            address_line1=address.get("line1", ""),
            area=address.get("area", ""),
            city=address.get("city", ""),
            zone=zone,
            delivery_time=delivery_time,
            delivery_fee=delivery_fee,
        )

        subtotal = Decimal("0")
        for item in validated_data["items"]:
            product_id = item.get("product_id")
            variant_id = item.get("variant_id")
            qty = int(item.get("qty", 1))
            product = Product.objects.get(id=product_id)
            variant = ProductVariant.objects.filter(id=variant_id).first() if variant_id else None
            price = Decimal(product.base_price)
            if variant:
                price += Decimal(variant.extra_price)
            total = price * qty
            OrderItem.objects.create(
                order=order,
                product=product,
                variant=variant,
                qty=qty,
                price=price,
                total=total,
            )
            subtotal += total

        order.subtotal = subtotal
        order.total = subtotal + delivery_fee
        order.save()
        return order
