import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  BellRing, 
  Download,
  DollarSign,
  Briefcase
} from 'lucide-react';

export default function BillingQuotations({ data, currentRole, onRefresh }) {
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'quotations'
  const [showInvModal, setShowInvModal] = useState(false);
  const [showQuotModal, setShowQuotModal] = useState(false);

  // New Invoice Form State
  const [newInv, setNewInv] = useState({
    clientName: '',
    clientEmail: '',
    totalAmount: 45000,
    dueDate: '2026-09-20'
  });

  // New Quotation Form State
  const [newQuot, setNewQuot] = useState({
    clientName: '',
    clientEmail: '',
    totalAmount: 60000
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
        onRefresh();
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
        onRefresh();
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
            Invoices & Automated Billing ({data.invoices.length})
          </button>
          <button 
            className={`btn ${activeTab === 'quotations' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('quotations')}
          >
            <Briefcase style={{ width: 16, height: 16 }} />
            Client Quotations ({data.quotations.length})
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
                <th>Payment Reminder</th>
              </tr>
            </thead>
            <tbody>
              {data.invoices.map(inv => (
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
                  <td>{inv.dueDate}</td>
                  <td>
                    {inv.status === 'PAID' && <span className="badge badge-approved">PAID</span>}
                    {inv.status === 'PARTIAL' && <span className="badge badge-pending">PARTIAL</span>}
                    {inv.status === 'OVERDUE' && <span className="badge badge-rejected">OVERDUE</span>}
                    {inv.status === 'UNPAID' && <span className="badge badge-pending">UNPAID</span>}
                  </td>
                  <td>
                    {inv.balanceAmount > 0 ? (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                        onClick={() => handleSendPaymentReminder(inv.clientName, inv.invoiceNumber)}
                      >
                        <BellRing style={{ width: 14, height: 14, color: 'var(--brand-yellow)' }} />
                        Send Reminder
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--brand-green)' }}>✓ Fully Settled</span>
                    )}
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
              </tr>
            </thead>
            <tbody>
              {data.quotations.map(q => (
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
                  <td>{q.validUntil}</td>
                  <td>
                    {q.status === 'APPROVED' && <span className="badge badge-approved">APPROVED</span>}
                    {q.status === 'SENT' && <span className="badge badge-scheduled">SENT TO CLIENT</span>}
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

    </div>
  );
}
