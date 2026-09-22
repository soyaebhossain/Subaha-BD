# Subah BD marketplace

Next.js storefront and Django REST API with seller/franchise isolation, outlet inventory,
COD checkout, split fulfillment and an operations dashboard.

The engineering target is 50–100 outlets and 10,000–100,000 **orders** per day.
The included local benchmark is evidence for a specific synthetic workload, not a production capacity guarantee.
See [architecture, capacity and rollout](docs/marketplace-scale.md) and [validation results](docs/validation.md).

## Run locally on Windows

From the repository root, using PowerShell:

```powershell
python -m venv .venv-local
& ./.venv-local/Scripts/python.exe -m pip install -r apps/backend/requirements.txt
$env:DEBUG = '1'
& ./.venv-local/Scripts/python.exe apps/backend/manage.py migrate
& ./.venv-local/Scripts/python.exe apps/backend/manage.py seed_showcase
& ./.venv-local/Scripts/python.exe apps/backend/manage.py createsuperuser
& ./.venv-local/Scripts/python.exe apps/backend/manage.py runserver 127.0.0.1:8000
```

In another terminal:

```powershell
cd apps/frontend
npm.cmd ci
npm.cmd run dev
```

Frontend: http://localhost:3000 · Operations: http://localhost:3000/operations · Platform admin: http://127.0.0.1:8000/admin/

The default local database is SQLite; it is only for single-process development. PostgreSQL is required for production and concurrency validation.
Set `NEXT_PUBLIC_API_BASE=http://localhost:8000` in `apps/frontend/.env.local` when needed; restart/rebuild Next.js after changing public environment variables.

## Provision sellers and outlets

### Local demonstration catalogue

`seed_showcase` creates 8 divisional flagship shops, 64 district outlets and 2,500 sample listings
(250 item families × 10 pack sizes) across 25 categories. Each listing has a selectable pack, demo pricing,
and audited stock in Dhaka, one other divisional flagship and one district outlet.
The public catalogue uses pagination rather than loading all 2,500 listings in a browser at once.
The outlet directory supports division and flagship/district filters.

All seeded products and outlets carry `is_demo=True` and visible demo labels. Packaging illustrations are generic samples,
not product photographs. Outlets have no invented street addresses, opening dates or live service promises.
The seed command requires `DEBUG=True`, is transactional, and does not replenish stock on reruns.
It adds its own namespaced data without deleting existing outlets or products; use a fresh development database for exactly 72 locations.
The local empty legacy bootstrap outlet was deactivated, preserving its record.

These samples use an owned demo seller. Actual franchise/seller assignments require verified partner records;
the existing seller model, membership permissions and fulfillment routing support all three ownership types.
Start production with verified catalogue/stock/outlet information instead of copying this demonstration database.
For importing an existing catalogue, use `bootstrap_outlet` as described below instead of the showcase command.

Original brand logo and image provenance: [visual assets](docs/visual-assets.md).

### Real seller provisioning

1. Create a platform superuser using the command above. There are no default passwords.
2. In platform admin, create active sellers (`owned`, `franchise`, or `seller`) and their outlets. Configure commission percentages and delivery zones.
3. Assign each product to a seller; add any variants. Product ownership cannot be changed in admin once outlet stock exists.
4. Create inventory rows for each outlet/product/variant. They start at zero. Use Operations → Inventory → Adjust stock with a reason to record opening counts and receipts.
5. Create user accounts and seller memberships. `manager` and `operator` can update fulfillment and stock; `finance` is read-only. A membership covers that seller's outlets. Only platform superusers enter Django admin.
6. Sign in through `/account`, then open `/operations`. Platform superusers see all sellers; other accounts see only their memberships.

`bootstrap_outlet` imports unowned legacy products into `Dhaka Main`. It copies existing variant stock **once**; products without variants start at zero. It never invents stock or duplicates a prior import. Take a backup and review the source counts before using it on a populated database. Old orders remain readable but are not retroactively assigned to outlets.

## PostgreSQL and Redis development environment

```powershell
docker compose up -d postgres redis
$env:DEBUG = '1'
$env:DATABASE_URL = 'postgres://subaha:local-development-only@127.0.0.1:55432/subaha_scale'
$env:REDIS_URL = 'redis://127.0.0.1:56379/0'
& ./.venv-local/Scripts/python.exe apps/backend/manage.py migrate
```

Compose uses localhost-only ports and explicitly local credentials. Do not publish it as a production deployment.
The optional `app` profile starts a Gunicorn API at port 18000:

```powershell
docker compose --profile app up -d --build api
docker compose exec api python manage.py migrate
```

Migrations run as a separate release step, not independently on every API replica.
Run `collectstatic` and configure static/media delivery before deploying the admin in production.

## Tests

```powershell
$env:DEBUG = '1'
$env:DATABASE_URL = 'postgres://subaha:local-development-only@127.0.0.1:55432/subaha_scale'
& ./.venv-local/Scripts/python.exe apps/backend/manage.py test marketplace --noinput
& ./.venv-local/Scripts/python.exe apps/backend/manage.py makemigrations --check --dry-run
cd apps/frontend
npm.cmd run lint
npm.cmd run build
```

