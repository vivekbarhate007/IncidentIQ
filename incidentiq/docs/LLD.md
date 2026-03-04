# Low Level Design (LLD)

## Data Models
- **Order**: Uses `@Indexed` on `userId` and `createdAt` for fast retrieval. `idempotencyKey` is unique to prevent duplicate processing.
- **InventoryItem**: Optimistic locking could be added via `@Version`, but currently uses atomic updates.
- **AuditEvent**: The heart of the observability engine. Indexed by `ts` (timestamp) for range queries by the `IncidentEngine`.

## Service Logic
- **OrderService**: Implements a "Reserve-then-Commit" pattern. It checks stock, decrements `availableQty`, increments `reservedQty`, and then saves the order.
- **IncidentEngine**: Uses Spring's `@Scheduled` to run every minute. It performs a "sliding window" analysis of the last 5 minutes of traffic.

## Security
- **JWT**: Expects an RSA-signed token. Roles are extracted from the `groups` or `roles` claim in the JWT.
