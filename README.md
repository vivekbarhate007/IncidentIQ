What this is
Most observability tools are black boxes you plug into an existing system. IncidentIQ is built from scratch to show how those tools work internally — the polling engine, the correlation ID propagation, the idempotency key pattern, the asymmetric key exchange.
It runs as a simulated retail environment (orders, inventory, users) with a live dashboard, a chaos injection suite, and a built-in interview demo mode.

### 🧩 System Architecture

| 🧱 Layer        | ⚙️ Components                         | 📌 Key Responsibilities                        |
|----------------|--------------------------------------|-------------------------------------------------|
| Frontend       | React, Tailwind, Recharts            | UI dashboards, monitoring, visualization        |
| API Layer      | REST (JWT RS256)                     | Secure API gateway, authentication              |
| Backend        | Node.js, Express                     | Business logic, request handling                |
| Auth           | RSA-256 JWT                          | Token signing & verification                    |
| Orders         | Idempotency Key System               | Prevent duplicate transactions                  |
| Observability  | Polling Engine                       | Detect latency spikes & errors                  |
| Tracing        | Correlation ID System                | End-to-end request tracking                     |
| Chaos          | Injection Suite                      | Simulate failures for testing                   |
| Database       | SQLite                              | Persistent storage for system data               |

Five architectural patterns demonstrated
1. Real-time incident detection engine
A background polling process continuously reads the audit_events stream, calculates P95 latency and error rates across a rolling window, and automatically opens an incident record when thresholds are breached — no manual intervention needed.
This mirrors how tools like Datadog and PagerDuty work internally, without the abstraction layer.
2. Distributed correlation tracing
Every inbound request gets a unique correlationId at the edge. This ID travels through HTTP headers, gets stamped on every audit log entry, and is persisted with the database record. You can take any order ID and trace the exact chain of events that produced it across the full stack.
3. Exactly-once transaction semantics
The OrderService uses an Idempotency-Key pattern — if the same key arrives twice (network retry, double-click), the second request returns the original result without re-executing. No duplicate orders, no corrupted inventory state.
4. Asymmetric JWT authentication (RSA-256)
The server generates an RSA key pair on startup. Only the public key is stored on the backend for token verification — the private signing key never touches the application server after initial key generation. A full server compromise cannot produce forged tokens.
5. Chaos engineering suite
Built-in "Inject Latency" and "Inject Errors" controls let you deliberately degrade the system and watch the detection engine respond in real time. This is how SRE teams verify their alerting works before an actual incident.

Tech stack
LayerTechnologyFrontendReact 18, TypeScript, Tailwind CSS, Recharts, Lucide IconsBackendNode.js, Express, TypeScriptDatabaseSQLite (better-sqlite3)AuthJWT RS256, Node.js Crypto (RSA key generation)ToolingVite, UUID

Getting started
bash# Clone
git clone https://github.com/vivekbarhate007/IncidentIQ.git
cd IncidentIQ

# Install
npm install

# Configure environment
cp .env.example .env

# Run
npm run dev
Open http://localhost:3000 — the dashboard loads with simulated data already running.

Demo walkthrough
The app includes a built-in Demo Guide tab with step-by-step instructions for showing the system to an interviewer or reviewer. The three scenarios covered:
Scenario 1 — Trigger and detect an incident

Go to the Chaos tab and click "Inject Latency"
Watch the Observability Engine detect the P95 spike within seconds
See the incident auto-created in the Incidents panel

Scenario 2 — Trace a request end to end

Place an order from the Orders tab
Copy the correlationId from the response
Search for it in the Audit Log — every hop from HTTP request to DB write is visible

Scenario 3 — Verify the security model

Log in and decode the JWT (jwt.io works)
Note the RS256 algorithm in the header
Check the server config — only the SPKI-formatted public key is present


| 📁 Directory/File   | ⚙️ Component                | 📌 Description                                 |
|--------------------|---------------------------|--------------------------------------------------|
| src/               | Frontend Layer            | Core React application                           |
| ├── components/    | UI Components             | Reusable React UI elements                       |
| ├── services/      | API Clients               | Handles communication with backend APIs          |
| └── types/         | Type Definitions          | Shared TypeScript interfaces and types           |
|                    |                           |                                                  |
| incidentiq/        | Backend Layer             | Core server-side application logic               |
| ├── auth/          | Authentication Service    | JWT RSA-256 authentication logic                 |
| ├── orders/        | Order Service             | Handles order processing + idempotency           |
| ├── observability/ | Detection Engine          | Incident detection & monitoring system           |
| └── chaos/         | Chaos Suite               | Latency/error injection for testing              |
|                    |                           |                                                  |
| server.ts          | Entry Point               | Express server initialization                    |
| .env.example       | Config Template           | Environment variables setup                      |
| README.md          | Documentation             | Project overview and usage guide                 |

Key design decisions
Why SQLite instead of PostgreSQL?
Zero-dependency local setup. The patterns (correlation IDs, idempotency keys, audit logs) are storage-agnostic — swapping in Postgres is a one-line connection string change.
Why RSA-256 instead of HS256?
HS256 uses a shared secret — anyone with the secret can both verify and forge tokens. RS256 separates signing (private key, offline) from verification (public key, on server). In a microservices environment, each service can verify tokens without ever having signing capability.
Why a polling engine instead of event streaming?
Simpler to run locally without Kafka or Redis. The detection logic is identical — the only difference is the trigger mechanism. The code is structured so the engine can be wired to an event bus by changing one import.

Author
Vivek Barhate — CS student at George Mason University, graduating May 2026.
Interested in full-stack engineering, distributed systems, and AI/ML.
