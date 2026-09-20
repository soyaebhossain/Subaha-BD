"""Responsive storefront smoke test against the local Next.js development server."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

output = Path(__file__).resolve().parent.parent / "test-results"
output.mkdir(exist_ok=True)
errors = []
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1100}, device_scale_factor=1)
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto("http://localhost:3000/")
    expect(page.get_by_role("heading", name="Good things. Closer to home.")).to_be_visible(timeout=30000)
    page.wait_for_function("Array.from(document.images).filter(i=>i.alt.includes('woven basket')).every(i=>i.complete && i.naturalWidth > 0)")
    page.screenshot(path=str(output / "storefront-desktop.png"), full_page=True)
    page.get_by_role("search").get_by_label("Search products").fill("rice")
    page.get_by_role("button", name="Submit search").click()
    expect(page).to_have_url("http://localhost:3000/products?search=rice")
    expect(page.get_by_label("Search catalogue")).to_have_value("rice")
    page.get_by_role("button", name="Clear filters").click()
    expect(page).to_have_url("http://localhost:3000/products")
    page.set_viewport_size({"width": 390, "height": 844})
    for path in ["/", "/products", "/outlets", "/cart", "/checkout", "/account", "/operations", "/contact", "/privacy"]:
        page.goto("http://localhost:3000" + path)
        page.wait_for_load_state("domcontentloaded")
        expect(page.locator("main h1").first).to_be_visible(timeout=30000)
        expect(page.get_by_role("status", name="Loading page")).to_have_count(0)
        page.wait_for_function("Array.from(document.images).every(i=>i.complete)")
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), f"Mobile overflow on {path}"
        page.screenshot(path=str(output / ("mobile-" + (path.strip("/") or "home") + ".png")), full_page=True)
    page.get_by_role("button", name="Open navigation").click()
    navigation = page.get_by_role("navigation", name="Mobile navigation")
    expect(navigation).to_be_visible()
    navigation.get_by_role("link", name="Our outlets").click()
    expect(page).to_have_url("http://localhost:3000/outlets")
    expect(page.get_by_role("navigation", name="Mobile navigation")).to_have_count(0)
    page.evaluate("data=>localStorage.setItem('subahbd-cart',JSON.stringify(data))", {"version": 0, "state": {
        "items": [{"id": "ui-smoke", "productId": 999999, "name": "UI test item", "price": 100, "qty": 1}],
        "zone": "dhaka", "deliveryTime": "120"}})
    page.goto("http://localhost:3000/cart")
    expect(page.get_by_role("heading", name="UI test item")).to_be_visible()
    page.get_by_role("button", name="Increase UI test item quantity").click()
    expect(page.get_by_role("link", name="Shopping bag, 2 items")).to_be_visible()
    page.get_by_role("button", name="Remove UI test item", exact=True).click()
    expect(page.get_by_role("heading", name="Your next favourite is waiting.")).to_be_visible()
    assert not errors, errors
    browser.close()
print("UI passed: desktop hero, functional search/filters, 9 mobile routes without overflow, mobile navigation, live cart and quantity/removal; no uncaught JavaScript errors.")
