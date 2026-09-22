"""Local demo-only browser check. Ephemeral accounts/feedback are removed afterwards."""
import os
import secrets
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps/backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()
from django.conf import settings
from django.contrib.auth import get_user_model
from catalog.models import Product, ProductFeedback
from rest_framework_simplejwt.tokens import RefreshToken
from playwright.sync_api import sync_playwright, expect

if not settings.DEBUG or settings.DATABASES["default"]["ENGINE"] != "django.db.backends.sqlite3":
    raise RuntimeError("Use the local SQLite demo database and API on port 8000.")
product = Product.objects.filter(is_demo=True, is_active=True, seller__is_active=True).first()
if not product:
    raise RuntimeError("Run seed_showcase first.")
users = []
try:
    for name in ("Browser Customer", "Sample Reviewer"):
        users.append(get_user_model().objects.create_user(email=f"interaction-{secrets.token_hex(6)}@example.test", name=name))
    ProductFeedback.objects.create(product=product, user=users[1], kind="review", rating=4, body="Sample review for the browser check.", status="approved")
    token = str(RefreshToken.for_user(users[0]).access_token)
    output = ROOT / "test-results"
    output.mkdir(exist_ok=True)
    errors = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="msedge", headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(f"http://localhost:3000/products/{product.slug}")
        stage = page.locator(".gallery-stage")
        expect(stage).to_be_visible(timeout=30000)
        stage.dblclick()
        expect(page.get_by_role("button", name="Zoom out", exact=True)).to_have_attribute("aria-pressed", "true")
        bounds = stage.bounding_box()
        x, y = bounds["x"] + bounds["width"] / 2, bounds["y"] + bounds["height"] / 2
        page.keyboard.down("Control")
        page.mouse.move(x, y)
        page.mouse.down()
        page.mouse.move(x + 90, y + 50, steps=10)
        page.mouse.up()
        page.keyboard.up("Control")
        transform = page.locator(".gallery-image-plane").get_attribute("style")
        assert "rotateY(0deg)" not in transform and "scale(2)" in transform, transform
        stage.focus()
        page.keyboard.press("Escape")
        expect(page.get_by_role("button", name="Zoom in", exact=True)).to_have_attribute("aria-pressed", "false")
        page.keyboard.press("ArrowRight")
        assert "rotateY(5deg)" in page.locator(".gallery-image-plane").get_attribute("style")
        expect(page.get_by_role("link", name="Sign in to contribute")).to_be_visible()
        expect(page.get_by_text("Sample review for the browser check.", exact=True)).to_be_visible()
        page.get_by_role("tab", name="Ratings & reviews", exact=True).click()
        expect(page.get_by_text("Sample review for the browser check.", exact=True)).to_be_visible()
        page.evaluate("data => localStorage.setItem('subahbd-user',JSON.stringify(data))", {"version": 0, "state": {"token": token, "user": {"id": users[0].pk, "email": users[0].email, "name": users[0].name}}})
        page.reload()
        page.get_by_label("Your rating", exact=True).select_option("5")
        page.get_by_label("Your experience", exact=True).fill("Browser review awaiting moderation.")
        page.get_by_role("button", name="Submit review", exact=True).click()
        expect(page.get_by_text("Your review is saved and awaiting approval.", exact=True)).to_be_visible()
        page.get_by_role("button", name="Edit your review", exact=True).click()
        expect(page.get_by_label("Your experience", exact=True)).to_have_value("Browser review awaiting moderation.")
        page.get_by_label("Your rating", exact=True).select_option("3")
        page.get_by_role("button", name="Update review", exact=True).click()
        expect(page.get_by_text("Your review is saved and awaiting approval.", exact=True)).to_be_visible()
        page.screenshot(path=str(output / "product-reviews-desktop.png"), full_page=True)
        page.get_by_role("tab", name="Ratings & reviews", exact=True).focus()
        page.keyboard.press("ArrowRight")
        expect(page.get_by_role("tab", name="Comments & questions", exact=True)).to_have_attribute("aria-selected", "true")
        page.get_by_label("Comment or question", exact=True).fill("Browser product question awaiting moderation.")
        page.get_by_role("button", name="Submit comment", exact=True).click()
        expect(page.get_by_text("Your comment is saved and awaiting approval.", exact=True)).to_be_visible()
        page.set_viewport_size({"width": 390, "height": 844})
        stage.scroll_into_view_if_needed()
        page.get_by_role("button", name="3D tilt", exact=True).click()
        expect(page.get_by_role("button", name="3D tilt", exact=True)).to_have_attribute("aria-pressed", "true")
        stage.scroll_into_view_if_needed()
        bounds = stage.bounding_box()
        x, y = bounds["x"] + bounds["width"] / 2, bounds["y"] + bounds["height"] / 2
        touch = page.context.new_cdp_session(page)
        touch.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y}]})
        touch.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x + 60, "y": y + 30}]})
        touch.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
        assert "rotateY(0deg)" not in page.locator(".gallery-image-plane").get_attribute("style")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        page.screenshot(path=str(output / "product-comments-mobile.png"), full_page=True)
        assert not errors, errors
        browser.close()
    rows = ProductFeedback.objects.filter(user=users[0])
    assert rows.count() == 2
    assert rows.get(kind="review").rating == 3
    assert all(row.status == "pending" and not row.verified_purchase for row in rows)
finally:
    for user in users:
        user.delete()
print("Product interactions passed: double-click zoom, Ctrl-drag tilt, keyboard/reset, mobile layout, approved reviews, authenticated review/edit and moderated comments.")
