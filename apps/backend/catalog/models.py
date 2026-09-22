from django.db import models
from django.conf import settings
from django.db.models import Q

from common.models import TimestampedModel


class Category(TimestampedModel):
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children"
    )
    name_en = models.CharField(max_length=255)
    name_bn = models.CharField(max_length=255, blank=True)
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)
    sort = models.IntegerField(default=0)

    class Meta:
        ordering = ("sort", "name_en")

    def __str__(self) -> str:
        return self.name_en


class Product(TimestampedModel):
    is_demo = models.BooleanField(default=False)
    seller = models.ForeignKey("marketplace.Seller", null=True, blank=True, on_delete=models.PROTECT, related_name="products")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="products")
    name_en = models.CharField(max_length=255)
    name_bn = models.CharField(max_length=255, blank=True)
    desc_en = models.TextField(blank=True)
    desc_bn = models.TextField(blank=True)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    slug = models.SlugField(unique=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)

    def __str__(self) -> str:
        return self.name_en


class ProductVariant(TimestampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    sku = models.CharField(max_length=64, blank=True)
    weight_label = models.CharField(max_length=64, blank=True)
    stock = models.IntegerField(default=0)
    extra_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return f"{self.product.name_en} - {self.weight_label or self.sku}"


class ProductImage(TimestampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    sort = models.IntegerField(default=0)

    class Meta:
        ordering = ("sort", "id")

    def __str__(self) -> str:
        return self.image.url if self.image else ""


class ProductFeedback(TimestampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="feedback")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    kind = models.CharField(max_length=10, choices=[("review", "Review"), ("comment", "Comment")])
    rating = models.PositiveSmallIntegerField(null=True, blank=True)
    body = models.TextField(max_length=2000)
    status = models.CharField(max_length=10, default="pending", choices=[("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected")])
    verified_purchase = models.BooleanField(default=False, editable=False)

    class Meta:
        ordering = ("-created_at", "-id")
        indexes = [models.Index(fields=["product", "kind", "status", "-created_at"])]
        constraints = [
            models.UniqueConstraint(fields=["product", "user"], condition=Q(kind="review"), name="one_product_review_per_user"),
            models.CheckConstraint(condition=(Q(kind="review", rating__isnull=False, rating__gte=1, rating__lte=5) | Q(kind="comment", rating__isnull=True)), name="feedback_rating_matches_kind"),
        ]
