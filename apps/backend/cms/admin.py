from django.contrib import admin

from .models import Banner, Page


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ("slug", "title_en", "is_active")
    search_fields = ("slug", "title_en")


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ("title", "section", "is_active", "sort", "created_at")
    list_filter = ("section", "is_active")
    search_fields = ("title",)
