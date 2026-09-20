from django.core.management.base import BaseCommand
from django.db import transaction

from catalog.models import Product
from marketplace.models import Inventory, Outlet, Seller, StockMovement


class Command(BaseCommand):
    help = "Assign unowned legacy products to the primary outlet; copy existing variant stock once."

    @transaction.atomic
    def handle(self, *args, **options):
        seller, _ = Seller.objects.get_or_create(slug="subaha-bd", defaults={"name": "Subaha BD", "kind": "owned", "is_active": True})
        outlet, _ = Outlet.objects.get_or_create(code="dhaka-main", defaults={"seller": seller, "name": "Dhaka Main", "city": "Dhaka", "zone": "dhaka", "is_active": True})
        count = 0
        for product in Product.objects.filter(seller__isnull=True).prefetch_related("variants"):
            product.seller = seller
            product.save(update_fields=["seller"])
            variants = list(product.variants.all())
            for variant in variants or [None]:
                stock = max(0, variant.stock) if variant else 0
                inventory, created = Inventory.objects.get_or_create(outlet=outlet, product=product, variant=variant, defaults={"available": stock})
                if created:
                    StockMovement.objects.create(inventory=inventory, delta=stock, reason="Legacy inventory import")
                    count += 1
        self.stdout.write(self.style.SUCCESS(f"Imported {count} stock rows. Products without variants start at zero; adjust counted stock in Operations."))
