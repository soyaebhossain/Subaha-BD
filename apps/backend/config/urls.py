from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.views import AddressViewSet, MeView, RegisterView
from catalog.views import CategoryViewSet, ProductViewSet
from cms.views import BannerViewSet, PageViewSet
from orders.views import CartQuoteView, CheckoutCreateOrderView, MyOrdersViewSet
from payments.views import (
    BkashCreateView,
    BkashExecuteView,
    CODConfirmView,
    NagadCallbackView,
    NagadInitView,
    SSLCommerzIPNView,
    SSLCommerzInitView,
    SSLCommerzResultView,
)

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"products", ProductViewSet, basename="product")
router.register(r"pages", PageViewSet, basename="page")
router.register(r"banners", BannerViewSet, basename="banner")
router.register(r"my/orders", MyOrdersViewSet, basename="my-orders")
router.register(r"addresses", AddressViewSet, basename="address")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/register", RegisterView.as_view(), name="auth-register"),
    path("api/v1/auth/login", TokenObtainPairView.as_view(), name="auth-login"),
    path("api/v1/auth/refresh", TokenRefreshView.as_view(), name="auth-refresh"),
    path("api/v1/auth/me", MeView.as_view(), name="auth-me"),
    path("api/v1/cart/quote", CartQuoteView.as_view(), name="cart-quote"),
    path("api/v1/checkout/create-order", CheckoutCreateOrderView.as_view(), name="checkout-create"),
    # Payments
    path("api/v1/payments/sslcommerz/init", SSLCommerzInitView.as_view(), name="ssl-init"),
    path("api/v1/payments/sslcommerz/ipn", SSLCommerzIPNView.as_view(), name="ssl-ipn"),
    path("api/v1/payments/sslcommerz/success", SSLCommerzResultView.as_view(), name="ssl-success"),
    path("api/v1/payments/sslcommerz/fail", SSLCommerzResultView.as_view(), name="ssl-fail"),
    path("api/v1/payments/sslcommerz/cancel", SSLCommerzResultView.as_view(), name="ssl-cancel"),
    path("api/v1/payments/bkash/create", BkashCreateView.as_view(), name="bkash-create"),
    path("api/v1/payments/bkash/execute", BkashExecuteView.as_view(), name="bkash-execute"),
    path("api/v1/payments/nagad/init", NagadInitView.as_view(), name="nagad-init"),
    path("api/v1/payments/nagad/callback", NagadCallbackView.as_view(), name="nagad-callback"),
    path("api/v1/payments/cod/confirm", CODConfirmView.as_view(), name="cod-confirm"),
    path("api/v1/", include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
