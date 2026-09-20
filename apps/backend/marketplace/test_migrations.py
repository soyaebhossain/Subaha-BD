from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase


class ExistingOrderMigrationTests(TransactionTestCase):
    def test_existing_orders_get_distinct_checkout_keys(self):
        executor = MigrationExecutor(connection)
        latest = executor.loader.graph.leaf_nodes()
        target = [("orders", "0001_initial")]
        try:
            executor.migrate(target)
            old_apps = executor.loader.project_state(target).apps
            old_order = old_apps.get_model("orders", "Order")
            for index in range(2):
                old_order.objects.create(name=f"Legacy {index}", phone="01700000000", address_line1="Legacy road")
            executor = MigrationExecutor(connection)
            executor.migrate(latest)
            new_order = executor.loader.project_state(latest).apps.get_model("orders", "Order")
            keys = list(new_order.objects.values_list("checkout_key", flat=True))
            self.assertEqual(len(keys), 2)
            self.assertEqual(len(set(keys)), 2)
            self.assertNotIn(None, keys)
        finally:
            MigrationExecutor(connection).migrate(latest)
