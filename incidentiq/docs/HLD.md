# High Level Design (HLD)

## System Architecture
IncidentIQ follows a monolithic architecture for simplicity but implements patterns found in distributed systems:
- **API Gateway Pattern**: Handled by Spring Security and Filters.
- **Event Sourcing (Light)**: Audit events are recorded for every state change.
- **Control Loop**: The Incident Engine acts as a control loop, reconciling system state against health thresholds.

## Data Flow
1. **Request Entry**: `LoggingFilter` generates `correlationId`.
2. **Auth**: `SecurityConfig` validates JWT against RSA public key.
3. **Business Logic**: `OrderService` performs atomic inventory updates in Mongo.
4. **Audit**: Request metadata is saved to `audit_events` collection.
5. **Detection**: `IncidentEngine` (Scheduled) queries `audit_events` to detect breaches.