The PostgreSQL tests include simultaneous checkout/retry races and migration of existing orders.
SQLite skips the two row-lock concurrency tests. CI uses PostgreSQL.

## Load test

For 2,500 products, mixed 1/10/100-line carts, hot-stock contention, concurrent retries and automated ledger checks,
use the [isolated capacity test stack](tests/load/README.md). The simpler benchmark below remains available.

Only use the **disposable** local `subaha_scale` database. Fixtures are labelled `LOAD TEST` and should not enter your real catalogue.

```powershell
$env:DEBUG = '1'
$env:DATABASE_URL = 'postgres://subaha:local-development-only@127.0.0.1:55432/subaha_scale'
& ./.venv-local/Scripts/python.exe apps/backend/manage.py seed_loadtest --outlets 100 --output tests/load/fixtures.local.json
$env:CHECKOUT_RATE = '100000/min'
docker compose --profile app up -d --build api
$loadPath = (Resolve-Path tests/load).Path
docker run --rm -e ALLOW_LOAD_TEST=1 -e ORDER_RATE=25 -e BROWSE_RATE=50 -e DURATION=2m --mount "type=bind,source=$loadPath,target=/scripts" --mount "type=bind,source=$loadPath,target=/results" grafana/k6:1.6.1 run /scripts/marketplace.js
Remove-Item Env:CHECKOUT_RATE
docker compose --profile app up -d api
```

The elevated throttle is for a single local load generator only; restore normal limits afterwards.
The script fails when checks, error rate, checkout latency or dropped-iteration thresholds fail. It writes `tests/load/summary.local.json`.
Seeding again does not replenish stock or erase orders. Use a separately named disposable database for independent clean baselines.

Optional browser integration check (Microsoft Edge installed):

```powershell
& ./.venv-local/Scripts/python.exe -m pip install playwright
& ./.venv-local/Scripts/python.exe tests/browser_smoke.py
```

Run it with the same PostgreSQL variables, Next.js on 3000 and the Compose API on 18000.
It creates an ephemeral seller account, routes browser API calls to the disposable API,
checks login/operations/adjustment/checkout/cancellation, and removes the account afterwards.
Synthetic audit records remain; screenshots are saved under ignored `test-results/`.

## API changes

### Product images, reviews and comments

Product detail images support double-click 2× zoom, pointer drag, Ctrl-drag 3D tilt and reset.
When zoomed, a normal drag pans the image. On touch screens, enable **3D tilt** before dragging;
ordinary unzoomed touch gestures still scroll the page. Enter toggles zoom, arrow keys tilt and Escape resets.
This is a perspective effect on an image or demo illustration, not a real 360° product model.

`GET/POST /api/v1/products/{slug}/reviews/` and `/comments/` power the separate feedback tabs.
Guests can read approved feedback; authenticated customers can submit it (10 writes/hour/user across both types).
Reviews require 1–5 stars; each account has one review per product and can update it.
Comments do not have star ratings. All new or edited feedback awaits moderation, and only approved reviews
contribute to the average/distribution. Review owners can see their own moderation status.
Public author labels use a first name, never the account email field. Feedback is rendered as plain text.

Platform superusers moderate at `/admin/catalog/productfeedback/`, using **Approve selected feedback** or **Reject selected feedback**.
The **Verified purchase** badge is calculated on submission from an authenticated customer's delivered order item;
clients cannot set it. No fake reviews are seeded.

Optional local demo browser check: `python tests/product_interaction_smoke.py` with `DEBUG=1`, SQLite API on 8000,
Next.js on 3000 and Playwright/Edge installed. It removes its temporary accounts and feedback after the test.

### Checkout and operations

- `POST /api/v1/checkout/create-order` requires a UUID `checkout_key`, `customer`, `address`, non-empty `items`, `zone`, `delivery_time` and `payment_method: "cod"`.
- Repeating the same key and validated payload returns the original order (200); changed payload or user returns 409. New orders return 201.
- Quote and checkout prices come from the database. At most 100 lines and 100 units per product/variant are accepted.
- `outlet_id` is optional. Without it, each line routes to the first eligible outlet by configured priority, then ID. No nearest-location or capacity-based routing is implied.
- Delivery is charged **per outlet fulfillment**: Dhaka 80 BDT / outside 120 BDT, with 20 BDT extra for Dhaka's 60-minute option. These existing fee rules are not a delivery guarantee.
- Products and customer order lists now return `{count, next, previous, results}`. Products default to 24 rows, capped at 100. Fulfillment operations use cursor pagination.
- Stock adjustments require a UUID `operation_key`; replaying an identical adjustment does not change stock again.
- Online-payment routes return 503 until real gateway verification, refunds and reconciliation are implemented. COD is created atomically with checkout; no second confirmation request is needed.
- `/health/live` checks process availability; `/health/ready` checks database and cache access.

This release is the multi-outlet marketplace foundation. International tax/currency support, seller bank payouts, real online payments, returns after dispatch and courier integrations still require implementation and operational agreements.
