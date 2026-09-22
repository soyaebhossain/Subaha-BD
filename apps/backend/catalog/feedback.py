from django.db.models import Avg, Count
from django.shortcuts import get_object_or_404
from rest_framework import permissions, serializers
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from common.pagination import CatalogPagination
from orders.models import OrderItem
from .models import Product, ProductFeedback


class FeedbackSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()

    def get_author(self, obj):
        return obj.user.name.strip().split(" ")[0] if obj.user.name.strip() else "Customer"

    class Meta:
        model = ProductFeedback
        fields = ("id", "author", "rating", "body", "status", "verified_purchase", "created_at", "updated_at")


class FeedbackInput(serializers.Serializer):
    body = serializers.CharField(max_length=2000, min_length=3, trim_whitespace=True)
    rating = serializers.IntegerField(min_value=1, max_value=5, required=False)


class ProductFeedbackView(APIView):
    kind = "review"
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    throttle_scope = "feedback"

    def get_throttles(self):
        return [ScopedRateThrottle()] if self.request.method == "POST" else []

    def product(self, slug):
        return get_object_or_404(Product, slug=slug, is_active=True, seller__is_active=True)

    def get(self, request, slug):
        product = self.product(slug)
        rows = ProductFeedback.objects.filter(product=product, kind=self.kind, status="approved").select_related("user")
        pagination = CatalogPagination()
        response = pagination.get_paginated_response(FeedbackSerializer(pagination.paginate_queryset(rows, request), many=True).data)
        if self.kind == "review":
            summary = rows.aggregate(average=Avg("rating"), count=Count("id"))
            summary["distribution"] = {str(n): 0 for n in range(1, 6)}
            for row in rows.order_by().values("rating").annotate(total=Count("id")):
                summary["distribution"][str(row["rating"])] = row["total"]
            response.data["summary"] = summary
            mine = ProductFeedback.objects.filter(product=product, kind="review", user=request.user).select_related("user").first() if request.user.is_authenticated else None
            response.data["mine"] = FeedbackSerializer(mine).data if mine else None
        return response

    def post(self, request, slug):
        product = self.product(slug)
        serializer = FeedbackInput(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        if self.kind == "review" and "rating" not in values:
            raise serializers.ValidationError({"rating": "Select a rating from 1 to 5."})
        if self.kind == "comment" and "rating" in values:
            raise serializers.ValidationError({"rating": "Comments do not have a star rating."})
        defaults = {"body": values["body"], "rating": values.get("rating"), "status": "pending",
            "verified_purchase": OrderItem.objects.filter(product=product, order__user=request.user, fulfillment__status="DELIVERED").exists()}
        if self.kind == "review":
            row, created = ProductFeedback.objects.update_or_create(product=product, user=request.user, kind=self.kind, defaults=defaults)
        else:
            row = ProductFeedback.objects.create(product=product, user=request.user, kind=self.kind, **defaults)
            created = True
        return Response(FeedbackSerializer(row).data, status=201 if created else 200)
