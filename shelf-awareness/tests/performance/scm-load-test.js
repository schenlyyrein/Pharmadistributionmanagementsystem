import http from "k6/http";
import { check, sleep } from "k6";

/**
 * SCM-S5-004-T1: Weighted Load Test for SCM procurement and supplier endpoints.
 * 
 * Distribution:
 * - POST /purchase-orders = 35%
 * - GET /suppliers/:id/scorecard = 25%
 * - GET /shipments = 20%
 * - PATCH /purchase-orders/:id/approve = 20%
 */

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const API_KEY = __ENV.SUPABASE_ANON_KEY || __ENV.API_KEY || "";

export const options = {
  stages: [
    { duration: "30s", target: 40 }, // Ramp up
    { duration: "2m", target: 40 },  // Hold
    { duration: "30s", target: 0 },  // Ramp down
  ],
};

// Common headers
const headers = {
  "Content-Type": "application/json",
  apikey: API_KEY,
  Authorization: `Bearer ${API_KEY}`,
};

/**
 * Helper to create a purchase order (35% weight)
 */
function createPurchaseOrder() {
  const url = `${BASE_URL}/rest/v1/purchase_orders`;
  const payload = JSON.stringify({
    supplier_id: "test-supplier-123",
    items: [{ sku: "SKU-001", quantity: 10 }],
    status: "pending",
  });

  const res = http.post(url, payload, { headers });
  
  check(res, {
    "create PO status is 201 or 401/403": (r) => [201, 401, 403].includes(r.status),
  });
}

/**
 * Helper to read supplier scorecard (25% weight)
 */
function readSupplierScorecard() {
  // Using a dummy ID for the load test
  const supplierId = "test-supplier-123";
  const url = `${BASE_URL}/rest/v1/supplier_scorecards?supplier_id=eq.${supplierId}`;

  const res = http.get(url, { headers });

  check(res, {
    "read scorecard status is 200 or 401/403/404": (r) => [200, 401, 403, 404].includes(r.status),
  });
}

/**
 * Helper to read shipments (20% weight)
 */
function readShipments() {
  const url = `${BASE_URL}/rest/v1/shipments`;

  const res = http.get(url, { headers });

  check(res, {
    "read shipments status is 200 or 401/403/404": (r) => [200, 401, 403, 404].includes(r.status),
  });
}

/**
 * Helper to approve purchase order (20% weight)
 */
function approvePurchaseOrder() {
  // Using a dummy ID for the load test
  const poId = "po-test-123";
  const url = `${BASE_URL}/rest/v1/purchase_orders?id=eq.${poId}`;
  const payload = JSON.stringify({
    status: "approved",
    approved_at: new Date().toISOString(),
  });

  const res = http.patch(url, payload, { headers });

  check(res, {
    "approve PO status is 200 or 204 or 401/403/404": (r) => [200, 204, 401, 403, 404].includes(r.status),
  });
}

export default function () {
  const r = Math.random();

  if (r < 0.35) {
    createPurchaseOrder();
  } else if (r < 0.60) {
    readSupplierScorecard();
  } else if (r < 0.80) {
    readShipments();
  } else {
    approvePurchaseOrder();
  }

  // Pace the VUs
  sleep(1);
}
