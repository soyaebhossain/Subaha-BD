# Mixed-cart capacity checks

This isolated local stack exercises current backend source with PostgreSQL 16, Redis 7 and
Gunicorn (4 workers × 4 threads). It uses its own database/volume and ports 15432/18001.
The storefront development database is not modified. Credentials and elevated throttles are local test values only.

From the repository root in PowerShell:

```powershell
docker compose -f tests/load/compose.capacity.yaml up -d --build api
docker compose -f tests/load/compose.capacity.yaml exec -T api python manage.py migrate
docker compose -f tests/load/compose.capacity.yaml exec -T api python manage.py seed_loadtest --outlets 100 --products 2500 --output /tmp/fixtures.local.json
docker compose -f tests/load/compose.capacity.yaml cp api:/tmp/fixtures.local.json tests/load/capacity-fixtures.local.json
$env:RUN_LABEL = 'mixed-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
$env:ORDER_RATE = '25'
$env:BROWSE_RATE = '50'
$env:DURATION = '2m'
docker compose -f tests/load/compose.capacity.yaml --profile test run --rm k6
```

Use `--no-build` in place of `--build` only if the dependency image already exists and dependencies have not changed.
The API mounts the current backend source. Restart the API after source changes before measuring them.

Default carts cycle through 1, 10 and 100 products. Each product belongs to one of 100 outlets across 10 sellers.
Thirty percent of iterations start from the same product to create contention, and every tenth iteration sends two
simultaneous requests with the same checkout key. Both must return the same order, with exactly one 201 response.
Catalogue requests traverse pages of the 2,500-product fixture. Each checkout is quoted and its response total/line count checked.
Configure `CART_SIZES`, `HOT_PERCENT`, `ORDER_RATE`, `BROWSE_RATE` and `DURATION` through the environment.

k6 exits nonzero for failed checks, excessive error/latency rates or dropped iterations.
`summary.local.json` includes workload metadata, order/unit counters and p95/p99 values, including each cart size.
The JSON files are ignored by Git; preserve summaries under a unique filename when comparing runs.
Do not rerun with the same run label: the audit intentionally checks all orders with that label.

Reconcile the resulting database with k6's accepted order/unit counters:

```powershell
$capacitySummary = Get-Content tests/load/summary.local.json -Raw | ConvertFrom-Json
$expectedOrders = $capacitySummary.metrics.created_orders.values.count
$expectedUnits = $capacitySummary.metrics.ordered_units.values.count
docker compose -f tests/load/compose.capacity.yaml exec -T api python manage.py audit_loadtest --run-label $env:RUN_LABEL --expected-orders $expectedOrders --expected-units $expectedUnits
docker compose -f tests/load/compose.capacity.yaml stop
```

The audit checks unique checkout keys, one payment per order, matching payment amounts, ordered/allocated units,
and every load-test inventory balance against its movement ledger. It exits nonzero on discrepancies.
It is intended for load runs without subsequent cancellation/fulfillment changes.
Seeding again preserves existing stock; changing fixture topology requires a separate disposable database.

A two-minute local benchmark does not establish production daily capacity. Run a representative staging soak,
historical-data tests, failure/restore exercises, and real payment/courier integrations before making that commitment.
