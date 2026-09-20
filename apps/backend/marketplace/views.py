from datetime import timedelta

from django.db import transaction
from django.db.models import Count, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from common.pagination import CatalogPagination, OperationsPagination
from orders.models import Fulfillment
from orders.serializers import OrderItemSerializer
from orders.services import CheckoutConflict, transition_fulfillment
from .models import Inventory, Membership, Outlet, Seller, SettlementEntry, StockMovement


def seller_ids(user, write=False):
    if user.is_superuser:
        return Seller.objects.values_list("pk", flat=True)
    memberships = Membership.objects.filter(user=user, seller__is_active=True)
    if write:
        memberships = memberships.filter(role__in=["manager", "operator"])
    return memberships.values_list("seller_id", flat=True)


class OperationsPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user.is_authenticated and (request.user.is_superuser or
            Membership.objects.filter(user=request.user, seller__is_active=True).exists()))


class OutletSerializer(serializers.ModelSerializer):
    seller_name = serializers.CharField(source="seller.name")
    seller_kind = serializers.CharField(source="seller.kind")

    class Meta:
        model = Outlet
        fields = ("id", "name", "code", "seller_name", "seller_kind", "country", "city", "zone", "is_active", "division", "district", "outlet_type", "is_demo")


class OutletViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OutletSerializer
    pagination_class = CatalogPagination

    def get_queryset(self):
        qs = Outlet.objects.filter(is_active=True, seller__is_active=True).select_related("seller")
        zone = self.request.query_params.get("zone")
        if zone:
            qs = qs.filter(zone=zone)
        for field in ("division", "district", "outlet_type"):
            value = self.request.query_params.get(field)
            if value:
                qs = qs.filter(**{field: value})
        return qs


class OperationsOutletViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [OperationsPermission]
    serializer_class = OutletSerializer
    pagination_class = CatalogPagination

    def get_queryset(self):
        return Outlet.objects.filter(seller_id__in=seller_ids(self.request.user)).select_related("seller")


class InventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name_en")
    variant_label = serializers.CharField(source="variant.weight_label", default="")
    outlet_name = serializers.CharField(source="outlet.name")

    class Meta:
        model = Inventory
        fields = ("id", "outlet", "outlet_name", "product", "product_name", "variant", "variant_label", "available")


class AdjustmentSerializer(serializers.Serializer):
    operation_key = serializers.UUIDField()
    delta = serializers.IntegerField(min_value=-1000000, max_value=1000000)
    reason = serializers.CharField(max_length=200)

    def validate_delta(self, value):
        if value == 0:
            raise serializers.ValidationError("Enter a non-zero adjustment.")
        return value


class InventoryViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [OperationsPermission]
    serializer_class = InventorySerializer
    pagination_class = CatalogPagination

    def get_queryset(self):
        qs = Inventory.objects.filter(outlet__seller_id__in=seller_ids(self.request.user)).select_related("outlet", "product", "variant")
        outlet = self.request.query_params.get("outlet")
        if outlet:
            if not outlet.isdigit():
                raise ValidationError({"outlet": "Expected an outlet ID."})
            qs = qs.filter(outlet_id=outlet)
        return qs.order_by("pk")

    @action(detail=True, methods=["post"])
    def adjust(self, request, pk=None):
        obj = self.get_object()
        if obj.outlet.seller_id not in seller_ids(request.user, write=True):
            raise PermissionDenied("Your role cannot adjust stock.")
        serializer = AdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            values = serializer.validated_data.copy()
            operation_key = values.pop("operation_key")
            movement, created = StockMovement.objects.get_or_create(operation_key=operation_key,
                defaults={"inventory": obj, "actor": request.user, **values})
            if not created:
                if (movement.inventory_id != obj.pk or movement.actor_id != request.user.pk or
                        movement.delta != values["delta"] or movement.reason != values["reason"]):
                    raise CheckoutConflict("This adjustment key was used for a different request.")
                return Response(InventorySerializer(self.get_object()).data)
            row = Inventory.objects.select_for_update().get(pk=obj.pk)
            new_stock = row.available + serializer.validated_data["delta"]
            if not 0 <= new_stock <= 2147483647:
                raise ValidationError({"delta": "The resulting stock must be within the supported non-negative range."})
            row.available = new_stock
            row.save(update_fields=["available", "updated_at"])
        return Response(InventorySerializer(row).data)


class OperationsFulfillmentSerializer(serializers.ModelSerializer):
    outlet_name = serializers.CharField(source="outlet.name")
    seller_name = serializers.CharField(source="outlet.seller.name")
    customer_name = serializers.CharField(source="order.name")
    phone = serializers.CharField(source="order.phone")
    address = serializers.CharField(source="order.address_line1")
    area = serializers.CharField(source="order.area")
    city = serializers.CharField(source="order.city")
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Fulfillment
        fields = ("id", "order", "outlet", "outlet_name", "seller_name", "status", "subtotal", "commission",
            "customer_name", "phone", "address", "area", "city", "items", "created_at")


class FulfillmentViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [OperationsPermission]
    serializer_class = OperationsFulfillmentSerializer
    pagination_class = OperationsPagination

    def get_queryset(self):
        qs = Fulfillment.objects.filter(outlet__seller_id__in=seller_ids(self.request.user)).select_related(
            "order", "outlet__seller").prefetch_related("items__variant")
        state = self.request.query_params.get("status")
        if state:
            qs = qs.filter(status=state)
        outlet = self.request.query_params.get("outlet")
        if outlet:
            if not outlet.isdigit():
                raise ValidationError({"outlet": "Expected an outlet ID."})
            qs = qs.filter(outlet_id=outlet)
        return qs.order_by("-created_at", "-id")

    @action(detail=True, methods=["post"], url_path="transition")
    def transition(self, request, pk=None):
        obj = self.get_object()
        if obj.outlet.seller_id not in seller_ids(request.user, write=True):
            raise PermissionDenied("Your role cannot change fulfillment status.")
        target = request.data.get("status")
        if not isinstance(target, str):
            raise ValidationError({"status": "Expected a status string."})
        transition_fulfillment(obj.pk, target, request.user)
        return Response(self.get_serializer(self.get_object()).data)


class OverviewView(APIView):
    permission_classes = [OperationsPermission]

    def get(self, request):
        sellers = seller_ids(request.user)
        since = timezone.now() - timedelta(hours=24)
        scoped = Fulfillment.objects.filter(outlet__seller_id__in=sellers)
        recent = scoped.filter(created_at__gte=since)
        summary = recent.aggregate(fulfillments=Count("id"), merchandise=Sum("subtotal"))
        summary["outlets"] = Outlet.objects.filter(seller_id__in=sellers).count()
        summary["active_outlets"] = Outlet.objects.filter(seller_id__in=sellers, is_active=True, seller__is_active=True).count()
        summary["by_status"] = list(recent.values("status").annotate(count=Count("id")).order_by("status"))
        summary["low_stock"] = Inventory.objects.filter(outlet__seller_id__in=sellers, available__lte=5).count()
        summary["accrued_net"] = SettlementEntry.objects.filter(fulfillment__outlet__seller_id__in=sellers,
            created_at__gte=since).aggregate(total=Sum("net"))["total"] or 0
        summary["currency"] = "BDT"
        summary["period"] = "Last 24 hours"
        summary["can_write"] = seller_ids(request.user, write=True).exists()
        return Response(summary)
