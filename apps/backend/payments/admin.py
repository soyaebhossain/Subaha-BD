from django.contrib import admin

from .models import Payment, WebhookLog


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "provider", "amount", "status", "created_at")
    list_filter = ("provider", "status")
    search_fields = ("order__id", "trx_id")


admin.site.register(WebhookLog)
