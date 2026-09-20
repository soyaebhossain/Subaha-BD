from django.contrib import admin

from .models import Order, OrderItem, OrderStatusLog
from marketplace.admin import AuditAdmin


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "variant", "qty", "price", "total", "fulfillment", "inventory", "product_name")
    can_delete = False
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(AuditAdmin):
    list_display = ("id", "name", "status", "total", "zone", "delivery_time", "created_at")
    list_filter = ("status", "zone", "delivery_time")
    search_fields = ("name", "phone", "guest_email")
    inlines = [OrderItemInline]


admin.site.register(OrderStatusLog, AuditAdmin)
