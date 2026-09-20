# Subah BD visual assets

## Original brand logo

The user supplied `F:\GFX\Subaha bd\logo 1.png`.
An unchanged copy is saved at `apps/frontend/public/images/subah-bd-logo.png` and used in the header and footer.
The same original image is used as `apps/frontend/src/app/icon.png`.
No AI redraw, crop or recolouring was applied to the logo.

The storefront, account, cart, checkout and operations dashboard use blue `#063eae`,
navy `#103477`, indigo `#373a88` and light blue surfaces inspired by this supplied artwork.
Brand spelling follows the original wordmark: **Subah BD**.

## Decorative hero image

Saved path: `apps/frontend/public/images/market-basket.png`.
Tool mode: built-in `image_gen.imagegen`, new image generation.
This is decorative campaign art, not evidence of a stocked product.

Final generation prompt:

> Use case: photorealistic-natural. Asset type: decorative hero photography for Subaha BD grocery marketplace website. Create an exceptionally polished editorial studio still life: a natural woven grocery basket full of fresh green lettuce, leafy herbs, ripe red tomatoes, yellow lemons, carrots and a small brown paper bread bag; a few loose tomatoes and lemons beside it. Warm ivory seamless studio backdrop and a pale cream tabletop, subtle natural shadows, warm sunlight from upper left, realistic produce and woven textures. Landscape 3:2 composition, whole basket centered with ample breathing room, premium lifestyle food photography, tasteful restrained green/cream palette with vibrant produce accents. No people, no text, no letters, no logos, no labels, no watermarks. This is decorative campaign art, not a product listing.

## Demo catalogue illustrations

`DemoProductArt.tsx` renders generic labelled packaging using HTML, CSS and the existing SVG icon component.
It only appears for `is_demo` listings without photographs and is labelled “Sample illustration”.
Verified product photographs take precedence when uploaded.

## Location reference

The division/district mapping in `apps/backend/marketplace/demo_data.py` follows the
[Bangladesh National Portal district list](https://bangladesh.gov.bd/views/district-list/).
That administrative list is the geographic reference; it does not establish real Subah BD shop locations.
