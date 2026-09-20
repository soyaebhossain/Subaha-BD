from decimal import Decimal

from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order
from .serializers import CartQuoteSerializer, OrderCreateSerializer, OrderSerializer
from .services import plan_cart
from common.pagination import CatalogPagination


class CartQuoteView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CartQuoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        _, totals = plan_cart(serializer.validated_data)
        return Response(totals)


class CheckoutCreateOrderView(APIView):
    throttle_scope = "checkout"
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=201 if serializer.was_created else 200)


class MyOrdersViewSet(viewsets.ReadOnlyModelViewSet):
    pagination_class = CatalogPagination
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related(
            "items__variant", "fulfillments__outlet__seller", "fulfillments__items__variant"
        ).order_by("-created_at", "-id")
