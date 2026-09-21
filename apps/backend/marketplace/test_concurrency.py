import copy
import uuid
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from unittest import skipUnless

from django.db import connection, connections, close_old_connections
from django.test import TransactionTestCase
from rest_framework.exceptions import APIException

from orders.models import Order
from orders.services import checkout
from payments.models import Payment
from .tests import fixtures, payload


@skipUnless(connection.vendor == "postgresql", "Row-lock concurrency requires PostgreSQL")
class CheckoutConcurrencyTests(TransactionTestCase):
    def setUp(self):
        fixture = fixtures()
        self.stock = fixture[7]
        self.other_stock = fixture[8]
        self.stock.available = 2
        self.stock.save()
        self.data = payload(fixture[4], fixture[6])

    def concurrent(self, same_key=False, reverse=False):
        gate = Barrier(2)
        def worker(index):
            close_old_connections()
            data = copy.deepcopy(self.data)
            if reverse and index:
                data["items"].reverse()
            if not same_key:
                data["checkout_key"] = str(uuid.uuid4())
            try:
                gate.wait(timeout=10)
                order, created = checkout(data)
                return order.pk, created
            except APIException as error:
                return None, error.status_code
            finally:
                connections.close_all()
        with ThreadPoolExecutor(max_workers=2) as pool:
            return list(pool.map(worker, range(2)))

    def test_last_units_are_not_oversold(self):
        results = self.concurrent()
        self.assertEqual(sum(pk is not None for pk, _ in results), 1, results)
        self.stock.refresh_from_db()
        self.assertEqual(self.stock.available, 0)
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(Payment.objects.count(), 1)

    def test_concurrent_identical_retries_return_one_order(self):
        results = self.concurrent(same_key=True)
        self.assertIsNotNone(results[0][0])
        self.assertEqual(results[0][0], results[1][0])
        self.assertEqual(sorted(created for _, created in results), [False, True])
        self.stock.refresh_from_db()
        self.assertEqual(self.stock.available, 0)
        self.assertEqual(Payment.objects.count(), 1)

    def test_overlapping_multi_outlet_carts_are_atomic_in_opposite_input_order(self):
        self.other_stock.available = 2
        self.other_stock.save(update_fields=["available"])
        self.data["items"].append({"product_id": self.other_stock.product_id, "qty": 2})
        results = self.concurrent(reverse=True)
        self.assertEqual(sum(pk is not None for pk, _ in results), 1, results)
        self.stock.refresh_from_db()
        self.other_stock.refresh_from_db()
        self.assertEqual((self.stock.available, self.other_stock.available), (0, 0))
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(Order.objects.get().items.count(), 2)
        self.assertEqual(Order.objects.get().fulfillments.count(), 2)
        self.assertEqual(Payment.objects.count(), 1)
