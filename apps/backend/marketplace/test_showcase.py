from io import StringIO

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from catalog.models import Product
from marketplace.models import Inventory, Outlet, StockMovement


@override_settings(DEBUG=True)
class ShowcaseTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command("seed_showcase", stdout=StringIO())

    def test_geography_catalogue_and_filtered_public_api(self):
        self.assertEqual(Outlet.objects.filter(is_demo=True, outlet_type="flagship").count(), 8)
        self.assertEqual(Outlet.objects.filter(is_demo=True, outlet_type="district").count(), 64)
        self.assertEqual(Outlet.objects.values("division").distinct().count(), 8)
        self.assertEqual(Product.objects.filter(is_demo=True).count(), 2500)
        self.assertEqual(Inventory.objects.count(), 7500)
        client = APIClient()
        response = client.get("/api/v1/outlets/", {"division": "Chattogram", "outlet_type": "district"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 11)
        self.assertTrue(all(row["is_demo"] for row in response.data["results"]))
        response = client.get("/api/v1/products/", {"search": "Miniket rice", "page_size": 100})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 10)
        self.assertTrue(all(row["is_demo"] for row in response.data["results"]))

    def test_rerun_preserves_stock_and_audit(self):
        stock = Inventory.objects.first()
        stock.available = 97
        stock.save(update_fields=["available"])
        StockMovement.objects.create(inventory=stock, delta=-3, reason="Test adjustment")
        count = StockMovement.objects.count()
        call_command("seed_showcase", stdout=StringIO())
        stock.refresh_from_db()
        self.assertEqual(stock.available, 97)
        self.assertEqual(StockMovement.objects.count(), count)
        self.assertEqual(Product.objects.count(), 2500)
        self.assertEqual(Outlet.objects.count(), 72)

    @override_settings(DEBUG=False)
    def test_production_seed_is_rejected(self):
        with self.assertRaises(CommandError):
            call_command("seed_showcase", stdout=StringIO())
