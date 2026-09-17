from django.contrib import admin

from .models import Category, Product, ProductImage, ProductVariant


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name_en", "category", "base_price", "is_active", "is_featured")
    list_filter = ("is_active", "is_featured", "category")
    prepopulated_fields = {"slug": ("name_en",)}
    inlines = [ProductVariantInline, ProductImageInline]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name_en", "parent", "sort", "is_active")
    prepopulated_fields = {"slug": ("name_en",)}


admin.site.register(ProductVariant)
admin.site.register(ProductImage)
