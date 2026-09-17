from decimal import Decimal

from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order
from .serializers import OrderCreateSerializer, OrderSerializer


class CartQuoteView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        items = request.data.get("items", [])
        zone = request.data.get("zone", "dhaka")
        delivery_time = request.data.get("delivery_time", "120")
        subtotal = sum(
            Decimal(str(item.get("price", 0))) * int(item.get("qty", 1)) for item in items
        )
        delivery_fee = Decimal("80") if zone == "dhaka" else Decimal("120")
        if delivery_time == "60" and zone == "dhaka":
            delivery_fee += Decimal("20")
        return Response(
            {
                "subtotal": subtotal,
                "discount": Decimal("0"),
                "delivery_fee": delivery_fee,
                "total": subtotal + delivery_fee,
            }
        )


class CheckoutCreateOrderView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=201)


class MyOrdersViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by("-created_at")
