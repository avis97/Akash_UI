import React from 'react';
import { 
  Briefcase, 
  Users, 
  Package, 
  FileText, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ShieldCheck,
  DollarSign
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';

const revenueData = [
  { month: 'Apr', revenue: 420000, meetings: 24 },
  { month: 'May', revenue: 510000, meetings: 28 },
  { month: 'Jun', revenue: 480000, meetings: 22 },
  { month: 'Jul', revenue: 640000, meetings: 35 },
  { month: 'Aug', revenue: 780000, meetings: 41 },
  { month: 'Sep', revenue: 850000, meetings: 46 },
];

export default function Dashboard({ data, currentRole, onNavigate }) {
  const pendingApprovalsCount = data.materialRequests.filter(
    r => r.status === 'PENDING_MASTER_ADMIN' || r.status === 'PENDING_FACILITY_MANAGER'
  ).length;

  const lowStockCount = data.products.filter(p => p.stockQuantity <= p.minStockAlert).length;
  const activeMeetings = data.meetings.filter(m => m.status === 'IN_PROGRESS' || m.status === 'SCHEDULED').length;
  const activeStaff = data.locations.filter(l => l.status === 'ACTIVE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner Alert if Approvals Pending */}
      {pendingApprovalsCount > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(239, 68, 68, 0.1))',
          border: '1px solid rgba(234, 179, 8, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle style={{ color: 'var(--brand-yellow)', width: 22, height: 22 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {pendingApprovalsCount} Material Requests Pending Approval
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Action required from Master Admin & Facility Manager workflows.
              </div>
            </div>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => onNavigate('meetings')}
          >
            Review Requests
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(234, 179, 8, 0.15)', color: 'var(--brand-yellow)' }}>
            <Briefcase style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <div className="metric-val">{activeMeetings}</div>
            <div className="metric-lbl">Active Service Meetings</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--brand-green)' }}>
            <MapPin style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <div className="metric-val">{activeStaff}</div>
            <div className="metric-lbl">Active Personnel Live</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--brand-red)' }}>
            <Package style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <div className="metric-val">{lowStockCount}</div>
            <div className="metric-lbl">Low Stock Alerts</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--brand-purple)' }}>
            <DollarSign style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <div className="metric-val">₹8.5L</div>
            <div className="metric-lbl">Monthly Service Revenue</div>
          </div>
        </div>
      </div>

      {/* Revenue & Service Volume Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem' }}>
                Service & Billing Revenue Trend
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Monthly financial growth in INR</div>
            </div>
            <TrendingUp style={{ color: 'var(--brand-green)', width: 20, height: 20 }} />
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ background: '#111827', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }} 
                  formatter={(val) => [`₹${(val/1000).toFixed(0)}k`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#eab308" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem' }}>
                Service Field Visits Completed
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client service calls executed per month</div>
            </div>
            <CheckCircle2 style={{ color: 'var(--brand-yellow)', width: 20, height: 20 }} />
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ background: '#111827', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="meetings" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Activity Logs & Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Audit Activity Stream */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>
              Real-time System Audit Trail
            </div>
            <Clock style={{ width: 18, height: 18, color: 'var(--text-secondary)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {data.activityLogs.slice(0, 5).map(log => (
              <div key={log.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                background: 'rgba(15, 23, 42, 0.5)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ShieldCheck style={{ width: 18, height: 18, color: 'var(--brand-yellow)' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{log.action}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      By {log.userName} • {log.module}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Operations Launchpad */}
        <div className="glass-card">
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem', marginBottom: '1rem' }}>
            Operational Shortcuts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => onNavigate('meetings')}>
              <Briefcase style={{ width: 16, height: 16, color: 'var(--brand-yellow)' }} />
              Schedule Service Meeting
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => onNavigate('inventory')}>
              <Package style={{ width: 16, height: 16, color: 'var(--brand-cyan)' }} />
              Stock QR / Barcode Scan
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => onNavigate('billing')}>
              <FileText style={{ width: 16, height: 16, color: 'var(--brand-green)' }} />
              Generate Client Quotation
            </button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => onNavigate('amc')}>
              <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--brand-purple)' }} />
              Site AMC Compliance Log
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
