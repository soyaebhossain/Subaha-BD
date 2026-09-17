from django.contrib import admin

from .models import Order, OrderItem, OrderStatusLog


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "status", "total", "zone", "delivery_time", "created_at")
    list_filter = ("status", "zone", "delivery_time")
    search_fields = ("name", "phone", "guest_email")
    inlines = [OrderItemInline]


admin.site.register(OrderStatusLog)
