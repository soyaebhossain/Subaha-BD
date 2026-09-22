"""Price-range filtering against the local seeded showcase."""
from pathlib import Path
import json
from urllib.request import urlopen
from playwright.sync_api import sync_playwright, expect

output = Path(__file__).resolve().parents[1] / "test-results"
output.mkdir(exist_ok=True)
with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 1000})
    page.goto("http://localhost:3000/products?category=demo-rice-grains&range_check=1")
    upper = page.get_by_role("slider", name="Maximum price percentage")
    lower = page.get_by_role("slider", name="Minimum price percentage")
    expect(upper).to_be_enabled(timeout=30000)
    expect(page.get_by_role("combobox", name="Sort products")).to_have_count(0)
    expect(upper).to_have_value("100")
    expect(upper).to_have_css("position", "absolute")
    box = upper.bounding_box()
    page.mouse.move(box["x"] + box["width"] - 9, box["y"] + box["height"] / 2)
    page.mouse.down()
    page.mouse.move(box["x"] + box["width"] * .75, box["y"] + box["height"] / 2, steps=10)
    page.mouse.up()
    assert 70 <= int(upper.input_value()) <= 80
    upper.focus()
    page.keyboard.press("Home")
    for _ in range(49):
        page.keyboard.press("ArrowRight")
    expect(upper).to_have_value("50")
    lower.focus()
    page.keyboard.press("End")
    expect(lower).to_have_value("50")
    page.keyboard.press("Home")
    expect(lower).to_have_value("1")
    page.get_by_role("button", name="Apply filters", exact=True).click()
    expect(page).to_have_url("http://localhost:3000/products?category=demo-rice-grains&price_to=50")
    expect(upper).to_have_value("50")
    with urlopen("http://localhost:8000/api/v1/products/?category=demo-rice-grains&price_to=50") as response:
        payload = json.load(response)
    assert 0 < payload["count"] < 100
    assert all(float(row["base_price"]) <= float(payload["price_range"]["selected_max"]) for row in payload["results"])
    expect(page.locator(".catalog-top")).to_contain_text(f'{payload["count"]} products')
    page.reload()
    expect(upper).to_have_value("50")
    page.screenshot(path=str(output / "price-range-desktop.png"), full_page=True)
    page.locator(".filter-panel").screenshot(path=str(output / "price-filter-panel.png"))
    page.set_viewport_size({"width": 390, "height": 844})
    expect(upper).to_be_visible()
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    page.screenshot(path=str(output / "price-range-mobile.png"), full_page=True)
    page.get_by_role("button", name="Clear filters", exact=True).click()
    expect(page).to_have_url("http://localhost:3000/products")
    expect(upper).to_have_value("100")
    expect(lower).to_have_value("1")
    browser.close()
print("Price range passed: keyboard sliders, bound clamping, real API filtering, URL/reload persistence, reset and mobile layout.")
