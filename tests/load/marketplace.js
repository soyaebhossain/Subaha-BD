import http from "k6/http";
import { check } from "k6";
import crypto from "k6/crypto";
import execution from "k6/execution";
import { SharedArray } from "k6/data";

const fixtures = new SharedArray("outlets", () => JSON.parse(open(__ENV.FIXTURES || "./fixtures.local.json")));
const base = __ENV.BASE_URL || "http://host.docker.internal:18000";
if (__ENV.ALLOW_LOAD_TEST !== "1") throw new Error("Set ALLOW_LOAD_TEST=1 only for your disposable local/staging target.");
export const options = {
  scenarios: {
    checkout: { executor: "constant-arrival-rate", exec: "checkout", rate: Number(__ENV.ORDER_RATE || 25), timeUnit: "1s",
      duration: __ENV.DURATION || "2m", preAllocatedVUs: 30, maxVUs: 100 },
    browsing: { executor: "constant-arrival-rate", exec: "browse", rate: Number(__ENV.BROWSE_RATE || 50), timeUnit: "1s",
      duration: __ENV.DURATION || "2m", preAllocatedVUs: 20, maxVUs: 100 },
  },
  thresholds: {
    checks: ["rate>0.99"], http_req_failed: ["rate<0.01"],
    "http_req_duration{name:checkout}": ["p(95)<1000", "p(99)<2000"],
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
  const fixture = fixtures[execution.scenario.iterationInTest % fixtures.length];
  const cart = { items: [{ product_id: fixture.product_id, qty: 1 }], outlet_id: fixture.outlet_id, zone: "dhaka", delivery_time: "120" };
  const headers = { "Content-Type": "application/json" };
  const quote = http.post(`${base}/api/v1/cart/quote`, JSON.stringify(cart), { headers, tags: { name: "quote" } });
  check(quote, { "quote accepted": r => r.status === 200 });
  const body = JSON.stringify({ ...cart, checkout_key: uuid(), customer: { name: "LOAD TEST Customer", phone: "01700000000" }, address: { line1: "LOAD TEST Road" }, payment_method: "cod" });
  const result = http.post(`${base}/api/v1/checkout/create-order`, body, { headers, tags: { name: "checkout" } });
  check(result, { "order created": r => r.status === 201 });
  if (result.status === 201 && execution.scenario.iterationInTest % 10 === 0) {
    const retry = http.post(`${base}/api/v1/checkout/create-order`, body, { headers, tags: { name: "retry" } });
    check(retry, { "retry returns same order": r => r.status === 200 && r.json("id") === result.json("id") });
  }
}

export function browse() {
  const result = http.get(`${base}/api/v1/products/?page_size=24`, { tags: { name: "catalog" } });
  check(result, { "catalog available": r => r.status === 200 && r.json("results").length <= 24 });
}

export function handleSummary(data) {
  return { "/results/summary.local.json": JSON.stringify(data, null, 2) };
}
