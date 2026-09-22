from decimal import Decimal, ROUND_FLOOR, ROUND_CEILING
from rest_framework import filters, permissions, viewsets, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Prefetch, Sum, Q, F, Avg, Count, OuterRef, Subquery, Value, Min, Max, DecimalField, ExpressionWrapper
from django.db.models.functions import Coalesce

from .models import Category, Product, ProductVariant, ProductFeedback
from common.pagination import CatalogPagination
from .serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True).order_by("sort")
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"


class PriceRangeInput(serializers.Serializer):
    price_from = serializers.IntegerField(min_value=1, max_value=100, default=1)
    price_to = serializers.IntegerField(min_value=1, max_value=100, default=100)

    def validate(self, attrs):
        if attrs["price_from"] > attrs["price_to"]:
            raise serializers.ValidationError("Minimum price percentage cannot exceed maximum.")
        return attrs


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    pagination_class = CatalogPagination
    queryset = Product.objects.filter(is_active=True, seller__is_active=True).select_related("category", "seller").prefetch_related(
        Prefetch("variants", queryset=ProductVariant.objects.filter(is_active=True).order_by("-created_at", "-pk").annotate(outlet_stock=Sum("inventory__available",
            filter=Q(inventory__outlet__is_active=True, inventory__outlet__seller__is_active=True,
                inventory__outlet__seller_id=F("product__seller_id")), default=0))), "images"
    ).order_by("-created_at", "-id")
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name_en", "name_bn", "desc_en", "desc_bn"]
    ordering_fields = ["base_price", "created_at"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return super().get_serializer_class()

    def get_queryset(self):
        qs = super().get_queryset()
        first_variant = ProductVariant.objects.filter(product_id=OuterRef("pk"), is_active=True).order_by("-created_at", "-pk")
        qs = qs.annotate(listing_price=ExpressionWrapper(F("base_price") + Coalesce(
            Subquery(first_variant.values("extra_price")[:1]), Value(Decimal("0"))), output_field=DecimalField(max_digits=12, decimal_places=2)))
        ratings = ProductFeedback.objects.filter(product_id=OuterRef("pk"), kind="review", status="approved").order_by().values("product_id")
        qs = qs.annotate(
            rating_average=Subquery(ratings.annotate(value=Avg("rating")).values("value")),
            review_count=Coalesce(Subquery(ratings.annotate(value=Count("id")).values("value")), Value(0)),
        )
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category__slug=category)
        delivery_time = self.request.query_params.get("delivery_time")
        if delivery_time == "60":
            qs = qs.filter(outlet_inventory__outlet__zone="dhaka", outlet_inventory__outlet__is_active=True,
                outlet_inventory__available__gt=0, outlet_inventory__outlet__seller_id=F("seller_id")).distinct()
        is_featured = self.request.query_params.get("is_featured")
        if is_featured in ["1", "true"]:
            qs = qs.filter(is_featured=True)
        ordering = {"price_asc": "base_price", "price_desc": "-base_price", "newest": "-created_at"}.get(self.request.query_params.get("sort"))
        if ordering:
            qs = qs.order_by(ordering, "-id")
        return qs

    def filter_queryset(self, queryset):
        qs = super().filter_queryset(queryset)
        if self.action != "list":
            return qs
        selection = PriceRangeInput(data=self.request.query_params)
        selection.is_valid(raise_exception=True)
        lower, upper = selection.validated_data["price_from"], selection.validated_data["price_to"]
        bounds = qs.aggregate(minimum=Min("listing_price"), maximum=Max("listing_price"))
        minimum, maximum = bounds["minimum"], bounds["maximum"]
        self.price_range = {**bounds, "from_percent": lower, "to_percent": upper, "selected_min": None, "selected_max": None}
        if minimum is not None:
            span = maximum - minimum
            start = (minimum + span * Decimal(lower - 1) / 99).quantize(Decimal("0.01"), rounding=ROUND_FLOOR)
            end = (minimum + span * Decimal(upper - 1) / 99).quantize(Decimal("0.01"), rounding=ROUND_CEILING)
            self.price_range.update(selected_min=start, selected_max=end)
            qs = qs.filter(listing_price__gte=start, listing_price__lte=end)
        return qs

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data["price_range"] = self.price_range
        return response
