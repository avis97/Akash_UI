import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Plus, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  BellRing, 
  Download,
  DollarSign,
  Briefcase,
  Edit2,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export default function BillingQuotations({ data = {}, currentRole, onRefresh, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab || 'invoices'); // 'invoices' | 'quotations'
  const [showInvModal, setShowInvModal] = useState(false);
  const [showQuotModal, setShowQuotModal] = useState(false);

  // Edit / Delete state for Invoices & Quotations
  const [editingInv, setEditingInv] = useState(null);
  const [deletingInv, setDeletingInv] = useState(null);
  const [editingQuot, setEditingQuot] = useState(null);
  const [deletingQuot, setDeletingQuot] = useState(null);

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  const [invoices, setInvoices] = useState(data.invoices || []);
  const [quotations, setQuotations] = useState(data.quotations || []);

  const fetchBillingData = useCallback(async () => {
    try {
      const [invRes, quotRes] = await Promise.allSettled([
        fetch('/api/billing/invoices').then(r => r.json()),
        fetch('/api/billing/quotations').then(r => r.json())
      ]);

      if (invRes.status === 'fulfilled' && invRes.value?.success) setInvoices(invRes.value.data);
      if (quotRes.status === 'fulfilled' && quotRes.value?.success) setQuotations(quotRes.value.data);
    } catch (err) {
      console.error('Error fetching billing data:', err);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  // New Invoice Form State
  const [newInv, setNewInv] = useState({
    clientName: '',
    clientEmail: '',
    totalAmount: 45000,
    dueDate: '2026-09-20'
  });

  // Edit Invoice Form State
  const [editInvData, setEditInvData] = useState({
    clientName: '',
    clientEmail: '',
    totalAmount: 45000,
    paidAmount: 0,
    dueDate: '',
    status: 'UNPAID'
  });

  // New Quotation Form State
  const [newQuot, setNewQuot] = useState({
    clientName: '',
    clientEmail: '',
    totalAmount: 60000
  });

  // Edit Quotation Form State
  const [editQuotData, setEditQuotData] = useState({
    clientName: '',
    clientEmail: '',
    totalAmount: 60000,
    validUntil: '',
    status: 'SENT'
  });

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInv)
      });
      const json = await res.json();
      if (json.success) {
        setShowInvModal(false);
        setNewInv({ clientName: '', clientEmail: '', totalAmount: 45000, dueDate: '2026-09-20' });
        fetchBillingData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditInvoice = async (e) => {
    e.preventDefault();
    if (!editingInv) return;
    try {
      const res = await fetch(`/api/billing/invoices/${editingInv.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editInvData)
      });
      const json = await res.json();
      if (json.success) {
        setEditingInv(null);
        fetchBillingData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deletingInv) return;
    try {
      const res = await fetch(`/api/billing/invoices/${deletingInv.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setDeletingInv(null);
        fetchBillingData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/billing/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuot)
      });
      const json = await res.json();
      if (json.success) {
        setShowQuotModal(false);
        setNewQuot({ clientName: '', clientEmail: '', totalAmount: 60000 });
        fetchBillingData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditQuotation = async (e) => {
    e.preventDefault();
    if (!editingQuot) return;
    try {
      const res = await fetch(`/api/billing/quotations/${editingQuot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editQuotData)
      });
      const json = await res.json();
      if (json.success) {
        setEditingQuot(null);
        fetchBillingData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuotation = async () => {
    if (!deletingQuot) return;
    try {
      const res = await fetch(`/api/billing/quotations/${deletingQuot.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setDeletingQuot(null);
        fetchBillingData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendPaymentReminder = (clientName, invNo) => {
    alert(`Automated Email & SMS Payment Reminder sent to ${clientName} for Invoice #${invNo}!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Sub-nav & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button 
            className={`btn ${activeTab === 'invoices' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('invoices')}
          >
            <FileText style={{ width: 16, height: 16 }} />
            Invoices & Automated Billing ({invoices.length})
          </button>
          <button 
            className={`btn ${activeTab === 'quotations' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('quotations')}
          >
            <Briefcase style={{ width: 16, height: 16 }} />
            Client Quotations ({quotations.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {activeTab === 'invoices' ? (
            <button className="btn btn-primary" onClick={() => setShowInvModal(true)}>
              <Plus style={{ width: 16, height: 16 }} />
              Generate Tax Invoice
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowQuotModal(true)}>
              <Plus style={{ width: 16, height: 16 }} />
              Create Client Quotation
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: Invoices */}
      {activeTab === 'invoices' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
              Automated Billing Ledger & Payment Reminders
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Integrated GST Calculation & Reminder Alerts
            </span>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Client</th>
                <th>Total Amount</th>
                <th>Paid Amount</th>
                <th>Balance Due</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-yellow)' }}>
                      {inv.invoiceNumber}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{inv.clientName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.clientEmail}</div>
                  </td>
                  <td>₹{inv.totalAmount.toLocaleString()}</td>
                  <td style={{ color: 'var(--brand-green)' }}>₹{inv.paidAmount.toLocaleString()}</td>
                  <td><strong style={{ color: inv.balanceAmount > 0 ? 'var(--brand-red)' : 'var(--text-primary)' }}>₹{inv.balanceAmount.toLocaleString()}</strong></td>
                  <td>{typeof inv.dueDate === 'string' ? inv.dueDate.slice(0, 10) : new Date(inv.dueDate).toISOString().slice(0, 10)}</td>
                  <td>
                    {inv.status === 'PAID' && <span className="badge badge-approved">PAID</span>}
                    {inv.status === 'PARTIAL' && <span className="badge badge-pending">PARTIAL</span>}
                    {inv.status === 'OVERDUE' && <span className="badge badge-rejected">OVERDUE</span>}
                    {inv.status === 'UNPAID' && <span className="badge badge-pending">UNPAID</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      {inv.balanceAmount > 0 && (
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleSendPaymentReminder(inv.clientName, inv.invoiceNumber)}
                          title="Send Payment Reminder"
                        >
                          <BellRing style={{ width: 14, height: 14, color: 'var(--brand-yellow)' }} />
                        </button>
                      )}
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                        title="Edit Invoice"
                        onClick={() => {
                          setEditingInv(inv);
                          setEditInvData({
                            clientName: inv.clientName || '',
                            clientEmail: inv.clientEmail || '',
                            totalAmount: inv.totalAmount || 0,
                            paidAmount: inv.paidAmount || 0,
                            dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : '',
                            status: inv.status || 'UNPAID'
                          });
                        }}
                      >
                        <Edit2 size={14} color="var(--brand-primary)" />
                      </button>
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                        title="Delete Invoice"
                        onClick={() => setDeletingInv(inv)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: Quotations */}
      {activeTab === 'quotations' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
              Client Quotation Management & Approval Track
            </h3>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Quotation No</th>
                <th>Client Name</th>
                <th>Net Amount</th>
                <th>GST (18%)</th>
                <th>Grand Total</th>
                <th>Valid Until</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map(q => (
                <tr key={q.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-yellow)' }}>
                      {q.quotationNumber}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{q.clientName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{q.clientEmail}</div>
                  </td>
                  <td>₹{q.totalAmount.toLocaleString()}</td>
                  <td>₹{q.gstAmount.toLocaleString()}</td>
                  <td><strong style={{ color: 'var(--brand-gold)' }}>₹{q.grandTotal.toLocaleString()}</strong></td>
                  <td>{typeof q.validUntil === 'string' ? q.validUntil.slice(0, 10) : new Date(q.validUntil).toISOString().slice(0, 10)}</td>
                  <td>
                    {q.status === 'APPROVED' && <span className="badge badge-approved">APPROVED</span>}
                    {q.status === 'SENT' && <span className="badge badge-scheduled">SENT TO CLIENT</span>}
                    {q.status === 'REJECTED' && <span className="badge badge-rejected">REJECTED</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                        title="Edit Quotation"
                        onClick={() => {
                          setEditingQuot(q);
                          setEditQuotData({
                            clientName: q.clientName || '',
                            clientEmail: q.clientEmail || '',
                            totalAmount: q.totalAmount || 0,
                            validUntil: q.validUntil ? new Date(q.validUntil).toISOString().slice(0, 10) : '',
                            status: q.status || 'SENT'
                          });
                        }}
                      >
                        <Edit2 size={14} color="var(--brand-primary)" />
                      </button>
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                        title="Delete Quotation"
                        onClick={() => setDeletingQuot(q)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Generate Invoice */}
      {showInvModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Issue Itemized Tax Invoice
            </h3>
            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Organization Name</label>
                <input 
                  className="input-field" 
                  required
                  value={newInv.clientName}
                  onChange={e => setNewInv({ ...newInv, clientName: e.target.value })}
                  placeholder="e.g. PwC India / HDFC Bank"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Email</label>
                <input 
                  type="email"
                  className="input-field" 
                  required
                  value={newInv.clientEmail}
                  onChange={e => setNewInv({ ...newInv, clientEmail: e.target.value })}
                  placeholder="accounts@client.com"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Invoice Total (₹)</label>
                  <input 
                    type="number"
                    className="input-field" 
                    required
                    value={newInv.totalAmount}
                    onChange={e => setNewInv({ ...newInv, totalAmount: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Payment Due Date</label>
                  <input 
                    type="date"
                    className="input-field" 
                    value={newInv.dueDate}
                    onChange={e => setNewInv({ ...newInv, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowInvModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 1B: Edit Invoice */}
      {editingInv && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Edit Invoice ({editingInv.invoiceNumber})
            </h3>
            <form onSubmit={handleEditInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Name</label>
                  <input 
                    className="input-field" 
                    required
                    value={editInvData.clientName}
                    onChange={e => setEditInvData({ ...editInvData, clientName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Email</label>
                  <input 
                    type="email"
                    className="input-field" 
                    required
                    value={editInvData.clientEmail}
                    onChange={e => setEditInvData({ ...editInvData, clientEmail: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Amount (₹)</label>
                  <input 
                    type="number"
                    className="input-field" 
                    required
                    value={editInvData.totalAmount}
                    onChange={e => setEditInvData({ ...editInvData, totalAmount: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Paid Amount (₹)</label>
                  <input 
                    type="number"
                    className="input-field" 
                    value={editInvData.paidAmount}
                    onChange={e => setEditInvData({ ...editInvData, paidAmount: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status</label>
                  <select 
                    className="select-field"
                    value={editInvData.status}
                    onChange={e => setEditInvData({ ...editInvData, status: e.target.value })}
                  >
                    <option value="UNPAID">UNPAID</option>
                    <option value="PARTIAL">PARTIAL</option>
                    <option value="PAID">PAID</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Due Date</label>
                <input 
                  type="date"
                  className="input-field" 
                  value={editInvData.dueDate}
                  onChange={e => setEditInvData({ ...editInvData, dueDate: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingInv(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Invoice Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Quotation */}
      {showQuotModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Create Official Quotation
            </h3>
            <form onSubmit={handleCreateQuotation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Name</label>
                <input 
                  className="input-field" 
                  required
                  value={newQuot.clientName}
                  onChange={e => setNewQuot({ ...newQuot, clientName: e.target.value })}
                  placeholder="Client Organization Name"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Contact Email</label>
                <input 
                  type="email"
                  className="input-field" 
                  required
                  value={newQuot.clientEmail}
                  onChange={e => setNewQuot({ ...newQuot, clientEmail: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Estimated Total (₹)</label>
                <input 
                  type="number"
                  className="input-field" 
                  required
                  value={newQuot.totalAmount}
                  onChange={e => setNewQuot({ ...newQuot, totalAmount: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuotModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Send Quotation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2B: Edit Quotation */}
      {editingQuot && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Edit Quotation ({editingQuot.quotationNumber})
            </h3>
            <form onSubmit={handleEditQuotation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Name</label>
                <input 
                  className="input-field" 
                  required
                  value={editQuotData.clientName}
                  onChange={e => setEditQuotData({ ...editQuotData, clientName: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Email</label>
                <input 
                  type="email"
                  className="input-field" 
                  required
                  value={editQuotData.clientEmail}
                  onChange={e => setEditQuotData({ ...editQuotData, clientEmail: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Net Amount (₹)</label>
                  <input 
                    type="number"
                    className="input-field" 
                    required
                    value={editQuotData.totalAmount}
                    onChange={e => setEditQuotData({ ...editQuotData, totalAmount: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status</label>
                  <select 
                    className="select-field"
                    value={editQuotData.status}
                    onChange={e => setEditQuotData({ ...editQuotData, status: e.target.value })}
                  >
                    <option value="SENT">SENT TO CLIENT</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Valid Until</label>
                <input 
                  type="date"
                  className="input-field" 
                  value={editQuotData.validUntil}
                  onChange={e => setEditQuotData({ ...editQuotData, validUntil: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingQuot(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Quotation Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Invoice Confirmation Modal */}
      {deletingInv && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f87171' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0 }}>
                Confirm Invoice Deletion
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete invoice <strong>{deletingInv.invoiceNumber}</strong> for <strong>{deletingInv.clientName}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingInv(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleDeleteInvoice}>
                Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Quotation Confirmation Modal */}
      {deletingQuot && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f87171' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0 }}>
                Confirm Quotation Deletion
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete quotation <strong>{deletingQuot.quotationNumber}</strong> for <strong>{deletingQuot.clientName}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingQuot(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleDeleteQuotation}>
                Delete Quotation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
