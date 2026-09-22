from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Prefetch, Sum, Q, F, Avg, Count, OuterRef, Subquery, Value
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


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    pagination_class = CatalogPagination
    queryset = Product.objects.filter(is_active=True, seller__is_active=True).select_related("category", "seller").prefetch_related(
        Prefetch("variants", queryset=ProductVariant.objects.filter(is_active=True).annotate(outlet_stock=Sum("inventory__available",
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
