import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Briefcase, 
  FileText, 
  DollarSign,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from 'recharts';

export default function Dashboard({ data = {}, currentRole, activeTab }) {
  const [users, setUsers] = useState(data.users || []);
  const [invoices, setInvoices] = useState(data.invoices || []);
  const [purchases, setPurchases] = useState(data.purchases || []);
  const [vouchers, setVouchers] = useState(data.vouchers || []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [usrRes, invRes, purRes, vchRes] = await Promise.allSettled([
        fetch('/api/users').then(r => r.json()),
        fetch('/api/billing/invoices').then(r => r.json()),
        fetch('/api/purchases').then(r => r.json()),
        fetch('/api/vouchers').then(r => r.json())
      ]);

      if (usrRes.status === 'fulfilled' && usrRes.value?.success) setUsers(usrRes.value.data);
      if (invRes.status === 'fulfilled' && invRes.value?.success) setInvoices(invRes.value.data);
      if (purRes.status === 'fulfilled' && purRes.value?.success) setPurchases(purRes.value.data);
      if (vchRes.status === 'fulfilled' && vchRes.value?.success) setVouchers(vchRes.value.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const usersCount = users.length;
  const invoicesCount = invoices.length;
  const purchasesCount = purchases.length;
  const vouchersCount = vouchers.length;

  const totalInvoiceVal = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const totalPurchaseVal = purchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);

  const erp = data.erp || {
    summary: {
      totalCustomers: usersCount || 0,
      totalVendors: purchasesCount || 0,
      totalInvoices: invoicesCount || 0,
      totalBills: vouchersCount || 0
    },
    accountBalances: [
      { bank: 'State Bank of India (DB Main)', balance: `₹${(totalInvoiceVal * 0.7).toLocaleString('en-IN')}` },
      { bank: 'HDFC Bank (Operating Acc)', balance: `₹${(totalInvoiceVal * 0.3).toLocaleString('en-IN')}` }
    ],
    incomeVsExpense: {
      incomeToday: `₹${Math.round(totalInvoiceVal / 30).toLocaleString('en-IN')}`,
      expenseToday: `₹${Math.round(totalPurchaseVal / 30).toLocaleString('en-IN')}`,
      incomeThisMonth: `₹${totalInvoiceVal.toLocaleString('en-IN')}`,
      expenseThisMonth: `₹${totalPurchaseVal.toLocaleString('en-IN')}`
    },
    cashflowChart: [
      { name: 'Week 1', income: Math.round(totalInvoiceVal * 0.2) },
      { name: 'Week 2', income: Math.round(totalInvoiceVal * 0.3) },
      { name: 'Week 3', income: Math.round(totalInvoiceVal * 0.25) },
      { name: 'Week 4', income: Math.round(totalInvoiceVal * 0.25) }
    ],
    incomeExpenseChart: [
      { name: 'Mon', income: 15000, expense: 4000 },
      { name: 'Tue', income: 28000, expense: 12000 },
      { name: 'Wed', income: 45000, expense: 18000 },
      { name: 'Thu', income: 32000, expense: 9000 },
      { name: 'Fri', income: 58000, expense: 22000 }
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Metric Cards Grid */}
      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))', color: 'var(--brand-yellow)' }}>
            <Users style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <div className="metric-lbl">Total Customers</div>
            <div className="metric-val" style={{ fontSize: '1.4rem' }}>{erp.summary.totalCustomers}</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05))', color: 'var(--brand-cyan)' }}>
            <Briefcase style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <div className="metric-lbl">Total Vendors</div>
            <div className="metric-val" style={{ fontSize: '1.4rem' }}>{erp.summary.totalVendors}</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))', color: 'var(--brand-green)' }}>
            <FileText style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <div className="metric-lbl">Total Invoices</div>
            <div className="metric-val" style={{ fontSize: '1.4rem' }}>{erp.summary.totalInvoices}</div>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))', color: 'var(--brand-red)' }}>
            <DollarSign style={{ width: 24, height: 24 }} />
          </div>
          <div>
            <div className="metric-lbl">Total Bills</div>
            <div className="metric-val" style={{ fontSize: '1.4rem' }}>{erp.summary.totalBills}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Account Balance Table */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.35rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>
              Account Balance
            </div>
            <CreditCard style={{ width: 18, height: 18, color: 'var(--text-secondary)' }} />
          </div>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Bank</th>
                <th style={{ textAlign: 'right' }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {erp.accountBalances.map((acc, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500 }}>{acc.bank}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--brand-gold)' }}>{acc.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Income Vs Expense */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>
              Income Vs Expense
            </div>
            <TrendingUp style={{ width: 18, height: 18, color: 'var(--text-secondary)' }} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Income Today</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--brand-gold)', fontWeight: 700 }}>{erp.incomeVsExpense.incomeToday}</span>
              </div>
              <div className="progress-container">
                <div className="progress-fill progress-primary" style={{ width: '5%' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Expense Today</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--brand-red)', fontWeight: 700 }}>{erp.incomeVsExpense.expenseToday}</span>
              </div>
              <div className="progress-container">
                <div className="progress-fill progress-danger" style={{ width: '0%' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Income This Month</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--brand-gold)', fontWeight: 700 }}>{erp.incomeVsExpense.incomeThisMonth}</span>
              </div>
              <div className="progress-container">
                <div className="progress-fill progress-primary" style={{ width: '65%' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Expense This Month</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--brand-red)', fontWeight: 700 }}>{erp.incomeVsExpense.expenseThisMonth}</span>
              </div>
              <div className="progress-container">
                <div className="progress-fill progress-danger" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Cashflow Chart */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>
              Cashflow
            </div>
          </div>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={erp.cashflowChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncomeFlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#ffffff', borderColor: 'rgba(0,0,0,0.08)', borderRadius: '8px', color: '#1e293b' }} 
                />
                <Area type="monotone" dataKey="income" stroke="#f59e0b" fillOpacity={1} fill="url(#colorIncomeFlow)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income & Expense Chart */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.05rem' }}>
              Income & Expense
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}></div> Income</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></div> Expense</span>
            </div>
          </div>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={erp.incomeExpenseChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#ffffff', borderColor: 'rgba(0,0,0,0.08)', borderRadius: '8px', color: '#1e293b' }}
                />
                <Bar dataKey="income" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
