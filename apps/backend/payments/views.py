from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order
from .models import Payment, WebhookLog
from .serializers import PaymentSerializer


class SSLCommerzInitView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        order_id = request.data.get("order_id")
        order = Order.objects.filter(id=order_id).first()
        if not order:
            return Response({"detail": "Order not found"}, status=404)
        Payment.objects.create(order=order, provider="sslcommerz", amount=order.total, status="INITIATED")
        # Placeholder redirect URL
        return Response({"redirect_url": f"https://sandbox.sslcommerz.com/{order_id}"})


class SSLCommerzIPNView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        WebhookLog.objects.create(provider="sslcommerz", payload=request.data)
        return Response({"status": "received"})


class SSLCommerzResultView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        status_param = request.query_params.get("status", "unknown")
        return Response({"status": status_param})


class BkashCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        order_id = request.data.get("order_id")
        order = Order.objects.filter(id=order_id).first()
        if not order:
            return Response({"detail": "Order not found"}, status=404)
        Payment.objects.create(order=order, provider="bkash", amount=order.total, status="INITIATED")
        return Response({"redirect_url": f"https://bkash.com/pay/{order_id}", "payment_id": f"bkash-{order_id}"})


class BkashExecuteView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payment_id = request.data.get("paymentID")
        return Response({"status": "executed", "payment_id": payment_id})


class NagadInitView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        order_id = request.data.get("order_id")
        order = Order.objects.filter(id=order_id).first()
        if not order:
            return Response({"detail": "Order not found"}, status=404)
        Payment.objects.create(order=order, provider="nagad", amount=order.total, status="INITIATED")
        return Response({"redirect_url": f"https://nagad.com/pay/{order_id}"})


class NagadCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        WebhookLog.objects.create(provider="nagad", payload=request.query_params)
        return Response({"status": "received"})


class CODConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        order_id = request.data.get("order_id")
        order = Order.objects.filter(id=order_id).first()
        if not order:
            return Response({"detail": "Order not found"}, status=404)
        Payment.objects.create(order=order, provider="cod", amount=order.total, status="PENDING")
        return Response({"status": "cod_pending"})


class PaymentListView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        payments = Payment.objects.all().order_by("-created_at")[:100]
        return Response(PaymentSerializer(payments, many=True).data)
