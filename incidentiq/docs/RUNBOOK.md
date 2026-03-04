# Runbook

## Incident: High Error Rate
1. Check logs for `correlationId` associated with 5xx errors.
2. Verify MongoDB connectivity.
3. Check if inventory seeding was performed.

## Incident: High Latency
1. Check Prometheus metrics for JVM GC pauses.
2. Verify MongoDB index usage (`db.audit_events.getIndexes()`).
3. Scale the application service if CPU is saturated.

## Manual Resolution
To resolve an incident via API:
```bash
curl -X POST http://localhost:8080/api/v1/incidents/{id}/resolve \
  -H "Authorization: Bearer <OPS_TOKEN>"
```
