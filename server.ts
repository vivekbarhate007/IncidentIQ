import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3000;
const db = new Database(":memory:");

// --- RSA KEY SETUP ---
// We'll generate a key pair for the demo so we can sign and verify
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// Helper to sign tokens for our demo
const signToken = (payload: any) => {
  return jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: '1h' });
};

const DEMO_TOKENS = {
  CUSTOMER: signToken({ id: "user-1", role: "CUSTOMER", name: "John Doe" }),
  OPS: signToken({ id: "ops-1", role: "OPS", name: "Ops Team" }),
  ADMIN: signToken({ id: "admin-1", role: "ADMIN", name: "System Admin" })
};

// --- DB SCHEMA ---
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    userId TEXT,
    items TEXT,
    status TEXT,
    createdAt DATETIME,
    updatedAt DATETIME,
    idempotencyKey TEXT UNIQUE,
    correlationId TEXT
  );
  CREATE TABLE IF NOT EXISTS inventory (
    sku TEXT PRIMARY KEY,
    availableQty INTEGER,
    reservedQty INTEGER,
    updatedAt DATETIME
  );
  CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    ts DATETIME,
    method TEXT,
    path TEXT,
    status INTEGER,
    latencyMs INTEGER,
    userRole TEXT,
    correlationId TEXT,
    traceId TEXT,
    orderId TEXT
  );
  CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    createdAt DATETIME,
    severity TEXT,
    type TEXT,
    status TEXT,
    summary TEXT,
    details TEXT,
    metricsSnapshot TEXT
  );
`);

// --- MIDDLEWARE ---
app.use(express.json());

// Logging & Audit Middleware
app.use((req, res, next) => {
  const correlationId = req.headers["x-correlation-id"] || uuidv4();
  const traceId = uuidv4();
  const start = Date.now();

  res.setHeader("X-Correlation-ID", correlationId);
  (req as any).correlationId = correlationId;
  (req as any).traceId = traceId;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const userRole = (req as any).user?.role || "ANONYMOUS";

    try {
      db.prepare(`
        INSERT INTO audit_events (id, ts, method, path, status, latencyMs, userRole, correlationId, traceId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(),
        new Date().toISOString(),
        req.method,
        req.path,
        res.statusCode,
        duration,
        userRole,
        correlationId,
        traceId
      );
    } catch (e) {
      console.error("Audit logging failed", e);
    }
  });

  next();
});

