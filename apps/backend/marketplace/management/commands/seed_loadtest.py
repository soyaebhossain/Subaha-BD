import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from catalog.models import Product
from marketplace.models import Inventory, Outlet, Seller, StockMovement


class Command(BaseCommand):
    help = "Create explicitly labelled synthetic sellers/outlets in a LOCAL disposable database."

    def add_arguments(self, parser):
        parser.add_argument("--outlets", type=int, default=100)
        parser.add_argument("--output", required=True)

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("Load fixtures are disabled when DEBUG=False. Use a disposable local database.")
        count = options["outlets"]
        if not 1 <= count <= 100:
            raise CommandError("Choose between 1 and 100 outlets.")
        rows = []
        for index in range(count):
            seller_index = index // 10
            seller, _ = Seller.objects.get_or_create(slug=f"loadtest-seller-{seller_index}", defaults={
                "name": f"LOAD TEST Seller {seller_index}", "kind": "owned" if seller_index == 0 else "franchise",
                "is_active": True, "commission_percent": 10})
            outlet, _ = Outlet.objects.get_or_create(code=f"loadtest-outlet-{index}", defaults={
                "name": f"LOAD TEST Outlet {index}", "seller": seller, "zone": "dhaka", "city": "Dhaka", "is_active": True})
            product, _ = Product.objects.get_or_create(slug=f"loadtest-product-{index}", defaults={
                "name_en": f"LOAD TEST Product {index}", "seller": seller, "base_price": 100})
            stock, created = Inventory.objects.get_or_create(outlet=outlet, product=product, defaults={"available": 1000000})
            if created:
                StockMovement.objects.create(inventory=stock, delta=1000000, reason="Synthetic load-test opening stock")
            rows.append({"outlet_id": outlet.pk, "product_id": product.pk})
        output = Path(options["output"])
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(rows, indent=2), encoding="utf-8")
        self.stdout.write(self.style.SUCCESS(f"Prepared {count} synthetic outlets; fixture IDs written to {output}."))
