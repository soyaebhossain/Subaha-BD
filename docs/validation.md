# Validation record — updated 2026-09-22

## Automated correctness

45 backend tests passed on local PostgreSQL 16 on 2026-09-22. Coverage includes:

- Server-side prices, typed input validation, stock shortage and full transaction rollback.
- Wrong variants, wrong sellers, inactive sellers/outlets and delivery-zone restrictions.
- Duplicate cart lines and multi-seller fulfillment/commission snapshots.
- Repeated checkout keys and concurrent identical retries.
- Concurrent purchases of the last available units.
- Seller read/write isolation, finance permissions and platform-admin protection.
- Cancellation stock restoration, partial cancellation and COD amount recalculation.
- Delivered accrual uniqueness without falsely marking COD as paid.
- Audited/idempotent inventory adjustment, underflow and database constraints.
- Existing-order migration with distinct UUIDs.
- Showcase seeding: 8 flagship shops, 64 district outlets, 2,500 demo listings, geography filters,
  production seed rejection and preservation of adjusted stock/audit history on rerun.
- Bounded query counts for 100-line/100-outlet checkout and API serialization; complete rollback on payment-write failure.
- Concurrent overlapping multi-outlet carts supplied in opposite item order.
- Larger load-fixture seeding, rerun preservation and audit rejection of ledger/count mismatches.
- Product reviews/comments: authenticated writes, pending/approved visibility, owner isolation, rating validation,
  one review per customer/product, moderation reset on edits, delivered-purchase verification and write throttling.

Product interaction browser checks passed on 2026-09-22: double-click zoom, Ctrl-drag tilt, keyboard/reset,
touch drag with tilt enabled, responsive layout, approved review display, review submission/editing and comments.
Temporary test accounts and feedback were removed. Frontend ESLint and production build passed.

Next.js production build and TypeScript checks passed. ESLint passed.
Browser integration passed on local headless Microsoft Edge: login, seller dashboard, inventory adjustment and reversal,
mobile overflow check, quote, COD checkout, fulfillment cancellation and no uncaught JavaScript errors.
Screenshots are generated in `test-results/` and are intentionally excluded from Git.

Additional storefront checks on 2026-09-20 passed: 9 mobile routes without horizontal overflow,
functional search, mobile navigation and cart quantity/removal; 2,500-product catalogue,
24 products per page, category filtering, product detail/add-to-cart, 72 demo locations,
flagship/district filters and Chattogram's 11 district outlets.
Browser integration used the current Django development server on port 18000 with PostgreSQL/Redis;
the separate load test below used Gunicorn. The current browser run is not a new load benchmark.

## Synthetic load test

Measured on 2026-09-17, before the later showcase/branding changes.

Setup: Docker Desktop on the development machine, PostgreSQL 16, Redis 7,
one Gunicorn API container with 4 workers × 4 threads. k6 ran on the same machine.
Fixtures: 100 outlets across 10 sellers, 100 simple products, 1,000,000 opening units per outlet.
Each order had one line and an explicit outlet. Every tenth checkout was retried with the same key.
The IP throttle was elevated only for the disposable local benchmark and restored afterwards.

| Measurement | Result |
|---|---:|
| Duration | 120 seconds |
| Checkout arrival rate | 25/second |
| Catalogue arrival rate | 50/second |
| New orders | 3,000 |
| Distinct checkout keys | 3,000 |
| Payment rows | 3,000 |
| Total HTTP requests (including quotes/retries) | 12,301 |
| HTTP failures | 0 |
| Failed checks | 0 |
| Dropped iterations | 0 |
| Checkout p95 | 36.00 ms |
| Checkout average | 27.40 ms |
| Checkout maximum | 424.30 ms |
| Remaining inventory | 99,997,000 units |
| Sum of stock movements | 99,997,000 units |

All configured k6 thresholds passed, including p99 < 2 seconds. The default summary did not export the numeric p99 percentile.
The before/after SQL audit found one payment per new order and matching inventory/movement totals.
Subsequent browser checks add separately labelled synthetic cancelled orders and balanced adjustment movements.

This short test is not evidence of a completed 100,000-order production day. It does not cover large historical tables,
multi-region networking, external payments/couriers, production failover, sustained peak traffic or long multi-item carts.
Use the staging acceptance gates in [the capacity plan](marketplace-scale.md) before making a production capacity commitment.

## Mixed carts and hot inventory — 2026-09-21

The isolated capacity stack used the current backend source with Gunicorn 4 workers × 4 threads,
PostgreSQL 16 and Redis 7. Docker reported 16 available CPUs and 16,726,519,808 bytes of available memory;
these are local host resources, not a proposed production server size.
The fixtures contained 2,500 products, 100 outlets and 10 sellers.
Carts alternated equally between 1, 10 and 100 products; 30% started with the same product.
Every tenth checkout sent a concurrent identical request. Each iteration also requested a quote;
catalogue traffic traversed multiple pages. This differs materially from the single-line benchmark above.

| Measurement | Result |
|---|---:|
| Duration | 120 seconds |
| Checkout arrival rate | 25/second |
| Catalogue arrival rate | 50/second |
| New orders / distinct keys / payments | 3,000 / 3,000 / 3,000 |
| Ordered / allocated units | 111,000 / 111,000 |
| HTTP requests | 12,300 |
| HTTP failures / failed checks / dropped iterations | 0 / 0 / 0 |
| Checkout p95 / p99 | 256.42 ms / 335.24 ms |
| 1-line checkout p95 / p99 | 221.84 ms / 312.98 ms |
| 10-line checkout p95 / p99 | 223.89 ms / 335.11 ms |
| 100-line checkout p95 / p99 | 284.03 ms / 341.53 ms |
| Inventory / payment mismatches | 0 / 0 |

All thresholds passed, including per-cart-size latency thresholds. The read-only audit reconciled
every load inventory row to its movement ledger and each run order to exactly one payment.
A preceding 60-second warm-up at 5 orders/second accepted 301 orders and 11,101 units, also reconciled.
Peak-run figures above exclude warm-up orders; the inventory audit includes all fixture stock movements.

[Machine-readable measurements and source hashes](benchmarks/mixed-carts-2026-09-21.json).
[Reproduction instructions](../tests/load/README.md).

This provides stronger local evidence for long carts and retries. It still does not prove 100,000 real orders/day:
24-hour soak, realistic historical tables, external services, failover and production infrastructure remain untested.
