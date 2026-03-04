# Performance Report Template

## Test Environment
- **App**: 2 Replicas (K8s)
- **DB**: MongoDB 6.0 (Single Node)
- **Load Tool**: k6

## Results Summary
| Metric | Value |
|--------|-------|
| Peak RPS | 450 |
| P95 Latency | 120ms |
| Error Rate | 0.05% |

## Commands to Reproduce
```bash
k6 run -e AUTH_TOKEN=$(cat admin_token.txt) load-tests/k6/order_flow.js
```

## Observations
- Latency increases when `audit_events` collection exceeds 1M records without TTL index.
- Recommendation: Implement a TTL index of 7 days on `audit_events`.
