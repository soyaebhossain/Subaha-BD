import http from "k6/http";
import { check } from "k6";
import crypto from "k6/crypto";
import execution from "k6/execution";
import { SharedArray } from "k6/data";
import { Counter } from "k6/metrics";

const fixtures = new SharedArray("outlets", () => JSON.parse(open(__ENV.FIXTURES || "./fixtures.local.json")));
const base = __ENV.BASE_URL || "http://host.docker.internal:18000";
if (__ENV.ALLOW_LOAD_TEST !== "1") throw new Error("Set ALLOW_LOAD_TEST=1 only for your disposable local/staging target.");
const sizes = (__ENV.CART_SIZES || "1").split(",").map(Number);
if (sizes.some(n => !Number.isInteger(n) || n < 1 || n > 100 || n > fixtures.length)) throw new Error("CART_SIZES must contain supported sizes from 1 to 100, no larger than the fixture list.");
const hotPercent = Number(__ENV.HOT_PERCENT || 0);
if (!Number.isFinite(hotPercent) || hotPercent < 0 || hotPercent > 100) throw new Error("HOT_PERCENT must be 0–100.");
const label = __ENV.RUN_LABEL || "LOAD TEST";
const createdOrders = new Counter("created_orders");
const orderedUnits = new Counter("ordered_units");
export const options = {
  summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
  scenarios: {
    checkout: { executor: "constant-arrival-rate", exec: "checkout", rate: Number(__ENV.ORDER_RATE || 25), timeUnit: "1s",
      duration: __ENV.DURATION || "2m", preAllocatedVUs: 30, maxVUs: 100 },
    browsing: { executor: "constant-arrival-rate", exec: "browse", rate: Number(__ENV.BROWSE_RATE || 50), timeUnit: "1s",
      duration: __ENV.DURATION || "2m", preAllocatedVUs: 20, maxVUs: 100 },
  },
  thresholds: {
    checks: ["rate>0.99"], http_req_failed: ["rate<0.01"],
    "http_req_duration{name:checkout}": ["p(95)<1000", "p(99)<2000"],
    ...Object.fromEntries(sizes.map(size => [`http_req_duration{name:checkout,cart_size:${size}}`, ["p(95)<1000", "p(99)<2000"]])),
    dropped_iterations: ["count==0"],
  },
};

function uuid() {
  const bytes = new Uint8Array(crypto.randomBytes(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const h = Array.from(bytes, value => value.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function checkout() {
  const iteration = execution.scenario.iterationInTest;
  const size = sizes[iteration % sizes.length];
  const start = iteration % 100 < hotPercent ? 0 : (iteration * 97) % fixtures.length;
  const selected = Array.from({ length: size }, (_, i) => fixtures[(start + i) % fixtures.length]);
  const cart = { items: selected.map(row => ({ product_id: row.product_id, qty: 1 })), zone: "dhaka", delivery_time: "120" };
  if (size === 1) cart.outlet_id = selected[0].outlet_id;
  const headers = { "Content-Type": "application/json" };
  const quote = http.post(`${base}/api/v1/cart/quote`, JSON.stringify(cart), { headers, tags: { name: "quote" } });
  check(quote, { "quote accepted": r => r.status === 200 });
  const body = JSON.stringify({ ...cart, checkout_key: uuid(), customer: { name: `LOAD TEST ${label}`, phone: "01700000000" }, address: { line1: "LOAD TEST Road" }, payment_method: "cod" });
  const url = `${base}/api/v1/checkout/create-order`;
  const params = { headers, tags: { name: "checkout", cart_size: String(size) } };
  const results = iteration % 10 === 0
    ? http.batch([{ method: "POST", url, body, params }, { method: "POST", url, body, params: { headers, tags: { name: "retry", cart_size: String(size) } } }])
    : [http.post(url, body, params)];
  check(results, { "exactly one order created": rows => rows.filter(r => r.status === 201).length === 1 });
  const result = results.find(r => r.status === 201);
  if (result) {
    createdOrders.add(1);
    orderedUnits.add(size);
    check(result, { "response has all lines and quoted total": r => r.json("items").length === size && Number(r.json("total")) === Number(quote.json("total")) });
  }
  if (results.length === 2) {
    check(results, { "concurrent retry returns same order": rows => rows.every(r => [200, 201].includes(r.status)) && rows[0].json("id") === rows[1].json("id") });
  }
}

export function browse() {
  const pages = Math.max(1, Math.ceil(fixtures.length / 24));
  const page = execution.scenario.iterationInTest % pages + 1;
  const result = http.get(`${base}/api/v1/products/?page_size=24&page=${page}`, { tags: { name: "catalog" } });
  check(result, { "catalog available": r => r.status === 200 && r.json("results").length <= 24 });
}

export function handleSummary(data) {
  data.workload = { label, cart_sizes: sizes, hot_percent: hotPercent, fixture_products: fixtures.length };
  return { "/results/summary.local.json": JSON.stringify(data, null, 2) };
}
