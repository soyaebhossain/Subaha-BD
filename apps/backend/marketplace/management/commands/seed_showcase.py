from decimal import Decimal

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.text import slugify

from catalog.models import Category, Product, ProductVariant
from marketplace.demo_data import CATALOGUE, DIVISIONS, PACKS
from marketplace.models import Inventory, Outlet, Seller, StockMovement


class Command(BaseCommand):
    help = "Seed a LOCAL demo: 8 flagship shops, 64 district outlets, 2,500 sample products. Safe to rerun; never resets stock."

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("Showcase data is only allowed with DEBUG=True in a local development database.")
        seller, _ = Seller.objects.get_or_create(slug="subah-demo", defaults={
            "name": "Subah BD Demo", "kind": "owned", "is_active": True})
        outlets = []
        for division, districts in DIVISIONS.items():
            for kind, names in (("flagship", [division]), ("district", districts)):
                for district in names:
                    outlet, _ = Outlet.objects.get_or_create(code=f"demo-{kind}-{slugify(district)}", defaults={
                        "seller": seller, "name": f"Subah BD {district} {'Flagship' if kind == 'flagship' else 'Outlet'}",
                        "division": division, "district": district, "city": district, "outlet_type": kind,
                        "is_demo": True, "is_active": True, "zone": "dhaka" if district == "Dhaka" else "outside",
                        "priority": 10 if kind == "flagship" else 100,
                        "address": "Demo location — street address pending confirmation."})
                    outlets.append(outlet)
        products = []
        for category_index, (name, items, pack_type, price) in enumerate(CATALOGUE):
            category, _ = Category.objects.get_or_create(slug=f"demo-{slugify(name)}", defaults={"name_en": name, "sort": category_index})
            for item_index, item in enumerate(items.split(",")):
                for pack_index, (amount, unit) in enumerate(PACKS[pack_type]):
                    label = f"{amount} {unit}"
                    product, _ = Product.objects.get_or_create(slug=f"demo-{slugify(item)}-{amount}{unit}", defaults={
                        "seller": seller, "category": category, "name_en": f"{item} · {label}",
                        "base_price": (Decimal(price + item_index * 7) * Decimal(amount) / 1000).quantize(Decimal("0.01")),
                        "is_demo": True, "is_featured": category_index < 8 and item_index == 0 and pack_index == 1,
                        "desc_en": "Sample catalogue item for exploring Subah BD. Price, packaging and stock are demonstration values. Product photography and verified commercial information will be added before launch."})
                    variant, _ = ProductVariant.objects.get_or_create(product=product, sku=f"DEMO-{category_index:02}-{item_index:02}-{pack_index:02}", defaults={"weight_label": label})
                    products.append((product, variant))
        # Each product is available in both delivery zones, plus a rotating district outlet.
        dhaka = next(o for o in outlets if o.outlet_type == "flagship" and o.city == "Dhaka")
        outside = [o for o in outlets if o.outlet_type == "flagship" and o.city != "Dhaka"]
        districts = [o for o in outlets if o.outlet_type == "district"]
        existing = set(Inventory.objects.filter(outlet__in=outlets).values_list("outlet_id", "product_id", "variant_id"))
        opening = []
        for index, (product, variant) in enumerate(products):
            for outlet in (dhaka, outside[index % len(outside)], districts[index % len(districts)]):
                if (outlet.pk, product.pk, variant.pk) not in existing:
                    opening.append(Inventory(outlet=outlet, product=product, variant=variant, available=100))
        Inventory.objects.bulk_create(opening, batch_size=500)
        StockMovement.objects.bulk_create([StockMovement(inventory=row, delta=100, reason="Demo catalogue opening stock") for row in opening], batch_size=500)
        self.stdout.write(self.style.SUCCESS(f"Ready: {len(outlets)} demo outlets, {len(products)} demo products; {len(opening)} new inventory rows. Existing stock preserved."))