// Real RSA JWT Auth Middleware
const auth = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });
  
  const token = authHeader.split(" ")[1];
  
  try {
    // Verify using the RSA Public Key
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT Verification failed", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// --- RETAIL APIs ---
app.get("/api/v1/orders", auth, (req: any, res) => {
  let orders;
  if (req.user.role === "ADMIN" || req.user.role === "OPS") {
    orders = db.prepare("SELECT * FROM orders ORDER BY createdAt DESC").all();
  } else {
    orders = db.prepare("SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC").all(req.user.id);
  }
  res.json(orders);
});

app.post("/api/v1/orders", auth, (req: any, res) => {
  const { items, idempotencyKey } = req.body;
  if (req.user.role !== "CUSTOMER" && req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });

  try {
    const existing = db.prepare("SELECT * FROM orders WHERE idempotencyKey = ?").get(idempotencyKey);
    if (existing) return res.json({ ...existing, _cached: true });

    // Atomic inventory check & reservation
    const transaction = db.transaction(() => {
      for (const item of items) {
        const inv: any = db.prepare("SELECT * FROM inventory WHERE sku = ?").get(item.sku);
        if (!inv || inv.availableQty < item.qty) throw new Error(`Stock failure: ${item.sku}`);
        db.prepare("UPDATE inventory SET availableQty = availableQty - ?, reservedQty = reservedQty + ?, updatedAt = ? WHERE sku = ?")
          .run(item.qty, item.qty, new Date().toISOString(), item.sku);
      }

      const orderId = uuidv4();
      db.prepare(`
        INSERT INTO orders (id, userId, items, status, createdAt, updatedAt, idempotencyKey, correlationId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(orderId, req.user.id, JSON.stringify(items), "CREATED", new Date().toISOString(), new Date().toISOString(), idempotencyKey, req.correlationId);
      
      return db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
    });

    res.json(transaction());
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/v1/orders/:id", auth, (req, res) => {
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id);
  res.json(order);
});

app.post("/api/v1/inventory/seed", auth, (req: any, res) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  const items = req.body;
  for (const item of items) {
    db.prepare("INSERT OR REPLACE INTO inventory (sku, availableQty, reservedQty, updatedAt) VALUES (?, ?, ?, ?)")
      .run(item.sku, item.availableQty, 0, new Date().toISOString());
  }
  res.json({ status: "seeded" });
});

app.get("/api/v1/inventory", auth, (req: any, res) => {
  const items = db.prepare("SELECT * FROM inventory").all();
  res.json(items);
});

app.get("/api/v1/inventory/:sku", auth, (req, res) => {
  const item = db.prepare("SELECT * FROM inventory WHERE sku = ?").get(req.params.sku);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
});

// --- INCIDENT APIs ---
app.get("/api/v1/incidents", auth, (req: any, res) => {
  if (req.user.role !== "OPS" && req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  const incidents = db.prepare("SELECT * FROM incidents ORDER BY createdAt DESC").all();
  res.json(incidents);
});

app.get("/api/v1/incidents/:id", auth, (req: any, res) => {
  const incident = db.prepare("SELECT * FROM incidents WHERE id = ?").get(req.params.id);
  res.json(incident);
});

app.post("/api/v1/incidents/:id/resolve", auth, (req: any, res) => {
  db.prepare("UPDATE incidents SET status = 'RESOLVED' WHERE id = ?").run(req.params.id);
  res.json({ status: "resolved" });
});

// --- CHAOS API ---
app.post("/api/v1/chaos", auth, async (req: any, res) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  
  const { type } = req.body;
  
  if (type === "LATENCY") {
    // Simulate a slow dependency for the next 30 seconds
    console.log("Chaos: Injecting latency...");
    // We'll just record some fake slow events to trigger the engine immediately
    for(let i=0; i<10; i++) {
      db.prepare(`
        INSERT INTO audit_events (id, ts, method, path, status, latencyMs, userRole, correlationId, traceId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), new Date().toISOString(), "GET", "/api/v1/inventory", 200, 800 + Math.random()*200, "SYSTEM", "chaos-lat", "chaos-lat");
    }
    res.json({ message: "Latency injected into audit stream" });
  } else if (type === "ERRORS") {
    console.log("Chaos: Injecting errors...");
    for(let i=0; i<10; i++) {
      db.prepare(`
        INSERT INTO audit_events (id, ts, method, path, status, latencyMs, userRole, correlationId, traceId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), new Date().toISOString(), "POST", "/api/v1/orders", 500, 50 + Math.random()*50, "SYSTEM", "chaos-err", "chaos-err");
    }
    res.json({ message: "Errors injected into audit stream" });
  } else {
    res.status(400).json({ error: "Invalid chaos type" });
  }
});

// --- INCIDENT ENGINE ---
// Run every 10 seconds for the demo
setInterval(() => {
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const events: any[] = db.prepare("SELECT * FROM audit_events WHERE ts > ?").all(fiveMinsAgo);
  
  if (events.length === 0) return;

  const total = events.length;
  const errors = events.filter(e => e.status >= 500).length;
  const errorRate = errors / total;

  // Check if an incident of this type is already open to avoid spam
  const hasOpenErrorIncident = db.prepare("SELECT id FROM incidents WHERE type = 'ERROR_RATE' AND status = 'OPEN'").get();

  if (errorRate > 0.05 && !hasOpenErrorIncident) {
    db.prepare("INSERT INTO incidents (id, createdAt, severity, type, status, summary, details) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(uuidv4(), new Date().toISOString(), "HIGH", "ERROR_RATE", "OPEN", `High error rate detected: ${(errorRate * 100).toFixed(2)}%`, "Automated detection via audit log analysis");
  }

  const latencies = events.map(e => e.latencyMs).sort((a, b) => a - b);
  const p95 = latencies[Math.floor(total * 0.95)];
  const hasOpenLatencyIncident = db.prepare("SELECT id FROM incidents WHERE type = 'LATENCY' AND status = 'OPEN'").get();

  if (p95 > 400 && !hasOpenLatencyIncident) {
    db.prepare("INSERT INTO incidents (id, createdAt, severity, type, status, summary, details) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(uuidv4(), new Date().toISOString(), "MED", "LATENCY", "OPEN", `High P95 latency detected: ${p95}ms`, "Automated detection via audit log analysis");
  }
}, 10000);

// --- AUDIT APIs ---
app.get("/api/v1/audit", auth, (req: any, res) => {
  if (req.user.role !== "OPS" && req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  const logs = db.prepare("SELECT * FROM audit_events ORDER BY ts DESC LIMIT 50").all();
  res.json(logs);
});

// --- STATUS & HEALTH ---
app.get("/api/status", (req, res) => {
  res.json({
    status: "UP",
    message: "IncidentIQ Node.js Observability Platform",
    auth_demo: DEMO_TOKENS,
    security: {
      algorithm: "RS256",
      publicKey: publicKey
    }
  });
});

app.get("/actuator/health", (req, res) => res.json({ status: "UP" }));
app.get("/actuator/prometheus", (req, res) => res.send("# Prometheus metrics placeholder\nincidentiq_orders_total 10\n"));

// --- VITE MIDDLEWARE ---
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
