from django.contrib import admin

from .models import Coupon, CouponUsage


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ("code", "type", "value", "is_active", "start_at", "end_at")
    search_fields = ("code",)


admin.site.register(CouponUsage)
