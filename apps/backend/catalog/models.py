from django.db import models

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
