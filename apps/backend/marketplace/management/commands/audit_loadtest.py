"""Reconcile an explicitly labelled, disposable load run without changing data."""
import json

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Count, F, Sum, Value
from django.db.models.functions import Coalesce

from marketplace.models import Inventory, StockMovement
from orders.models import Order, OrderItem
from payments.models import Payment


class Command(BaseCommand):
    help = "Read-only audit of load-test orders, payments, units and inventory ledgers."

    def add_arguments(self, parser):
        parser.add_argument("--run-label", required=True)
        parser.add_argument("--expected-orders", required=True, type=int)
        parser.add_argument("--expected-units", required=True, type=int)

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("Load-test audits are restricted to local development databases.")
        orders = Order.objects.filter(name=f'LOAD TEST {options["run_label"]}')
        inventory = Inventory.objects.filter(outlet__code__startswith="loadtest-outlet-")
        report = {
            "orders": orders.count(),
            "distinct_keys": orders.values("checkout_key").distinct().count(),
            "payments": Payment.objects.filter(order__in=orders).count(),
            "units": OrderItem.objects.filter(order__in=orders).aggregate(n=Sum("qty"))["n"] or 0,
            "allocated_units": -(StockMovement.objects.filter(order__in=orders).aggregate(n=Sum("delta"))["n"] or 0),
            "stock_mismatches": inventory.annotate(ledger=Coalesce(Sum("movements__delta"), Value(0))).exclude(available=F("ledger")).count(),
            "payment_mismatches": Payment.objects.filter(order__in=orders).exclude(amount=F("order__total")).count(),
            "orders_without_one_payment": orders.annotate(payment_count=Count("payments")).exclude(payment_count=1).count(),
        }
        self.stdout.write(json.dumps(report, indent=2))
        if (report["orders"] != options["expected_orders"] or report["distinct_keys"] != report["orders"]
                or report["payments"] != report["orders"] or report["units"] != options["expected_units"]
                or report["allocated_units"] != report["units"]
                or any(report[key] for key in ("stock_mismatches", "payment_mismatches", "orders_without_one_payment"))):
            raise CommandError("Load-test reconciliation failed. Inspect the reported counts before accepting results.")
        self.stdout.write(self.style.SUCCESS("All load-test balances reconcile."))
