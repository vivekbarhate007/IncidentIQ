# IncidentIQ: Full-Stack Observability & Resilience Platform

**IncidentIQ** is a high-performance observability platform designed to demonstrate enterprise-grade architectural patterns in a modern retail environment. It features a real-time incident detection engine, distributed correlation tracing, and a robust security model using asymmetric RSA encryption.

## 🚀 Key Architectural Features

### 1. Real-Time Incident Engine (Observability)
The system implements a "self-healing" pattern where a background engine continuously analyzes the `audit_events` stream. It calculates P95 latency and error rates in real-time, automatically opening incidents when performance thresholds are breached.

### 2. Distributed Correlation Tracing
Every request is tagged with a unique `correlationId` at the edge. This ID is propagated through the HTTP headers, recorded in the audit logs, and persisted with the database records, allowing for end-to-end tracing of a single user action across the entire stack.

### 3. Resilience & Idempotency
The `OrderService` implements **Exactly-Once** semantics using an `Idempotency-Key` pattern. This ensures that network retries or client-side double-clicks do not result in duplicate orders or corrupted inventory states.

### 4. Enterprise Security (RSA-256 JWT)
Authentication is handled using **RSA-256 asymmetric signing**. The backend server only stores the **Public Key** for verification, ensuring that even a full server compromise does not allow an attacker to forge new identity tokens.

### 5. Chaos Engineering Suite
Built-in tools to "Inject Latency" and "Inject Errors" allow developers to simulate system failures and verify the responsiveness of the automated detection engine.

## 🛠️ Tech Stack
- **Frontend**: React 18, Tailwind CSS, Lucide Icons, Recharts (Data Viz), Motion (Animations).
- **Backend**: Node.js, Express, Better-SQLite3.
- **Security**: JSON Web Tokens (JWT) with RS256, Crypto (RSA Key Generation).
- **Tooling**: Vite, TypeScript, UUID (Correlation).

## 🎓 Interview Demo Guide
This project includes a built-in **Demo Guide** tab designed specifically for technical interviews. It walks the interviewer through:
1.  **Triggering an Incident**: Injecting chaos and watching the engine detect it.
2.  **Tracing a Request**: Using a Correlation ID to find a specific order in the Audit Logs.
3.  **Verifying Security**: Inspecting the SPKI-formatted Public Key used for JWT verification.

## 📦 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/vivekbarhate007/IncidentIQ.git
   cd IncidentIQ
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open the Dashboard**:
   Navigate to `http://localhost:3000`.
