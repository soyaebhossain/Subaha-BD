# Architecture and capacity plan

## Target and implemented boundary

Target: 50–100 company-owned/franchise/seller outlets, 10,000–100,000 orders/day.
100,000 / 86,400 = 1.16 orders/second averaged over a day. A 20× peak is about 23.15 orders/second.
Peak browsing, product count, cart size, hot SKUs, retries, staff activity and delivery bursts matter more than the daily average.

This release implements BD/BDT cash-on-delivery ordering and seller-scoped operations.
It does not claim multi-country readiness or that a short local test proves daily sustained capacity.

## Data and transaction design

- Seller owns products and outlets. Seller memberships grant access to that seller's outlets, not other tenants.
- Outlet inventory is authoritative. Legacy `ProductVariant.stock` is imported once, then no longer used by checkout. Catalogue variant stock sums eligible active outlets.
- Inventory has unique outlet/product/variant constraints and non-negative stock constraints. Admin validates variant/product and seller/outlet relationships; routing independently rejects mismatched ownership.
- Checkout validates and merges duplicate cart lines; active catalogue prices and seller ownership are loaded in batches.
- An order UUID has a database uniqueness constraint. `get_or_create` within the checkout transaction serializes retries; a hash binds it to the validated payload and authenticated user.
- Selected inventory rows are locked in ascending ID order. Conditional decrements provide a second guard. Failure rolls back stock, orders, fulfillments, payments and audit rows together.
- Each outlet gets one fulfillment with price and commission snapshots. A customer can have multiple sellers/outlets in one order.
- COD immediately allocates stock. There is no unpaid-online-order hold or expiration workflow in this release.
- Cancellation before dispatch restores stock exactly once and reduces the COD amount. Order-level locking serializes concurrent fulfillment transitions for the same customer order.
- Delivery produces a unique seller accrual entry (gross, commission, net). This is **not** a bank payout, cash collection acknowledgement or reconciled seller balance.
- After dispatch, returns/refunds require a separate future workflow. Direct transition from delivered to cancelled is rejected.
- Stock adjustment keys prevent duplicate inventory movements on retry. Stock movements and financial accruals are read-only in admin.

Catalogue/order lists are bounded. Fulfillment queue uses cursor pagination and compound indexes for outlet/status/time. Customer orders are indexed by user/time. The dashboard queries a rolling 24-hour window; it counts fulfillments, not unique customer orders.

## Deployable shape

Use a TLS ingress/load balancer in front of stateless Next.js and Django/Gunicorn replicas.
Keep one authoritative PostgreSQL write database for allocation and finance, with backups and tested failover.
All replicas must share Redis for cache/throttling. Catalogue pages can use CDN/revalidation; checkout, auth and operations responses must not be shared-cached.

Use private database/cache networking, external durable media storage/CDN and centrally collected application logs.
Run migrations once per release through a direct database connection. Test restore and rollback before onboarding real sellers.
Add asynchronous notification/courier workers using an outbox when those integrations are built; Redis configuration alone does not constitute a job queue.

Budget database connections as `replicas × workers × threads + workers/admin/migration headroom`.
Size against measured CPU, I/O, lock waits, active connections and queue latency. Add a pooler if the measured connection budget requires one.
Set `DB_CONN_MAX_AGE` to match that topology; enable `DB_POOLER_TRANSACTION_MODE=1` for a transaction pooler.
Keep checkout reads on the primary database; stale read replicas must not make stock-allocation decisions.

## Production configuration

With `DEBUG=0`, startup rejects SQLite, missing Redis, a short/default secret and wildcard/empty allowed hosts.
Configure `SECRET_KEY`, `DATABASE_URL`, `REDIS_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` explicitly.
HTTPS redirect, secure cookies and HSTS are enabled. `TRUST_PROXY=1` is only safe when a trusted ingress overwrites `X-Forwarded-Proto`.
Readiness probes must use the correct HTTPS/proxy route.

The supplied Compose stack is local development only: one database, one cache and optionally one API container. It has no HA, CDN, managed backups or production TLS.
The pinned existing framework versions require a current support/security review and upgrades before public deployment.
Also complete admin MFA, credential/session lifecycle, COD fraud/phone verification, privacy retention, upload validation and dependency scanning for the real operating environment.

## Acceptance gates for 100,000 orders/day

Large-cart checkout now batches stock updates, fulfillment inserts and line inserts after acquiring all stock locks
in primary-key order. The API prefetches nested order/fulfillment data before serialization.
The 100-product/100-outlet regression fixture uses 16 service queries (previously 313) and 21 queries including
API response serialization on PostgreSQL, matching the one-product query counts in that fixture.
This reduces database round trips; it is not a proportional latency or throughput guarantee.
See [mixed-cart test instructions](../tests/load/README.md) for a larger catalogue, concurrent retries and ledger reconciliation.

1. Import representative catalogue size, seller distribution and historical order volume into staging.
2. Measure a realistic browsing/search/quote/order/staff mix. Include 1-, 10- and 100-line carts, hot products, low stock, retries, cancellations and seller filtering.
3. Sustain the expected peak (initial candidate: 25 orders/sec), then spike above it. Run a 24-hour soak and verify database growth, autovacuum, index sizes, p95/p99 latency, lock waits and memory.
4. Reconcile every accepted checkout key to one order and one payment; stock balances must equal opening inventory plus movements, without negative quantities.
5. Kill an API replica, interrupt a database connection, fail Redis, repeat requests and exercise backup restore. Set and prove recovery objectives with the operations team.
6. Establish alerts for error rates, checkout latency, low stock, stuck fulfillments, cache/database health and payout discrepancies before launch.

Candidate latency thresholds in the included synthetic test are checkout p95 < 1s, p99 < 2s, HTTP errors < 1%, no dropped iterations and >99% successful checks.
They are targets, not a contractual service level. The benchmark covers fresh small tables, one-line COD carts and evenly distributed fixture outlets; it omits WAN/CDN, images, external providers and real seller staff traffic.

## Remaining marketplace releases

- Self-service seller onboarding, verification, approval, product moderation and seller catalogue editing (current provisioning is platform-admin-led).
- Outlet-specific staff roles, postcode/geospatial service areas, operating hours, dispatch capacity and delivery SLA routing.
- COD cash collection, settlement reconciliation, seller payouts, return/refund ledger entries and chargeback handling.
- Actual payment gateways and signed/verified idempotent webhooks; API credentials and provider merchant approval are prerequisites.
- Courier tracking/labels, rider workflows, partial returns, inventory transfers and perishable batch/expiry management.
- Country/currency/tax/invoice policies, localized addresses, language completion and jurisdiction-specific seller/product compliance.

## Technical references

- [Django row locking and transaction behavior](https://docs.djangoproject.com/en/5.1/ref/models/querysets/#select-for-update)
- [Django deployment checklist](https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/)
- [Django REST Framework pagination](https://www.django-rest-framework.org/api-guide/pagination/)
