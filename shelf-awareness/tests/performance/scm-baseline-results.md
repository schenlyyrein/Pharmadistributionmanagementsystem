# SCM Load Test - Baseline Results

This document records the baseline load testing results for the Supply Chain Management (SCM) procurement and supplier endpoints.

## 1. Test Configuration

- **Date of Baseline**: 2026-04-28 (Simulated/Initial Setup)
- **Target Environment**: Staging/Supabase Dev
- **Test Script Used**: `shelf-awareness/tests/performance/scm-load-test.js`

### Load Profile
- **Ramp-up**: 0 to 40 Virtual Users (VUs) over 30 seconds
- **Hold**: 40 VUs for 2 minutes
- **Ramp-down**: 40 to 0 VUs over 30 seconds

### Scenario Distribution (Weighted)
- `POST /purchase-orders` : 35%
- `GET /suppliers/:id/scorecard` : 25%
- `GET /shipments` : 20%
- `PATCH /purchase-orders/:id/approve` : 20%

### Performance Thresholds
The following criteria must be met for a successful deployment:
- PO creation latency (p95) **< 1000ms**
- Scorecard read latency (p95) **< 500ms**
- Overall SCM Error rate **< 1%**

---

## 2. Baseline Results

*Note: The following values represent the expected output structure. Actual baseline values will populate here once run against a fully configured environment.*

| Metric | Target | Observed Value | Status |
| :--- | :--- | :--- | :--- |
| **Total Requests** | N/A | `[To be recorded]` | N/A |
| **Request Rate (req/s)**| N/A | `[To be recorded]` | N/A |
| **Overall p95 Latency** | N/A | `[To be recorded]` ms | N/A |
| **PO Creation (p95)** | < 1000ms | `[To be recorded]` ms | ⏳ Pending |
| **Scorecard Read (p95)**| < 500ms | `[To be recorded]` ms | ⏳ Pending |
| **SCM Error Rate** | < 1% | `[To be recorded]` % | ⏳ Pending |
| **Checks Passed** | > 99% | `[To be recorded]` % | ⏳ Pending |

---

## 3. Interpretation & Notes

### What Passed
* [To be filled: e.g., Read endpoints returned well within the 500ms threshold.]
* [To be filled: e.g., Network stability held up under the 40 VU load profile.]

### What Failed
* [To be filled: e.g., `POST /purchase-orders` encountered elevated 403 errors due to missing Row Level Security (RLS) policies for the load testing service account.]
* [To be filled: e.g., Error rate exceeded 1% threshold.]

### Environment & Constraint Notes
Because the load test operates against the Supabase REST API directly, certain failures may be caused by schema constraints or RLS policies rather than raw performance bottlenecks. 
- Ensure the `SUPABASE_ANON_KEY` or designated test user has the appropriate `INSERT` permissions on the `purchase_orders` table.
- Dummy IDs (e.g., `test-supplier-123`) used in the k6 script may trigger 404s if referential integrity checks are enforced in the database.

### Recommended Next Steps
1. **RLS Configuration**: Validate Supabase RLS policies for the test user to eliminate expected 401/403 responses during load.
2. **Test Data Seeding**: Ensure dummy IDs used in the script actually exist in the database before running the full load test to prevent 404 skewing the error rate.
3. **Database Indexing**: If scorecard reads exceed 500ms, consider adding indices to the `supplier_scorecards` table or underlying views.
