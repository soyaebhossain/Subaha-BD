from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient

from catalog.models import ProductFeedback
from marketplace.tests import fixtures, payload
from orders.services import checkout, transition_fulfillment


class ProductFeedbackTests(TestCase):
    def setUp(self):
        cache.clear()
        data = fixtures()
        self.product, self.variant = data[4], data[6]
        self.user = get_user_model().objects.create_user(email="reviewer@example.test", name="Amina Rahman", password="review-test-password")
        self.other = get_user_model().objects.create_user(email="other@example.test", name="Other Reviewer", password="review-test-password")
        self.client = APIClient()
        self.url = f"/api/v1/products/{self.product.slug}/reviews/"
        self.comments = f"/api/v1/products/{self.product.slug}/comments/"

    def test_guest_can_read_but_cannot_write(self):
        self.assertEqual(self.client.get(self.url).status_code, 200)
        self.assertEqual(self.client.post(self.url, {"rating": 5, "body": "Good product"}).status_code, 401)

    def test_moderation_summary_owner_privacy_and_review_update(self):
        self.client.force_authenticate(self.user)
        result = self.client.post(self.url, {"rating": 4, "body": "Useful product", "verified_purchase": True, "status": "approved", "user": self.other.pk})
        self.assertEqual(result.status_code, 201)
        self.assertFalse(result.data["verified_purchase"])
        self.assertEqual(result.data["status"], "pending")
        mine = self.client.get(self.url).data
        self.assertEqual(mine["mine"]["id"], result.data["id"])
        self.assertEqual(mine["summary"]["count"], 0)
        self.client.force_authenticate(self.other)
        self.assertIsNone(self.client.get(self.url).data["mine"])
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(self.url).data["results"], [])
        ProductFeedback.objects.update(status="approved")
        public = self.client.get(self.url).data
        self.assertEqual(public["summary"]["average"], 4)
        self.assertEqual(public["summary"]["distribution"]["4"], 1)
        self.assertEqual(public["results"][0]["author"], "Amina")
        self.assertNotIn("email", public["results"][0])
        self.client.force_authenticate(self.user)
        updated = self.client.post(self.url, {"rating": 2, "body": "Updated experience"})
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.data["id"], result.data["id"])
        self.assertEqual(ProductFeedback.objects.count(), 1)
        self.assertEqual(self.client.get(self.url).data["summary"]["count"], 0)

    def test_verified_purchase_requires_delivered_item(self):
        order, _ = checkout(payload(self.product, self.variant), user=self.user)
        self.client.force_authenticate(self.user)
        self.assertFalse(self.client.post(self.url, {"rating": 5, "body": "Before delivery"}).data["verified_purchase"])
        fulfillment = order.fulfillments.get()
        for state in ("PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"):
            transition_fulfillment(fulfillment.pk, state, self.user)
        self.assertTrue(self.client.post(self.url, {"rating": 5, "body": "After delivery"}).data["verified_purchase"])

    def test_comments_are_separate_and_rating_is_validated(self):
        self.client.force_authenticate(self.user)
        for data in ({"body": "No rating"}, {"body": "Too high", "rating": 6}, {"body": "  ", "rating": 4}):
            self.assertEqual(self.client.post(self.url, data).status_code, 400)
        self.assertEqual(self.client.post(self.comments, {"body": "A question", "rating": 5}).status_code, 400)
        self.assertEqual(self.client.post(self.comments, {"body": "Is this available?"}).status_code, 201)
        self.assertEqual(self.client.post(self.comments, {"body": "What is the pack size?"}).status_code, 201)
        ProductFeedback.objects.update(status="approved")
        self.assertEqual(self.client.get(self.comments).data["count"], 2)
        self.assertEqual(self.client.get(self.url).data["count"], 0)

    def test_inactive_product_is_not_accessible_and_posts_are_throttled(self):
        self.client.force_authenticate(self.user)
        for i in range(10):
            self.assertEqual(self.client.post(self.comments, {"body": f"Question {i}"}).status_code, 201)
        self.assertEqual(self.client.post(self.comments, {"body": "Too many comments"}).status_code, 429)
        self.product.is_active = False
        self.product.save(update_fields=["is_active"])
        self.assertEqual(self.client.get(self.url).status_code, 404)

    def test_database_prevents_duplicate_review_and_invalid_rating(self):
        ProductFeedback.objects.create(product=self.product, user=self.user, kind="review", rating=5, body="First review")
        with self.assertRaises(IntegrityError), transaction.atomic():
            ProductFeedback.objects.create(product=self.product, user=self.user, kind="review", rating=4, body="Duplicate")
        with self.assertRaises(IntegrityError), transaction.atomic():
            ProductFeedback.objects.create(product=self.product, user=self.other, kind="review", rating=None, body="Invalid")

    def test_catalogue_rating_uses_only_approved_reviews(self):
        ProductFeedback.objects.create(product=self.product, user=self.user, kind="review", rating=5, body="Approved", status="approved")
        pending = ProductFeedback.objects.create(product=self.product, user=self.other, kind="review", rating=2, body="Pending")
        ProductFeedback.objects.create(product=self.product, user=self.other, kind="comment", body="A comment", status="approved")
        url = f"/api/v1/products/{self.product.slug}/"
        self.assertEqual(self.client.get(url).data["rating_average"], 5)
        self.assertEqual(self.client.get(url).data["review_count"], 1)
        pending.status = "approved"
        pending.save(update_fields=["status"])
        response = self.client.get("/api/v1/products/", {"search": "Rice"}).data["results"][0]
        self.assertEqual(response["rating_average"], 3.5)
        self.assertEqual(response["review_count"], 2)
        unrated = self.client.get("/api/v1/products/", {"search": "Oil"}).data["results"][0]
        self.assertIsNone(unrated["rating_average"])
        self.assertEqual(unrated["review_count"], 0)


class ProductPriceRangeTests(TestCase):
    def setUp(self):
        data = fixtures()
        self.product = data[4]
        self.client = APIClient()

    def test_full_range_includes_both_extremes_and_variant_price(self):
        response = self.client.get("/api/v1/products/").data
        self.assertEqual(response["count"], 2)
        self.assertEqual(response["price_range"]["minimum"], 105)
        self.assertEqual(response["price_range"]["maximum"], 200)
        limited = self.client.get("/api/v1/products/", {"price_to": 50}).data
        self.assertEqual(limited["count"], 1)
        self.assertEqual(limited["results"][0]["id"], self.product.pk)
        self.assertEqual(limited["price_range"]["maximum"], 200)
        upper = self.client.get("/api/v1/products/", {"price_from": 100}).data
        self.assertEqual(upper["count"], 1)
        self.assertEqual(upper["results"][0]["name_en"], "Oil")

    def test_bounds_follow_search_and_empty_or_single_price_is_valid(self):
        single = self.client.get("/api/v1/products/", {"search": "Rice", "price_from": 25, "price_to": 75}).data
        self.assertEqual(single["count"], 1)
        self.assertEqual(single["price_range"]["selected_min"], 105)
        self.assertEqual(single["price_range"]["selected_max"], 105)
        empty = self.client.get("/api/v1/products/", {"search": "nonexistent"}).data
        self.assertEqual(empty["count"], 0)
        self.assertIsNone(empty["price_range"]["minimum"])

    def test_invalid_percentages_are_rejected(self):
        for selection in ({"price_from": 0}, {"price_to": 101}, {"price_to": "NaN"}, {"price_from": 80, "price_to": 20}):
            self.assertEqual(self.client.get("/api/v1/products/", selection).status_code, 400)
