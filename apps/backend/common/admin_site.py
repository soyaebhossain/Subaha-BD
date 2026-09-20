from django.contrib.admin import AdminSite


class PlatformAdminSite(AdminSite):
    site_header = "Subaha BD platform administration"

    def has_permission(self, request):
        return request.user.is_active and request.user.is_superuser
