import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Box, 
  ClipboardList, 
  Database, 
  Shield, 
  Terminal, 
  User, 
  RefreshCw,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Search
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- UTILS ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TYPES ---
type Role = 'CUSTOMER' | 'OPS' | 'ADMIN';

interface Incident {
  id: string;
  createdAt: string;
  severity: 'HIGH' | 'MED' | 'LOW';
  type: string;
  status: 'OPEN' | 'ACK' | 'RESOLVED';
  summary: string;
  details: string;
}

interface InventoryItem {
  sku: string;
  availableQty: number;
  reservedQty: number;
  updatedAt: string;
}

interface AuditEvent {
  id: string;
  ts: string;
  method: string;
  path: string;
  status: number;
  latencyMs: number;
  correlationId: string;
  userRole: string;
}

// --- COMPONENTS ---

const Badge = ({ children, variant = 'neutral' }: { children: React.ReactNode, variant?: 'neutral' | 'success' | 'warning' | 'error' | 'info' }) => {
  const variants = {
    neutral: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wider', variants[variant])}>
      {children}
    </span>
  );
};

const Card: React.FC<{ title: string, icon: any, children: React.ReactNode, className?: string, action?: React.ReactNode }> = ({ title, icon: Icon, children, className, action }) => (
  <div className={cn('bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col', className)}>
    <div className="px-4 py-3 border-bottom border-zinc-800 flex items-center justify-between bg-zinc-900/50">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-zinc-500" />
        <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400">{title}</h3>
      </div>
      {action}
    </div>
    <div className="flex-1 p-4">
      {children}
    </div>
  </div>
);

