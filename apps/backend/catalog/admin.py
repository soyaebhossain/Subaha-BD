from django.contrib import admin

from .models import Category, Product, ProductImage, ProductVariant
from marketplace.admin import PlatformAdmin


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0


@admin.register(Product)
class ProductAdmin(PlatformAdmin):
    list_display = ("name_en", "seller", "category", "base_price", "is_demo", "is_active", "is_featured")
    list_filter = ("is_demo", "is_active", "is_featured", "category")
    search_fields = ("name_en", "name_bn", "slug")
    prepopulated_fields = {"slug": ("name_en",)}
    inlines = [ProductVariantInline, ProductImageInline]

    def get_readonly_fields(self, request, obj=None):
        return ("seller",) if obj and obj.outlet_inventory.exists() else ()


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name_en", "parent", "sort", "is_active")
    prepopulated_fields = {"slug": ("name_en",)}


admin.site.register(ProductVariant)
admin.site.register(ProductImage)
