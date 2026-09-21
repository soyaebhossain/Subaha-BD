from io import StringIO
from pathlib import Path
from tempfile import TemporaryDirectory

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings

from catalog.models import Product
from marketplace.models import Inventory, Outlet
from orders.services import checkout
from .tests import payload


@override_settings(DEBUG=True)
class LoadToolTests(TestCase):
    def seed(self, output):
        call_command("seed_loadtest", outlets=2, products=5, output=output, stdout=StringIO())

    def test_catalogue_size_and_rerun_preserve_consumed_stock(self):
        with TemporaryDirectory() as directory:
            output = str(Path(directory) / "fixtures.json")
            self.seed(output)
            data = payload(Product.objects.first())
            data["customer"]["name"] = "LOAD TEST audit-fixture"
            checkout(data)
            self.seed(output)
        self.assertEqual(Outlet.objects.count(), 2)
        self.assertEqual(Product.objects.count(), 5)
        self.assertEqual(Inventory.objects.filter(available=999998).count(), 1)
        call_command("audit_loadtest", run_label="audit-fixture", expected_orders=1, expected_units=2, stdout=StringIO())
        with self.assertRaises(CommandError):
            call_command("audit_loadtest", run_label="audit-fixture", expected_orders=2, expected_units=2, stdout=StringIO())
        stock = Inventory.objects.first()
        stock.available -= 1
        stock.save(update_fields=["available"])
        with self.assertRaises(CommandError):
            call_command("audit_loadtest", run_label="audit-fixture", expected_orders=1, expected_units=2, stdout=StringIO())

    def test_invalid_catalogue_size_does_not_create_fixtures(self):
        with self.assertRaises(CommandError):
            call_command("seed_loadtest", outlets=10, products=9, output="unused.json", stdout=StringIO())
        self.assertFalse(Outlet.objects.exists())
