from django.contrib import admin

from .models import Inventory, Membership, Outlet, Seller, SettlementEntry, StockMovement


class PlatformAdmin(admin.ModelAdmin):
    """Provisioning is platform-only; tenant staff use the scoped operations API."""
    def has_module_permission(self, request):
        return request.user.is_superuser

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_add_permission(self, request):
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Seller)
class SellerAdmin(PlatformAdmin):
    list_display = ("name", "kind", "commission_percent", "is_active")
    list_filter = ("kind", "is_active")
    search_fields = ("name", "slug")


@admin.register(Outlet)
class OutletAdmin(PlatformAdmin):
    list_display = ("code", "name", "seller", "division", "district", "outlet_type", "is_demo", "is_active", "priority")
    list_filter = ("seller", "division", "outlet_type", "is_demo", "zone", "is_active")
    search_fields = ("name", "code")

    def get_readonly_fields(self, request, obj=None):
        return ("seller",) if obj else ()


@admin.register(Membership)
class MembershipAdmin(PlatformAdmin):
    list_display = ("user", "seller", "role")
    list_filter = ("seller", "role")
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


@admin.register(Inventory)
class InventoryAdmin(PlatformAdmin):
    list_display = ("outlet", "product", "variant", "available")
    list_filter = ("outlet",)
    readonly_fields = ("available",)
    def get_readonly_fields(self, request, obj=None):
        return ("available", "outlet", "product", "variant") if obj else ("available",)


class AuditAdmin(PlatformAdmin):
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


admin.site.register(StockMovement, AuditAdmin)
admin.site.register(SettlementEntry, AuditAdmin)
