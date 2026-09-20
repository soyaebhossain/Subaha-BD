from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Payment
from .serializers import PaymentSerializer


class OnlinePaymentUnavailable(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        return Response({"detail": "Online payments are not enabled. Use cash on delivery."}, status=503)

    def get(self, request):
        return self.post(request)


# Fail closed until gateway verification, idempotent webhooks and refunds exist.
SSLCommerzInitView = OnlinePaymentUnavailable
SSLCommerzIPNView = OnlinePaymentUnavailable
SSLCommerzResultView = OnlinePaymentUnavailable
BkashCreateView = OnlinePaymentUnavailable
BkashExecuteView = OnlinePaymentUnavailable
NagadInitView = OnlinePaymentUnavailable
NagadCallbackView = OnlinePaymentUnavailable


class CODConfirmView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        payment = Payment.objects.filter(order_id=request.data.get("order_id"), order__user=request.user, provider="cod").first()
        if payment is None:
            return Response({"detail": "Order not found."}, status=404)
        return Response({"status": payment.status})


class PaymentListView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        if not request.user.is_superuser:
            return Response(status=403)
        return Response(PaymentSerializer(Payment.objects.order_by("-created_at")[:100], many=True).data)