export default function App() {
  const [role, setRole] = useState<Role>('ADMIN');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'incidents' | 'inventory' | 'audit' | 'guide'>('overview');
  const [authTokens, setAuthTokens] = useState<any>(null);
  const [securityInfo, setSecurityInfo] = useState<any>(null);

  useEffect(() => {
    fetch('/api/status')
      .then(r => r.json())
      .then(data => {
        setAuthTokens(data.auth_demo);
        setSecurityInfo(data.security);
      });
  }, []);

  const fetchAll = async () => {
    if (!authTokens) return;
    try {
      const headers = { 'Authorization': `Bearer ${authTokens[role]}` };
      
      const [incRes, invRes, auditRes, orderRes] = await Promise.all([
        fetch('/api/v1/incidents', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/v1/inventory', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/v1/audit', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/v1/orders', { headers }).then(r => r.ok ? r.json() : [])
      ]);

      setIncidents(incRes);
      setInventory(invRes);
      setAuditLogs(auditRes);
      setOrders(orderRes);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [role, authTokens]);

  const stats = useMemo(() => {
    const openIncidents = incidents.filter(i => i.status === 'OPEN').length;
    const avgLatency = auditLogs.reduce((acc, l) => acc + l.latencyMs, 0) / (auditLogs.length || 1);
    const errorRate = (auditLogs.filter(l => l.status >= 500).length / (auditLogs.length || 1)) * 100;
    
    return { openIncidents, avgLatency, errorRate };
  }, [incidents, auditLogs]);

  const seedInventory = async () => {
    if (!authTokens) return;
    await fetch('/api/v1/inventory/seed', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${authTokens.ADMIN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        { sku: 'IPHONE15', availableQty: 100 },
        { sku: 'MACBOOK', availableQty: 50 },
        { sku: 'AIRPODS', availableQty: 200 }
      ])
    });
    fetchAll();
  };

  const simulateTraffic = async () => {
    if (!authTokens) return;
    // Simulate some orders to generate audit logs and potentially trigger incidents
    for (let i = 0; i < 5; i++) {
      fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authTokens.CUSTOMER}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [{ sku: 'IPHONE15', qty: 1 }],
          idempotencyKey: `sim-${Date.now()}-${i}`
        })
      });
    }
    setTimeout(fetchAll, 1000);
  };

  const triggerChaos = async (type: 'LATENCY' | 'ERRORS') => {
    if (!authTokens) return;
    await fetch('/api/v1/chaos', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${authTokens.ADMIN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type })
    });
    fetchAll();
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-zinc-800">
      {/* --- SIDEBAR --- */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col z-50">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-zinc-100 rounded flex items-center justify-center">
              <Activity className="w-5 h-5 text-black" />
            </div>
            <h1 className="font-mono font-bold tracking-tighter text-xl uppercase">IncidentIQ</h1>
          </div>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Observability Platform</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors", 
              activeTab === 'overview' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900")}
          >
            <Activity className="w-4 h-4" /> Overview
          </button>
          <button 
            onClick={() => setActiveTab('incidents')}
            className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors", 
              activeTab === 'incidents' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900")}
          >
            <AlertTriangle className="w-4 h-4" /> Incidents
            {stats.openIncidents > 0 && (
              <span className="ml-auto bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {stats.openIncidents}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors", 
              activeTab === 'inventory' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900")}
          >
            <Box className="w-4 h-4" /> Inventory
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors", 
              activeTab === 'audit' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900")}
          >
            <Terminal className="w-4 h-4" /> Audit Logs
          </button>
          <button 
            onClick={() => setActiveTab('guide')}
            className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors", 
              activeTab === 'guide' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900")}
          >
            <ClipboardList className="w-4 h-4" /> Demo Guide
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-3 h-3 text-zinc-500" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Identity Context</span>
            </div>
            <div className="space-y-1">
              {(['CUSTOMER', 'OPS', 'ADMIN'] as Role[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-mono transition-all",
                    role === r ? "bg-zinc-100 text-black" : "text-zinc-500 hover:text-zinc-300")}
                >
                  <User className="w-3 h-3" /> {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="pl-64 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header className="h-16 border-b border-zinc-800 bg-black flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Badge variant="info">System: Operational</Badge>
            <div className="h-4 w-px bg-zinc-800" />
            <div className="flex items-center gap-2 text-zinc-500">
              <Clock className="w-3 h-3" />
              <span className="text-[10px] font-mono">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchAll}
              className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {role === 'ADMIN' && (
              <div className="flex items-center gap-2 border-r border-zinc-800 pr-3 mr-1">
                <button 
                  onClick={() => triggerChaos('LATENCY')}
                  className="px-2 py-1.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded text-[10px] font-mono uppercase tracking-wider hover:bg-amber-500/20 transition-colors"
                >
                  Inject Latency
                </button>
                <button 
                  onClick={() => triggerChaos('ERRORS')}
                  className="px-2 py-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded text-[10px] font-mono uppercase tracking-wider hover:bg-rose-500/20 transition-colors"
                >
                  Inject Errors
                </button>
              </div>
            )}
            <button 
              onClick={simulateTraffic}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[11px] font-mono uppercase tracking-wider hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              <Activity className="w-3 h-3" /> Simulate Traffic
            </button>
            {role === 'ADMIN' && (
              <button 
                onClick={seedInventory}
                className="px-3 py-1.5 bg-zinc-100 text-black rounded text-[11px] font-mono uppercase tracking-wider hover:bg-white transition-colors flex items-center gap-2"
              >
                <Plus className="w-3 h-3" /> Seed Data
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Active Incidents" icon={AlertTriangle}>
                  <div className="flex items-baseline gap-2">
                    <span className={cn("text-4xl font-mono font-bold", stats.openIncidents > 0 ? "text-rose-500" : "text-zinc-100")}>
                      {stats.openIncidents}
                    </span>
                    <span className="text-zinc-500 text-xs font-mono uppercase">Open</span>
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-2 font-mono">Last detection: 1m ago</p>
                </Card>
                <Card title="Avg Latency" icon={Activity}>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-mono font-bold text-zinc-100">{stats.avgLatency.toFixed(0)}</span>
                    <span className="text-zinc-500 text-xs font-mono uppercase">ms</span>
                  </div>
                  <div className="mt-4 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '65%' }} />
                  </div>
                </Card>
                <Card title="Error Rate" icon={Shield}>
                  <div className="flex items-baseline gap-2">
                    <span className={cn("text-4xl font-mono font-bold", stats.errorRate > 2 ? "text-rose-500" : "text-emerald-500")}>
                      {stats.errorRate.toFixed(1)}
                    </span>
                    <span className="text-zinc-500 text-xs font-mono uppercase">%</span>
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-2 font-mono">Threshold: 2.0%</p>
                </Card>
              </div>

              {/* Customer Orders or Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {role === 'CUSTOMER' ? (
                  <Card title="My Orders" icon={ClipboardList} className="lg:col-span-2">
                    <div className="space-y-2">
                      {orders.length === 0 ? (
                        <p className="text-xs text-zinc-500 font-mono italic">No orders found. Click "Simulate Traffic" to create some.</p>
                      ) : (
                        orders.map(order => (
                          <div key={order.id} className="p-3 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-between">
                            <div>
                              <p className="text-xs font-mono text-zinc-200">Order #{order.id.split('-')[0]}</p>
                              <p className="text-[10px] font-mono text-zinc-500">Correlation: {order.correlationId}</p>
                            </div>
                            <Badge variant="success">{order.status}</Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                ) : (
                  <>
                    <Card title="Latency Distribution" icon={Activity} className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={auditLogs.slice().reverse()}>
                          <defs>
                            <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis dataKey="ts" hide />
                          <YAxis stroke="#52525b" fontSize={10} fontFamily="monospace" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '4px' }}
                            itemStyle={{ color: '#10b981', fontSize: '10px', fontFamily: 'monospace' }}
                          />
                          <Area type="monotone" dataKey="latencyMs" stroke="#10b981" fillOpacity={1} fill="url(#colorLatency)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Card>

                    <Card title="Recent Incidents" icon={AlertTriangle} className="h-[300px]" action={<button onClick={() => setActiveTab('incidents')} className="text-[10px] text-zinc-500 hover:text-zinc-300 uppercase font-mono tracking-wider">View All</button>}>
                      <div className="space-y-3 overflow-y-auto h-full pr-2">
                        {incidents.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                            <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-xs font-mono uppercase tracking-widest">No active incidents</p>
                          </div>
                        ) : (
                          incidents.map(incident => (
                            <div key={incident.id} className="p-3 bg-zinc-950 border border-zinc-800 rounded flex items-start gap-3">
                              <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", 
                                incident.severity === 'HIGH' ? "bg-rose-500" : "bg-amber-500")} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-mono text-zinc-500">{new Date(incident.createdAt).toLocaleTimeString()}</span>
                                  <Badge variant={incident.status === 'OPEN' ? 'error' : 'success'}>{incident.status}</Badge>
                                </div>
                                <p className="text-xs font-medium text-zinc-200 truncate">{incident.summary}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'incidents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-mono font-bold uppercase tracking-tight">Incident Monitor</h2>
                <div className="flex gap-2">
                  <Badge variant="error">{incidents.filter(i => i.status === 'OPEN').length} Open</Badge>
                  <Badge variant="success">{incidents.filter(i => i.status === 'RESOLVED').length} Resolved</Badge>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-950 border-b border-zinc-800">
                      <th className="px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Timestamp</th>
                      <th className="px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Severity</th>
                      <th className="px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Type</th>
                      <th className="px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Summary</th>
                      <th className="px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500">Status</th>
                      <th className="px-6 py-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {incidents.map(incident => (
                      <tr key={incident.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-zinc-400">{new Date(incident.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <Badge variant={incident.severity === 'HIGH' ? 'error' : 'warning'}>{incident.severity}</Badge>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-zinc-300">{incident.type}</td>
                        <td className="px-6 py-4 text-xs text-zinc-200">{incident.summary}</td>
                        <td className="px-6 py-4">
                          <Badge variant={incident.status === 'OPEN' ? 'error' : incident.status === 'ACK' ? 'warning' : 'success'}>
                            {incident.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {incident.status === 'OPEN' && (
                            <button 
                              onClick={async () => {
                                await fetch(`/api/v1/incidents/${incident.id}/resolve`, { 
                                  method: 'POST', 
                                  headers: { 'Authorization': `Bearer ${authTokens[role]}` } 
                                });
                                fetchAll();
                              }}
                              className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 hover:text-emerald-400"
                            >
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-mono font-bold uppercase tracking-tight">Inventory Health</h2>
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5">
                  <Search className="w-3 h-3 text-zinc-500" />
                  <input type="text" placeholder="Filter SKU..." className="bg-transparent border-none outline-none text-xs font-mono text-zinc-300 w-32" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inventory.map(item => (
                  <Card key={item.sku} title={item.sku} icon={Box}>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Available</p>
                          <p className="text-3xl font-mono font-bold text-zinc-100">{item.availableQty}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-mono text-zinc-500 uppercase mb-1">Reserved</p>
                          <p className="text-xl font-mono text-zinc-400">{item.reservedQty}</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-500", 
                            item.availableQty < 10 ? "bg-rose-500" : "bg-emerald-500")} 
                          style={{ width: `${(item.availableQty / (item.availableQty + item.reservedQty || 1)) * 100}%` }} 
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-600">
                        <span>Last Sync: {new Date(item.updatedAt).toLocaleTimeString()}</span>
                        {item.availableQty < 10 && <span className="text-rose-500 animate-pulse">Low Stock</span>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-mono font-bold uppercase tracking-tight">Audit Stream</h2>
                <div className="flex gap-2">
                  <Badge variant="neutral">Live Feed</Badge>
                  <Badge variant="info">{auditLogs.length} Events</Badge>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden font-mono">
                <div className="bg-zinc-900 px-6 py-3 border-b border-zinc-800 flex items-center gap-4 text-[10px] uppercase tracking-widest text-zinc-500">
                  <span className="w-32">Timestamp</span>
                  <span className="w-16">Method</span>
                  <span className="flex-1">Path</span>
                  <span className="w-16">Status</span>
                  <span className="w-20 text-right">Latency</span>
                </div>
                <div className="divide-y divide-zinc-900 max-h-[600px] overflow-y-auto">
                  {auditLogs.map(log => (
                    <div key={log.id} className="px-6 py-3 flex items-center gap-4 hover:bg-zinc-900/50 transition-colors group">
                      <span className="w-32 text-[11px] text-zinc-500">{new Date(log.ts).toLocaleTimeString()}</span>
                      <span className={cn("w-16 text-[11px] font-bold", 
                        log.method === 'POST' ? "text-sky-400" : "text-emerald-400")}>{log.method}</span>
                      <span className="flex-1 text-[11px] text-zinc-300 truncate">{log.path}</span>
                      <span className={cn("w-16 text-[11px]", 
                        log.status >= 500 ? "text-rose-500" : log.status >= 400 ? "text-amber-500" : "text-emerald-500")}>
                        {log.status}
                      </span>
                      <span className="w-20 text-right text-[11px] text-zinc-500 group-hover:text-zinc-300">
                        {log.latencyMs}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {activeTab === 'guide' && (
            <div className="space-y-8 max-w-4xl">
              <div className="space-y-2">
                <h2 className="text-2xl font-mono font-bold uppercase tracking-tight">Interview Demo Guide</h2>
                <p className="text-zinc-500 text-sm">Follow these steps to demonstrate key architectural principles.</p>
              </div>

              <div className="grid gap-6">
                <Card title="1. Incident Engine (Observability)" icon={Activity}>
                  <div className="space-y-3 text-sm text-zinc-400">
                    <p>The system "watches itself" by analyzing the <code className="text-zinc-200">audit_events</code> collection in real-time.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>As an <strong>ADMIN</strong>, use the <strong>Inject Latency</strong> or <strong>Inject Errors</strong> buttons in the top bar.</li>
                      <li>These buttons simulate a system failure by injecting anomalous records into the audit stream.</li>
                      <li>The background engine (now running every 10s for this demo) will detect the anomaly.</li>
                      <li>A new incident will automatically appear in the <strong>Incidents</strong> tab within seconds.</li>
                    </ul>
                  </div>
                </Card>

                <Card title="2. Distributed Correlation" icon={Terminal}>
                  <div className="space-y-3 text-sm text-zinc-400">
                    <p>A single <code className="text-zinc-200">correlationId</code> spans from the HTTP header to the logs and finally to the database record.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Switch to <strong>CUSTOMER</strong> role and create an order.</li>
                      <li>Note the Correlation ID displayed on the order card.</li>
                      <li>Switch to <strong>ADMIN</strong> and find the same ID in the <strong>Audit Logs</strong>.</li>
                      <li>This allows tracing a single user action across the entire system.</li>
                    </ul>
                  </div>
                </Card>

                <Card title="3. Resilience & Idempotency" icon={Shield}>
                  <div className="space-y-3 text-sm text-zinc-400">
                    <p>The <code className="text-zinc-200">Idempotency-Key</code> prevents duplicate orders during network retries or double-clicks.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>The <strong>Simulate Traffic</strong> button uses unique keys for each order.</li>
                      <li>In the backend, we check if a key exists before processing.</li>
                      <li>This ensures "Exactly-Once" semantics for critical retail transactions.</li>
                    </ul>
                  </div>
                </Card>

                <Card title="4. Enterprise Security (RSA JWT)" icon={Shield}>
                  <div className="space-y-3 text-sm text-zinc-400">
                    <p>We use <strong>RSA-256</strong> asymmetric signing for JWT verification.</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>The server only stores the <strong>Public Key</strong> for verification.</li>
                      <li>The <strong>Private Key</strong> (simulated in memory) is used only by the Identity Provider to sign tokens.</li>
                      <li>This ensures that even if the application server is compromised, attackers cannot forge new tokens.</li>
                    </ul>
                    <div className="mt-4 p-3 bg-black rounded border border-zinc-800">
                      <p className="text-[10px] font-mono text-zinc-500 uppercase mb-2">Active Public Key (SPKI)</p>
                      <pre className="text-[9px] text-emerald-500 overflow-x-auto">
                        {securityInfo?.publicKey || 'Loading...'}
                      </pre>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
