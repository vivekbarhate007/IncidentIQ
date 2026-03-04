# IncidentIQ — Observability-First Retail API Platform

IncidentIQ is a high-performance retail backend designed with **observability as a first-class citizen**. It doesn't just process orders; it monitors its own health and automatically detects anomalies.

## 🚀 Features
- **Retail APIs**: Order management with idempotency and inventory reservations.
- **Incident Engine**: Automated detection of high latency and error rates.
- **Audit Logging**: Every request is tracked with correlation IDs and stored in MongoDB.
- **Security**: JWT-based RBAC (CUSTOMER, OPS, ADMIN).

## 🛠️ Tech Stack
- Java 17 / Spring Boot 3
- MongoDB
- Spring Security (JWT/RSA)
- Micrometer / Prometheus
- k6 (Load Testing)

## 🏃 How to Run
1. **Prerequisites**: Docker & Docker Compose.
2. **Start Infrastructure**:
   ```bash
   docker-compose up -d
   ```
3. **Seed Inventory (Admin)**:
   ```bash
   curl -X POST http://localhost:8080/api/v1/inventory/seed \
     -H "Authorization: Bearer <ADMIN_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '[{"sku": "IPHONE15", "availableQty": 100}]'
   ```

## 🔑 Demo Tokens
Since this is a demo, use the following pre-generated JWTs (valid for 1 year):
- **CUSTOMER**: `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...` (See docs/TOKENS.md)
- **OPS**: `...`
- **ADMIN**: `...`

## 📊 Observability
- **Prometheus**: `http://localhost:8080/actuator/prometheus`
- **Health**: `http://localhost:8080/actuator/health`
- **Incidents**: `GET /api/v1/incidents`
