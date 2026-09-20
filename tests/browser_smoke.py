"""Local-only browser integration check against the disposable load-test API."""
import json
import os
from pathlib import Path
import secrets
import re
import sys
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "apps/backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
django.setup()

from django.conf import settings
from django.contrib.auth import get_user_model
from marketplace.models import Inventory, Membership, Seller
from orders.models import Order
from orders.services import transition_fulfillment
from playwright.sync_api import sync_playwright, expect

if not settings.DEBUG or settings.DATABASES["default"]["NAME"] != "subaha_scale":
    raise RuntimeError("Run only against the disposable local subaha_scale database.")

seller = Seller.objects.get(slug="loadtest-seller-0")
stock = Inventory.objects.filter(outlet__seller=seller).select_related("product", "outlet").first()
password = secrets.token_urlsafe(24)
user = get_user_model().objects.create_user(email=f"browser-{secrets.token_hex(6)}@example.test", password=password, name="Browser test manager")
Membership.objects.create(user=user, seller=seller, role="manager")
output = ROOT / "test-results"
output.mkdir(exist_ok=True)
errors = []
try:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="msedge", headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        page.on("pageerror", lambda error: errors.append(str(error)))

        def api_route(route):
            url = urlsplit(route.request.url)
            route.continue_(url="http://127.0.0.1:18000" + url.path + ("?" + url.query if url.query else ""))

        page.route("**/api/v1/**", api_route)
        page.goto("http://localhost:3000/account")
        page.get_by_label("Email", exact=True).fill(user.email)
        page.get_by_label("Password", exact=True).fill(password)
        page.get_by_role("button", name="Login", exact=True).last.click()
        expect(page.get_by_text("Signed in. Your orders and checkout will use this profile.")).to_be_visible(timeout=20000)
        page.goto("http://localhost:3000/operations")
        expect(page.get_by_text("Active outlets", exact=True)).to_be_visible(timeout=20000)
        expect(page.get_by_role("heading", name="Outlet control centre")).to_be_visible()
        page.screenshot(path=str(output / "operations-desktop.png"), full_page=True)
        page.get_by_role("button", name="inventory", exact=True).click()
        page.get_by_role("button", name="Adjust stock", exact=True).first.click()
        page.get_by_label("Quantity change (+ add, − remove)").fill("1")
        page.get_by_label("Reason", exact=True).fill("Browser smoke adjustment")
        page.get_by_role("button", name="Save adjustment", exact=True).click()
        expect(page.get_by_role("dialog")).to_have_count(0)
        page.get_by_role("button", name="Adjust stock", exact=True).first.click()
        page.get_by_label("Quantity change (+ add, − remove)").fill("-1")
        page.get_by_label("Reason", exact=True).fill("Reverse browser smoke adjustment")
        page.get_by_role("button", name="Save adjustment", exact=True).click()
        expect(page.get_by_role("dialog")).to_have_count(0)
        page.set_viewport_size({"width": 390, "height": 844})
        page.screenshot(path=str(output / "operations-mobile.png"), full_page=True)
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "Mobile page overflows"
        page.evaluate("data => localStorage.setItem('subahbd-cart', JSON.stringify(data))", {"version": 0, "state": {
            "items": [{"id": "smoke", "productId": stock.product_id, "name": stock.product.name_en, "price": 100, "qty": 1}],
            "zone": "dhaka", "deliveryTime": "120"}})
        page.goto("http://localhost:3000/checkout")
        page.get_by_label("Full name", exact=True).fill("Browser smoke customer")
        page.get_by_label("Phone", exact=True).fill("01700000000")
        page.get_by_label("Street address", exact=True).fill("Test road")
        page.get_by_role("button", name="Calculate delivery & total").click()
        submit = page.get_by_role("button", name="Place cash-on-delivery order")
        expect(submit).to_be_enabled()
        submit.click()
        expect(page.get_by_text("ORDER CONFIRMED", exact=True)).to_be_visible(timeout=20000)
        page.screenshot(path=str(output / "checkout-confirmed-mobile.png"), full_page=True)
        order_id = int(page.get_by_role("heading", name=re.compile("Thank you")).inner_text().split("#")[-1])
        page.goto("http://localhost:3000/operations")
        card = page.locator("article").filter(has_text=f"Order #{order_id}").first
        expect(card).to_be_visible(timeout=20000)
        card.get_by_role("button", name="cancelled", exact=True).click()
        page.get_by_role("button", name="Confirm", exact=True).click()
        expect(page.get_by_role("dialog")).to_have_count(0)
        assert not errors, errors
        browser.close()
    assert Order.objects.get(pk=order_id).status == "CANCELLED"
    print("Browser passed: login, seller dashboard, stock adjustment, responsive layout, COD checkout, cancellation; no JavaScript errors.")
finally:
    for order in Order.objects.filter(user=user):
        for fulfillment in order.fulfillments.filter(status__in=["CONFIRMED", "PREPARING"]):
            transition_fulfillment(fulfillment.pk, "CANCELLED", user)
    user.delete()
