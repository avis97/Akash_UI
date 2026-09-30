import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  CreditCard,
  Plus,
  CheckCircle,
  FileCheck,
  DollarSign,
  Tag,
  Edit2,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export default function PurchaseVouchers({ data = {}, currentRole, onRefresh, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab || 'purchases'); // 'purchases' | 'vouchers'
  const [showPurModal, setShowPurModal] = useState(false);
  const [showVchModal, setShowVchModal] = useState(false);

  // Edit / Delete states
  const [editingPur, setEditingPur] = useState(null);
  const [deletingPur, setDeletingPur] = useState(null);
  const [editingVch, setEditingVch] = useState(null);
  const [deletingVch, setDeletingVch] = useState(null);

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  const [purchases, setPurchases] = useState(data.purchases || []);
  const [vouchers, setVouchers] = useState(data.vouchers || []);

  const fetchPurchaseData = useCallback(async () => {
    try {
      const [purRes, vchRes] = await Promise.allSettled([
        fetch('/api/purchases').then(r => r.json()),
        fetch('/api/vouchers').then(r => r.json())
      ]);

      if (purRes.status === 'fulfilled' && purRes.value?.success) setPurchases(purRes.value.data);
      if (vchRes.status === 'fulfilled' && vchRes.value?.success) setVouchers(vchRes.value.data);
    } catch (err) {
      console.error('Error fetching purchase data:', err);
    }
  }, []);

  useEffect(() => {
    fetchPurchaseData();
  }, [fetchPurchaseData]);

  // New Purchase State
  const [newPur, setNewPur] = useState({
    vendorName: '',
    vendorGst: '19AABCC1234F1ZB',
    invoiceNo: '',
    category: 'Networking Equipment',
    totalAmount: 85000
  });

  // Edit Purchase State
  const [editPurData, setEditPurData] = useState({
    vendorName: '',
    vendorGst: '',
    invoiceNo: '',
    category: 'Networking Equipment',
    totalAmount: 85000,
    status: 'APPROVED'
  });

  // New Voucher State
  const [newVch, setNewVch] = useState({
    type: 'PAYMENT',
    amount: 25000,
    accountHead: 'Vendor Settlement',
    narration: 'Payment voucher for incoming stock'
  });

  // Edit Voucher State
  const [editVchData, setEditVchData] = useState({
    type: 'PAYMENT',
    amount: 25000,
    accountHead: '',
    narration: '',
    status: 'APPROVED'
  });

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPur)
      });
      const json = await res.json();
      if (json.success) {
        setShowPurModal(false);
        setNewPur({ vendorName: '', vendorGst: '19AABCC1234F1ZB', invoiceNo: '', category: 'Networking Equipment', totalAmount: 85000 });
        fetchPurchaseData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditPurchase = async (e) => {
    e.preventDefault();
    if (!editingPur) return;
    try {
      const res = await fetch(`/api/purchases/${editingPur.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPurData)
      });
      const json = await res.json();
      if (json.success) {
        setEditingPur(null);
        fetchPurchaseData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePurchase = async () => {
    if (!deletingPur) return;
    try {
      const res = await fetch(`/api/purchases/${deletingPur.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setDeletingPur(null);
        fetchPurchaseData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVch)
      });
      const json = await res.json();
      if (json.success) {
        setShowVchModal(false);
        setNewVch({ type: 'PAYMENT', amount: 25000, accountHead: 'Vendor Settlement', narration: 'Payment voucher for incoming stock' });
        fetchPurchaseData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditVoucher = async (e) => {
    e.preventDefault();
    if (!editingVch) return;
    try {
      const res = await fetch(`/api/vouchers/${editingVch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editVchData)
      });
      const json = await res.json();
      if (json.success) {
        setEditingVch(null);
        fetchPurchaseData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVoucher = async () => {
    if (!deletingVch) return;
    try {
      const res = await fetch(`/api/vouchers/${deletingVch.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setDeletingVch(null);
        fetchPurchaseData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Sub-nav & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            className={`btn ${activeTab === 'purchases' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('purchases')}
          >
            <ShoppingBag style={{ width: 16, height: 16 }} />
            Purchase Entry Module ({purchases.length})
          </button>
          <button
            className={`btn ${activeTab === 'vouchers' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('vouchers')}
          >
            <CreditCard style={{ width: 16, height: 16 }} />
            Voucher Entry Ledger ({vouchers.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {activeTab === 'purchases' ? (
            <button className="btn btn-primary" onClick={() => setShowPurModal(true)}>
              <Plus style={{ width: 16, height: 16 }} />
              Log Vendor Purchase Entry
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowVchModal(true)}>
              <Plus style={{ width: 16, height: 16 }} />
              Create New Voucher
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: Purchases */}
      {activeTab === 'purchases' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
              Vendor Purchase Records & Auto Stock Increment
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              GST Input Credit & Inventory Category Mapping
            </span>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Vendor & GSTIN</th>
                <th>Vendor Invoice</th>
                <th>Category</th>
                <th>Net Amount</th>
                <th>GST (18%)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(pur => (
                <tr key={pur.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-yellow)' }}>
                      {pur.purchaseOrderNo}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{pur.vendorName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GSTIN: {pur.vendorGst}</div>
                  </td>
                  <td>{pur.invoiceNo}</td>
                  <td><span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{pur.category}</span></td>
                  <td>₹{pur.totalAmount.toLocaleString()}</td>
                  <td style={{ color: 'var(--brand-green)' }}>+₹{pur.gstAmount.toLocaleString()}</td>
                  <td>
                    {pur.status === 'APPROVED' ? (
                      <span className="badge badge-approved">APPROVED & STOCKED</span>
                    ) : (
                      <span className="badge badge-pending">PENDING APPROVAL</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                        title="Edit Purchase Record"
                        onClick={() => {
                          setEditingPur(pur);
                          setEditPurData({
                            vendorName: pur.vendorName || '',
                            vendorGst: pur.vendorGst || '',
                            invoiceNo: pur.invoiceNo || '',
                            category: pur.category || 'Networking Equipment',
                            totalAmount: pur.totalAmount || 0,
                            status: pur.status || 'APPROVED'
                          });
                        }}
                      >
                        <Edit2 size={14} color="var(--brand-primary)" />
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                        title="Delete Purchase Record"
                        onClick={() => setDeletingPur(pur)}
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

      {/* TAB 2: Vouchers */}
      {activeTab === 'vouchers' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
              Financial Voucher Ledger (Payment, Journal, Contra, Receipt)
            </h3>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Voucher Type</th>
                <th>Account Head</th>
                <th>Amount</th>
                <th>Narration</th>
                <th>Approved By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map(v => (
                <tr key={v.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-yellow)' }}>
                      {v.voucherNo}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${v.type === 'PAYMENT' ? 'badge-rejected' :
                        v.type === 'RECEIPT' ? 'badge-approved' : 'badge-scheduled'
                      }`}>
                      {v.type}
                    </span>
                  </td>
                  <td><strong>{v.accountHead}</strong></td>
                  <td><strong style={{ fontSize: '0.95rem' }}>₹{v.amount.toLocaleString()}</strong></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 220 }}>{v.narration}</td>
                  <td>{v.approvedBy || '—'}</td>
                  <td><span className="badge badge-approved">{v.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                        title="Edit Voucher Record"
                        onClick={() => {
                          setEditingVch(v);
                          setEditVchData({
                            type: v.type || 'PAYMENT',
                            amount: v.amount || 0,
                            accountHead: v.accountHead || '',
                            narration: v.narration || '',
                            status: v.status || 'APPROVED'
                          });
                        }}
                      >
                        <Edit2 size={14} color="var(--brand-primary)" />
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                        title="Delete Voucher Record"
                        onClick={() => setDeletingVch(v)}
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

      {/* Modal 1: Log Vendor Purchase */}
      {showPurModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Log Vendor Purchase Entry
            </h3>
            <form onSubmit={handleCreatePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vendor Organization Name</label>
                <input
                  className="input-field"
                  required
                  value={newPur.vendorName}
                  onChange={e => setNewPur({ ...newPur, vendorName: e.target.value })}
                  placeholder="e.g. Compuage Infocom / Aditya Infotech"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vendor GSTIN</label>
                  <input
                    className="input-field"
                    required
                    value={newPur.vendorGst}
                    onChange={e => setNewPur({ ...newPur, vendorGst: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vendor Invoice No</label>
                  <input
                    className="input-field"
                    required
                    value={newPur.invoiceNo}
                    onChange={e => setNewPur({ ...newPur, invoiceNo: e.target.value })}
                    placeholder="e.g. CI-98421"
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Inventory Category</label>
                  <select
                    className="select-field"
                    value={newPur.category}
                    onChange={e => setNewPur({ ...newPur, category: e.target.value })}
                  >
                    <option value="Networking Equipment">Networking Equipment</option>
                    <option value="Security & Surveillance">Security & Surveillance</option>
                    <option value="Cables & Wiring">Cables & Wiring</option>
                    <option value="Power Systems">Power Systems</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Invoice Amount (₹)</label>
                  <input
                    type="number"
                    className="input-field"
                    required
                    value={newPur.totalAmount}
                    onChange={e => setNewPur({ ...newPur, totalAmount: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPurModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Purchase Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 1B: Edit Purchase Entry */}
      {editingPur && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Edit Purchase Entry ({editingPur.purchaseOrderNo})
            </h3>
            <form onSubmit={handleEditPurchase} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vendor Organization Name</label>
                <input
                  className="input-field"
                  required
                  value={editPurData.vendorName}
                  onChange={e => setEditPurData({ ...editPurData, vendorName: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vendor GSTIN</label>
                  <input
                    className="input-field"
                    required
                    value={editPurData.vendorGst}
                    onChange={e => setEditPurData({ ...editPurData, vendorGst: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vendor Invoice No</label>
                  <input
                    className="input-field"
                    required
                    value={editPurData.invoiceNo}
                    onChange={e => setEditPurData({ ...editPurData, invoiceNo: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Inventory Category</label>
                  <select
                    className="select-field"
                    value={editPurData.category}
                    onChange={e => setEditPurData({ ...editPurData, category: e.target.value })}
                  >
                    <option value="Networking Equipment">Networking Equipment</option>
                    <option value="Security & Surveillance">Security & Surveillance</option>
                    <option value="Cables & Wiring">Cables & Wiring</option>
                    <option value="Power Systems">Power Systems</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Invoice Amount (₹)</label>
                  <input
                    type="number"
                    className="input-field"
                    required
                    value={editPurData.totalAmount}
                    onChange={e => setEditPurData({ ...editPurData, totalAmount: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Approval Status</label>
                <select
                  className="select-field"
                  value={editPurData.status}
                  onChange={e => setEditPurData({ ...editPurData, status: e.target.value })}
                >
                  <option value="APPROVED">APPROVED & STOCKED</option>
                  <option value="PENDING">PENDING APPROVAL</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingPur(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Purchase Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Voucher */}
      {showVchModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Create Financial Accounting Voucher
            </h3>
            <form onSubmit={handleCreateVoucher} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Voucher Type</label>
                  <select
                    className="select-field"
                    value={newVch.type}
                    onChange={e => setNewVch({ ...newVch, type: e.target.value })}
                  >
                    <option value="PAYMENT">Payment Voucher</option>
                    <option value="RECEIPT">Receipt Voucher</option>
                    <option value="JOURNAL">Journal Voucher</option>
                    <option value="CONTRA">Contra Voucher</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Voucher Amount (₹)</label>
                  <input
                    type="number"
                    className="input-field"
                    required
                    value={newVch.amount}
                    onChange={e => setNewVch({ ...newVch, amount: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Account Head</label>
                <input
                  className="input-field"
                  required
                  value={newVch.accountHead}
                  onChange={e => setNewVch({ ...newVch, accountHead: e.target.value })}
                  placeholder="e.g. Vendor Settlement / Client NEFT"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Narration & Description</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={newVch.narration}
                  onChange={e => setNewVch({ ...newVch, narration: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowVchModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Post Voucher</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2B: Edit Voucher */}
      {editingVch && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Edit Voucher ({editingVch.voucherNo})
            </h3>
            <form onSubmit={handleEditVoucher} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Voucher Type</label>
                  <select
                    className="select-field"
                    value={editVchData.type}
                    onChange={e => setEditVchData({ ...editVchData, type: e.target.value })}
                  >
                    <option value="PAYMENT">Payment Voucher</option>
                    <option value="RECEIPT">Receipt Voucher</option>
                    <option value="JOURNAL">Journal Voucher</option>
                    <option value="CONTRA">Contra Voucher</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Voucher Amount (₹)</label>
                  <input
                    type="number"
                    className="input-field"
                    required
                    value={editVchData.amount}
                    onChange={e => setEditVchData({ ...editVchData, amount: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Account Head</label>
                <input
                  className="input-field"
                  required
                  value={editVchData.accountHead}
                  onChange={e => setEditVchData({ ...editVchData, accountHead: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Narration</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={editVchData.narration}
                  onChange={e => setEditVchData({ ...editVchData, narration: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingVch(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Voucher Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Purchase Confirmation Modal */}
      {deletingPur && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f87171' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0 }}>
                Confirm Purchase Entry Deletion
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete purchase record <strong>{deletingPur.purchaseOrderNo}</strong> from <strong>{deletingPur.vendorName}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingPur(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleDeletePurchase}>
                Delete Purchase Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Voucher Confirmation Modal */}
      {deletingVch && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f87171' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0 }}>
                Confirm Voucher Deletion
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete voucher entry <strong>{deletingVch.voucherNo}</strong> for <strong>₹{deletingVch.amount.toLocaleString()}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingVch(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleDeleteVoucher}>
                Delete Voucher
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
