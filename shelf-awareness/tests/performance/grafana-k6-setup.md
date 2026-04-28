# K6 and Grafana Integration

This document outlines how to connect the k6 load tests to a Grafana dashboard using Prometheus Remote Write.

## 1. Required Configuration

To send metrics to your Grafana/Prometheus instance from GitHub Actions, you must configure the following **GitHub Secret** in your repository settings:

- `K6_PROMETHEUS_RW_SERVER_URL`: The Remote Write URL for your Prometheus instance (e.g., `https://prometheus-blocks-prod-us-central1.grafana.net/api/prom/push`)

If your Prometheus instance requires authentication, you can pass credentials within the URL or as an additional environment variable configured in the workflow.

## 2. GitHub Actions Integration

The `.github/workflows/k6-load-test.yml` workflow automatically detects the presence of the `K6_PROMETHEUS_RW_SERVER_URL` secret. 

If configured, it executes k6 with the experimental Prometheus output flag:
```bash
k6 run -o experimental-prometheus-rw tests/performance/scm-load-test.js
```

If the secret is missing, it runs the load test locally and outputs only to the console, preventing pipeline failures in unconfigured environments.

## 3. Running Locally with Grafana Output

To run the load test locally and push metrics to your Grafana instance:

```bash
K6_PROMETHEUS_RW_SERVER_URL="<your_prometheus_remote_write_url>" \
BASE_URL="<your_api_url>" \
SUPABASE_ANON_KEY="<your_anon_key>" \
k6 run -o experimental-prometheus-rw shelf-awareness/tests/performance/scm-load-test.js
```

## 4. Recommended Grafana Dashboard Panels

Once metrics are flowing into Prometheus, create a Grafana dashboard utilizing the following queries/panels:

### Overall Traffic & Errors
- **Total Requests**: `rate(http_reqs_total[1m])`
- **Error Rate**: `scm_error_rate` (Custom metric defined in script)

### Endpoint Latency (p95)
Use the `histogram_quantile` function on the metrics k6 exports to track performance against thresholds.
- **PO Creation Latency (p95)**: Tracks the `po_creation_duration` custom trend.
- **Scorecard Read Latency (p95)**: Tracks the `scorecard_read_duration` custom trend.
- **Overall HTTP Latency (p95)**: Tracks `http_req_duration` natively provided by k6.
