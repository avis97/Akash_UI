import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  PackageOpen,
  Plus, 
  QrCode, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search,
  Filter,
  Layers,
  Edit2,
  Trash2,
  X,
  Upload,
  Calendar,
  User,
  CheckCircle,
  Clock,
  FileText,
  Building,
  CheckCircle2,
  UserCheck
} from 'lucide-react';

export default function InventoryManager({ data = {}, currentRole = 'SUPERADMIN', currentUser, onRefresh }) {
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'material_requests'
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  // Modals for Inventory Products
  const [showAddProdModal, setShowAddProdModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Modals & State for Material Requests
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMatReq, setEditingMatReq] = useState(null);
  const [deletingMaterialReq, setDeletingMaterialReq] = useState(null);

  // Data lists
  const [products, setProducts] = useState(data.inventory || data.products || []);
  const [materialRequests, setMaterialRequests] = useState(data.materialRequests || []);
  const [users, setUsers] = useState(data.users || []);
  const [meetings, setMeetings] = useState(data.serviceMeetings || data.meetings || []);

  // Fetch Inventory from API
  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory');
      const json = await res.json();
      if (json.success) setProducts(json.data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  }, []);

  // Fetch Material Requests from API
  const fetchMaterialRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/material-requests');
      const json = await res.json();
      if (json.success) setMaterialRequests(json.data);
    } catch (err) {
      console.error('Error fetching material requests:', err);
    }
  }, []);

  // Fetch Auxiliary Data from API
  const fetchAuxData = useCallback(async () => {
    try {
      const [uRes, mRes] = await Promise.allSettled([
        fetch('/api/users').then(r => r.json()),
        fetch('/api/meetings').then(r => r.json())
      ]);
      if (uRes.status === 'fulfilled' && uRes.value?.success) setUsers(uRes.value.data);
      if (mRes.status === 'fulfilled' && mRes.value?.success) setMeetings(mRes.value.data);
    } catch (err) {
      console.error('Aux data fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchMaterialRequests();
    fetchAuxData();
  }, [fetchInventory, fetchMaterialRequests, fetchAuxData]);

  // Sync prop updates
  useEffect(() => {
    if (data.inventory || data.products) setProducts(data.inventory || data.products);
    if (data.materialRequests) setMaterialRequests(data.materialRequests);
    if (data.users) setUsers(data.users);
    if (data.serviceMeetings || data.meetings) setMeetings(data.serviceMeetings || data.meetings);
  }, [data]);

  // New Product Form State
  const [newProd, setNewProd] = useState({
    name: '',
    category: 'Networking Equipment',
    brand: '',
    stockQuantity: 10,
    unit: 'Pcs',
    minStockAlert: 5,
    unitPrice: 5000
  });

  // Edit Product Form State
  const [editProd, setEditProd] = useState({
    name: '',
    category: 'Networking Equipment',
    brand: '',
    stockQuantity: 10,
    unit: 'Pcs',
    minStockAlert: 5,
    unitPrice: 5000
  });

  // Stock Tx Form State
  const [stockTx, setStockTx] = useState({
    type: 'INFLOW',
    quantity: 5,
    referenceNo: 'PO-2026-REF'
  });

  // Material Request Form State
  const defaultNextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const [newMatReq, setNewMatReq] = useState({
    subject: '',
    requestedForUserId: '',
    requestedForUserName: '',
    priority: 'Low',
    status: 'Open',
    endDate: defaultNextWeek,
    description: '',
    attachmentUrl: '',
    meetingId: '',
    selectedProdId: '',
    itemTitle: '',
    quantity: 1,
    unit: 'Pcs',
    justification: '',
    expectedUsage: ''
  });

  // Edit Material Request State
  const [editMatReqData, setEditMatReqData] = useState({
    subject: '',
    requestedForUserId: '',
    requestedForUserName: '',
    priority: 'Low',
    status: 'Open',
    endDate: '',
    description: '',
    attachmentUrl: '',
    meetingId: '',
    selectedProdId: '',
    itemTitle: '',
    quantity: 1,
    unit: 'Pcs'
  });

  const categories = ['ALL', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.code || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const filteredMaterialRequests = materialRequests.filter(m => {
    const term = searchTerm.toLowerCase();
    return (m.subject || '').toLowerCase().includes(term) ||
           (m.itemTitle || '').toLowerCase().includes(term) ||
           (m.requestedForUserName || '').toLowerCase().includes(term) ||
           (m.status || '').toLowerCase().includes(term);
  });

  // Product Actions
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd)
      });
      const json = await res.json();
      if (json.success) {
        setShowAddProdModal(false);
        setNewProd({
          name: '',
          category: 'Networking Equipment',
          brand: '',
          stockQuantity: 10,
          unit: 'Pcs',
          minStockAlert: 5,
          unitPrice: 5000
        });
        fetchInventory();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const res = await fetch(`/api/inventory/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProd)
      });
      const json = await res.json();
      if (json.success) {
        setEditingProduct(null);
        fetchInventory();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      const res = await fetch(`/api/inventory/${deletingProduct.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setDeletingProduct(null);
        fetchInventory();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStockTxSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const res = await fetch('/api/inventory/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          type: stockTx.type,
          quantity: stockTx.quantity,
          referenceNo: stockTx.referenceNo
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowTxModal(false);
        setSelectedProduct(null);
        fetchInventory();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Material Request Handlers
  const handleOpenRequestModalForProduct = (product) => {
    const targetUser = currentUser || users[0];
    setNewMatReq({
      subject: `Material Request: ${product.name}`,
      requestedForUserId: targetUser?.id || '',
      requestedForUserName: targetUser?.name || 'Alok Naiya',
      priority: product.stockQuantity <= product.minStockAlert ? 'Urgent' : 'Medium',
      status: 'Open',
      endDate: defaultNextWeek,
      description: `Requesting allocation/procurement of ${product.name} (Category: ${product.category || 'General'}).`,
      attachmentUrl: '',
      meetingId: '',
      selectedProdId: product.id,
      itemTitle: product.name,
      quantity: 1,
      unit: product.unit || 'Pcs',
      justification: `Inventory request for ${product.name}`,
      expectedUsage: `Stock dispatch`
    });
    setShowMaterialModal(true);
  };

  const handleGenerateAIMaterialRequest = () => {
    const randomUser = users[Math.floor(Math.random() * users.length)] || currentUser;
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    setNewMatReq({
      subject: randomProduct ? `Request for ${randomProduct.name}` : 'Urgent Maintenance Materials Supply',
      requestedForUserId: randomUser?.id || '',
      requestedForUserName: randomUser?.name || 'Alok Naiya',
      priority: 'High',
      status: 'Open',
      endDate: defaultNextWeek,
      description: 'Requesting urgent material supply for field installation, replacement of damaged cable lines, and network equipment.',
      attachmentUrl: '',
      meetingId: meetings[0]?.id || '',
      selectedProdId: randomProduct?.id || '',
      itemTitle: randomProduct ? randomProduct.name : 'Cat6 Network Cable & POE Switch',
      quantity: 2,
      unit: randomProduct?.unit || 'Pcs',
      justification: 'Critical site maintenance required during scheduled client service visit.',
      expectedUsage: 'On-site hardware replacement'
    });
  };

  const handleMatAttachmentUpload = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditMatReqData(prev => ({ ...prev, attachmentUrl: reader.result }));
        } else {
          setNewMatReq(prev => ({ ...prev, attachmentUrl: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitMaterialRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/material-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMatReq,
          requestedBy: currentRole
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowMaterialModal(false);
        setNewMatReq({
          subject: '',
          requestedForUserId: '',
          requestedForUserName: '',
          priority: 'Low',
          status: 'Open',
          endDate: defaultNextWeek,
          description: '',
          attachmentUrl: '',
          meetingId: '',
          selectedProdId: '',
          itemTitle: '',
          quantity: 1,
          unit: 'Pcs',
          justification: '',
          expectedUsage: ''
        });
        fetchMaterialRequests();
        if (onRefresh) onRefresh();
      } else {
        alert(json.message || 'Failed to submit material request');
      }
    } catch (err) {
      console.error('Error submitting material request:', err);
    }
  };

  const handleUpdateMaterialRequest = async (e) => {
    e.preventDefault();
    if (!editingMatReq) return;
    try {
      const res = await fetch(`/api/material-requests/${editingMatReq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editMatReqData)
      });
      const json = await res.json();
      if (json.success) {
        setEditingMatReq(null);
        fetchMaterialRequests();
        if (onRefresh) onRefresh();
      } else {
        alert(json.message || 'Failed to update material request');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMaterialRequest = async () => {
    if (!deletingMaterialReq) return;
    try {
      const res = await fetch(`/api/material-requests/${deletingMaterialReq.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setDeletingMaterialReq(null);
        fetchMaterialRequests();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveMaterialStep = async (matId, targetRole) => {
    try {
      const res = await fetch(`/api/material-requests/${matId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: targetRole,
          approverName: currentUser?.name || (targetRole === 'MASTER_ADMIN' ? 'Master Admin' : 'Facility Manager')
        })
      });
      const json = await res.json();
      if (json.success) {
        fetchMaterialRequests();
        if (onRefresh) onRefresh();
      } else {
        alert(json.message || 'Approval action failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Top Navigation & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: '#ffffff', padding: '0.65rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        
        {/* Left: Tab Switcher & Search */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem' }}>
          <div style={{ display: 'flex', gap: '0.25rem', background: '#f1f5f9', padding: '0.2rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <button 
              className={`btn ${activeTab === 'catalog' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              onClick={() => setActiveTab('catalog')}
            >
              <Package style={{ width: 16, height: 16 }} />
              Stock Catalog ({products.length})
            </button>
            <button 
              className={`btn ${activeTab === 'material_requests' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
              onClick={() => setActiveTab('material_requests')}
            >
              <PackageOpen style={{ width: 16, height: 16 }} />
              Material Requests ({materialRequests.length})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 260 }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search style={{ position: 'absolute', left: 10, top: 10, width: 15, height: 15, color: '#64748b' }} />
              <input 
                className="input-field" 
                style={{ paddingLeft: '2.1rem', fontSize: '0.85rem', padding: '0.45rem 0.65rem 0.45rem 2.1rem' }}
                placeholder={activeTab === 'catalog' ? "Search products by code or name..." : "Search material requests..."}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            {activeTab === 'catalog' && (
              <select 
                className="select-field"
                style={{ width: 150, fontSize: '0.85rem', padding: '0.45rem' }}
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Right: Primary Actions */}
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={() => setShowScanModal(true)}>
            <QrCode style={{ width: 16, height: 16, color: '#f59e0b' }} />
            Scan Barcode / QR
          </button>

          <button 
            className="btn btn-secondary" 
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', borderColor: '#22c55e', color: '#15803d', fontWeight: 600 }} 
            onClick={() => {
              const defaultUser = currentUser || users[0];
              setNewMatReq({
                subject: '',
                requestedForUserId: defaultUser?.id || '',
                requestedForUserName: defaultUser?.name || '',
                priority: 'Low',
                status: 'Open',
                endDate: defaultNextWeek,
                description: '',
                attachmentUrl: '',
                meetingId: '',
                selectedProdId: '',
                itemTitle: '',
                quantity: 1,
                unit: 'Pcs',
                justification: '',
                expectedUsage: ''
              });
              setShowMaterialModal(true);
            }}
          >
            <PackageOpen style={{ width: 16, height: 16, color: '#22c55e' }} />
            Create Material Request
          </button>

          {activeTab === 'catalog' && (
            <button className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={() => setShowAddProdModal(true)}>
              <Plus style={{ width: 16, height: 16 }} />
              Add Product Item
            </button>
          )}
        </div>

      </div>

      {/* Alert Banner for Low Stock Items */}
      {products.some(p => p.stockQuantity <= p.minStockAlert) && activeTab === 'catalog' && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          padding: '0.75rem 1.15rem',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertTriangle style={{ color: '#ef4444', width: 20, height: 20 }} />
          <div>
            <strong style={{ color: '#dc2626', fontSize: '0.88rem' }}>Stock Alert: </strong>
            <span style={{ fontSize: '0.85rem', color: '#7f1d1d' }}>
              {products.filter(p => p.stockQuantity <= p.minStockAlert).map(p => p.name).join(', ')} are running low on stock!
            </span>
          </div>
        </div>
      )}

      {/* TAB 1: Centralized Stock Inventory Catalog */}
      {activeTab === 'catalog' && (
        <div className="glass-card" style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Centralized Stock Inventory Catalog ({filteredProducts.length} Line Items)
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Real-time Inflow/Outflow Stock Ledger
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>ITEM CODE</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>PRODUCT LINE ITEM & BRAND</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>CATEGORY</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>STOCK ON HAND</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>UNIT PRICE</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>TOTAL STOCK VALUE</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>STOCK STATUS</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textCenter: 'center', padding: '2rem', color: '#64748b', textAlign: 'center' }}>
                      No inventory product items found. Click "+ Add Product Item" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => {
                    const isLow = p.stockQuantity <= p.minStockAlert;
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#d97706', fontSize: '0.88rem' }}>
                            {p.code}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Brand: {p.brand}</div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ fontSize: '0.82rem', color: '#475569' }}>{p.category}</span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <strong style={{ fontSize: '0.95rem', color: isLow ? '#dc2626' : '#0f172a' }}>
                            {p.stockQuantity} {p.unit}
                          </strong>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Min alert: {p.minStockAlert}</div>
                        </td>
                        <td style={{ padding: '0.75rem', fontSize: '0.88rem' }}>₹{Number(p.unitPrice || 0).toLocaleString()}</td>
                        <td style={{ padding: '0.75rem', fontSize: '0.88rem' }}><strong>₹{(Number(p.stockQuantity || 0) * Number(p.unitPrice || 0)).toLocaleString()}</strong></td>
                        <td style={{ padding: '0.75rem' }}>
                          {isLow ? (
                            <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                              ⚠ LOW STOCK
                            </span>
                          ) : (
                            <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                              In Stock
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#f1f5f9', borderColor: '#cbd5e1' }}
                              onClick={() => {
                                setSelectedProduct(p);
                                setShowTxModal(true);
                              }}
                            >
                              Stock +/-
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              title="Request Material for this Product"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#f0fdf4', borderColor: '#86efac', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                              onClick={() => handleOpenRequestModalForProduct(p)}
                            >
                              <PackageOpen size={13} /> Request
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              title="Edit Product Details"
                              style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem', background: '#f8fafc' }}
                              onClick={() => {
                                setEditingProduct(p);
                                setEditProd({
                                  name: p.name || '',
                                  category: p.category || 'Networking Equipment',
                                  brand: p.brand || '',
                                  stockQuantity: p.stockQuantity || 0,
                                  unit: p.unit || 'Pcs',
                                  minStockAlert: p.minStockAlert || 5,
                                  unitPrice: p.unitPrice || 0
                                });
                              }}
                            >
                              <Edit2 size={13} color="#2563eb" />
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              title="Delete Product"
                              style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem', borderColor: '#fca5a5', color: '#ef4444', background: '#fef2f2' }}
                              onClick={() => setDeletingProduct(p)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Material Requests List & Approvals */}
      {activeTab === 'material_requests' && (
        <div className="glass-card" style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Centralized Material Requests List ({filteredMaterialRequests.length})
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, marginTop: '2px' }}>
                Track materials requested for field work, site maintenance, and inventory dispatches.
              </p>
            </div>
            <button 
              className="btn btn-primary" 
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
              onClick={() => {
                const defaultUser = currentUser || users[0];
                setNewMatReq({
                  subject: '',
                  requestedForUserId: defaultUser?.id || '',
                  requestedForUserName: defaultUser?.name || '',
                  priority: 'Low',
                  status: 'Open',
                  endDate: defaultNextWeek,
                  description: '',
                  attachmentUrl: '',
                  meetingId: '',
                  selectedProdId: '',
                  itemTitle: '',
                  quantity: 1,
                  unit: 'Pcs',
                  justification: '',
                  expectedUsage: ''
                });
                setShowMaterialModal(true);
              }}
            >
              <PackageOpen size={16} /> Create Material Request
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>REQUEST / SUBJECT</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>REQUIRED ITEM & QTY</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>REQUESTED FOR USER</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>PRIORITY</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>STATUS</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>END DATE</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>ATTACHMENT</th>
                  <th style={{ padding: '0.75rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterialRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                      <PackageOpen size={36} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5, color: '#22c55e' }} />
                      <div>No material requests submitted yet.</div>
                      <button 
                        className="btn btn-secondary" 
                        style={{ marginTop: '0.75rem', fontSize: '0.8rem', borderColor: '#22c55e', color: '#16a34a' }}
                        onClick={() => setShowMaterialModal(true)}
                      >
                        Create Material Request
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredMaterialRequests.map(m => {
                    const priorityColor = 
                      m.priority === 'Urgent' ? { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' } :
                      m.priority === 'High' ? { bg: '#fff7ed', text: '#ea580c', border: '#ffedd5' } :
                      m.priority === 'Medium' ? { bg: '#fefce8', text: '#ca8a04', border: '#fef08a' } :
                      { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };

                    const statusBadge = 
                      m.status === 'Approved' || m.status === 'APPROVED' ? { bg: '#f0fdf4', text: '#16a34a', label: 'Approved ✓' } :
                      m.status === 'Rejected' || m.status === 'REJECTED' ? { bg: '#fef2f2', text: '#dc2626', label: 'Rejected ✗' } :
                      m.status === 'Completed' ? { bg: '#f8fafc', text: '#0f172a', label: 'Completed' } :
                      m.status === 'Pending' || m.status.startsWith('PENDING') ? { bg: '#fff7ed', text: '#d97706', label: 'Pending Approval' } :
                      { bg: '#eff6ff', text: '#2563eb', label: m.status || 'Open' };

                    const formattedEndDate = m.endDate ? new Date(m.endDate).toLocaleDateString() : 'N/A';

                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>
                            {m.subject || m.itemTitle}
                          </div>
                          {m.description && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {m.description}
                            </div>
                          )}
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>ID: #{m.id.substring(0, 8)}</div>
                        </td>

                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>
                            {m.itemTitle || m.subject}
                          </div>
                          <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', color: '#475569' }}>
                            Qty: <strong>{m.quantity || 1} {m.unit || 'Pcs'}</strong>
                          </span>
                        </td>

                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                            <User size={14} color="#64748b" />
                            {m.requestedForUserName || 'Alok Naiya'}
                          </div>
                        </td>

                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ background: priorityColor.bg, color: priorityColor.text, border: `1px solid ${priorityColor.border}`, padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                            {m.priority || 'Low'}
                          </span>
                        </td>

                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ background: statusBadge.bg, color: statusBadge.text, padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                            {statusBadge.label}
                          </span>
                        </td>

                        <td style={{ padding: '0.75rem', fontSize: '0.82rem', color: '#475569' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={13} color="#94a3b8" />
                            {formattedEndDate}
                          </div>
                        </td>

                        <td style={{ padding: '0.75rem' }}>
                          {m.attachmentUrl ? (
                            <a href={m.attachmentUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <FileText size={14} /> Attachment
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>None</span>
                          )}
                        </td>

                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                            {/* Workflow Approval Action Buttons */}
                            {currentRole === 'MASTER_ADMIN' && m.status === 'PENDING_MASTER_ADMIN' && (
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', background: '#eff6ff', color: '#2563eb', borderColor: '#93c5fd', fontWeight: 700 }}
                                onClick={() => handleApproveMaterialStep(m.id, 'MASTER_ADMIN')}
                              >
                                Approve Step 1
                              </button>
                            )}

                            {currentRole === 'FACILITY_MANAGER' && m.status === 'PENDING_FACILITY_MANAGER' && (
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', background: '#f0fdf4', color: '#16a34a', borderColor: '#86efac', fontWeight: 700 }}
                                onClick={() => handleApproveMaterialStep(m.id, 'FACILITY_MANAGER')}
                              >
                                Final Approval
                              </button>
                            )}

                            <button 
                              className="btn btn-secondary" 
                              title="Edit Material Request"
                              style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
                              onClick={() => {
                                setEditingMatReq(m);
                                setEditMatReqData({
                                  subject: m.subject || '',
                                  requestedForUserId: m.requestedForUserId || '',
                                  requestedForUserName: m.requestedForUserName || '',
                                  priority: m.priority || 'Low',
                                  status: m.status || 'Open',
                                  endDate: m.endDate ? new Date(m.endDate).toISOString().split('T')[0] : '',
                                  description: m.description || '',
                                  attachmentUrl: m.attachmentUrl || '',
                                  meetingId: m.meetingId || '',
                                  selectedProdId: '',
                                  itemTitle: m.itemTitle || '',
                                  quantity: m.quantity || 1,
                                  unit: m.unit || 'Pcs'
                                });
                              }}
                            >
                              <Edit2 size={13} color="#2563eb" />
                            </button>

                            <button 
                              className="btn btn-secondary" 
                              title="Delete Material Request"
                              style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem', borderColor: '#fca5a5', color: '#ef4444', background: '#fef2f2' }}
                              onClick={() => setDeletingMaterialReq(m)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREATE MATERIAL REQUEST */}
      {showMaterialModal && (
        <div className="modal-overlay" onClick={() => setShowMaterialModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1.5rem' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', color: '#0f172a', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: 'calc(100vh - 3rem)', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', border: '1px solid #e2e8f0', margin: 'auto' }}>
            
            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading, sans-serif)', fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Create Material Request
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleGenerateAIMaterialRequest}
                  style={{
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem 0.85rem',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  title="Auto-fill form with AI generated sample data"
                >
                  🤖 Generate with AI
                </button>
                <button
                  onClick={() => setShowMaterialModal(false)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitMaterialRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              {/* Subject */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                  Subject<span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  className="input-field" 
                  required
                  placeholder="Enter Material Request"
                  value={newMatReq.subject}
                  onChange={e => setNewMatReq({ ...newMatReq, subject: e.target.value })}
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                />
              </div>

              {/* Row 2: Material Request for User & Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.15rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Material Request for User
                  </label>
                  <select 
                    className="select-field"
                    value={newMatReq.requestedForUserId}
                    onChange={e => {
                      const u = users.find(usr => usr.id === e.target.value);
                      setNewMatReq({ 
                        ...newMatReq, 
                        requestedForUserId: e.target.value,
                        requestedForUserName: u ? u.name : ''
                      });
                    }}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                  >
                    <option value="">Select User</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Create user here. <span onClick={() => alert('Please navigate to User Management module to create a new user account.')} style={{ color: '#22c55e', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>Create user</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Priority
                  </label>
                  <select 
                    className="select-field"
                    value={newMatReq.priority}
                    onChange={e => setNewMatReq({ ...newMatReq, priority: e.target.value })}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Status & End Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.15rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Status
                  </label>
                  <select 
                    className="select-field"
                    value={newMatReq.status}
                    onChange={e => setNewMatReq({ ...newMatReq, status: e.target.value })}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                  >
                    <option value="Open">Open</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Approved">Approved</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    End Date<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="date"
                    className="input-field"
                    required
                    value={newMatReq.endDate}
                    onChange={e => setNewMatReq({ ...newMatReq, endDate: e.target.value })}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                  Description
                </label>
                <textarea 
                  className="input-field" 
                  rows={3}
                  placeholder="Enter Description"
                  value={newMatReq.description}
                  onChange={e => setNewMatReq({ ...newMatReq, description: e.target.value, justification: e.target.value })}
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              {/* Attachment */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                  Attachment
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <input 
                    type="file" 
                    id="inventory-mat-attachment-input" 
                    style={{ display: 'none' }} 
                    onChange={e => handleMatAttachmentUpload(e, false)}
                  />
                  <label 
                    htmlFor="inventory-mat-attachment-input"
                    style={{
                      background: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      padding: '0.6rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Upload size={15} /> Choose File
                  </label>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    {newMatReq.attachmentUrl ? 'File Loaded ✓' : 'No file chosen'}
                  </span>
                </div>
                {newMatReq.attachmentUrl && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img src={newMatReq.attachmentUrl} alt="Attachment Preview" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                    <button type="button" onClick={() => setNewMatReq({ ...newMatReq, attachmentUrl: '' })} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', cursor: 'pointer' }}>Remove</button>
                  </div>
                )}
              </div>

              {/* Required Material / Item Details Section */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📦 REQUIRED MATERIAL / ITEM DETAILS
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Material / Item Description</label>
                    <select 
                      className="select-field"
                      value={
                        newMatReq.selectedProdId || 
                        (products.some(p => p.name === newMatReq.itemTitle) ? products.find(p => p.name === newMatReq.itemTitle)?.id : (newMatReq.itemTitle ? 'CUSTOM' : ''))
                      }
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'CUSTOM') {
                          setNewMatReq(prev => ({ ...prev, selectedProdId: 'CUSTOM', itemTitle: '' }));
                        } else if (val) {
                          const prod = products.find(p => p.id === val);
                          if (prod) {
                            setNewMatReq(prev => ({ 
                              ...prev, 
                              selectedProdId: val,
                              itemTitle: prod.name, 
                              unit: prod.unit || 'Pcs' 
                            }));
                          }
                        } else {
                          setNewMatReq(prev => ({ ...prev, selectedProdId: '', itemTitle: '' }));
                        }
                      }}
                      style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                    >
                      <option value="">Select Material / Item from Inventory...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category || 'Stock'}) — {p.stockQuantity} {p.unit} in stock
                        </option>
                      ))}
                      <option value="CUSTOM">✏ Enter Custom Item Description...</option>
                    </select>

                    {(newMatReq.selectedProdId === 'CUSTOM' || (!products.some(p => p.name === newMatReq.itemTitle) && newMatReq.itemTitle)) && (
                      <input 
                        className="input-field" 
                        placeholder="e.g. Copper Wire Coil 50m"
                        value={newMatReq.itemTitle}
                        onChange={e => setNewMatReq({ ...newMatReq, itemTitle: e.target.value })}
                        style={{ marginTop: '0.35rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                      />
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Quantity</label>
                    <input 
                      type="number"
                      min="1"
                      className="input-field" 
                      value={newMatReq.quantity}
                      onChange={e => setNewMatReq({ ...newMatReq, quantity: e.target.value })}
                      style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Unit</label>
                    <input 
                      className="input-field" 
                      value={newMatReq.unit}
                      onChange={e => setNewMatReq({ ...newMatReq, unit: e.target.value })}
                      style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Link to Service Meeting (Optional)</label>
                  <select 
                    className="select-field"
                    value={newMatReq.meetingId}
                    onChange={e => setNewMatReq({ ...newMatReq, meetingId: e.target.value })}
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                  >
                    <option value="">Select Service Meeting (Optional)</option>
                    {meetings.map(m => (
                      <option key={m.id} value={m.id}>#{m.id.substring(0, 8)} - {m.clientName || m.client} ({m.title})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => setShowMaterialModal(false)}
                  style={{ background: '#64748b', color: '#ffffff', border: 'none', padding: '0.65rem 1.4rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#ffffff', border: 'none', padding: '0.65rem 1.6rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}
                >
                  Create
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT MATERIAL REQUEST */}
      {editingMatReq && (
        <div className="modal-overlay" onClick={() => setEditingMatReq(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1.5rem' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', color: '#0f172a', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: 'calc(100vh - 3rem)', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', border: '1px solid #e2e8f0', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Edit Material Request #{editingMatReq.id.substring(0, 8)}
              </h3>
              <button onClick={() => setEditingMatReq(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateMaterialRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>Subject*</label>
                <input 
                  className="input-field" 
                  required
                  value={editMatReqData.subject}
                  onChange={e => setEditMatReqData({ ...editMatReqData, subject: e.target.value })}
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.15rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>Material Request for User</label>
                  <select 
                    className="select-field"
                    value={editMatReqData.requestedForUserId}
                    onChange={e => {
                      const u = users.find(usr => usr.id === e.target.value);
                      setEditMatReqData({ 
                        ...editMatReqData, 
                        requestedForUserId: e.target.value,
                        requestedForUserName: u ? u.name : ''
                      });
                    }}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                  >
                    <option value="">Select User</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>Priority</label>
                  <select 
                    className="select-field"
                    value={editMatReqData.priority}
                    onChange={e => setEditMatReqData({ ...editMatReqData, priority: e.target.value })}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.15rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>Status</label>
                  <select 
                    className="select-field"
                    value={editMatReqData.status}
                    onChange={e => setEditMatReqData({ ...editMatReqData, status: e.target.value })}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                  >
                    <option value="Open">Open</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Approved">Approved</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>End Date*</label>
                  <input 
                    type="date"
                    className="input-field"
                    required
                    value={editMatReqData.endDate}
                    onChange={e => setEditMatReqData({ ...editMatReqData, endDate: e.target.value })}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>Description</label>
                <textarea 
                  className="input-field" 
                  rows={3}
                  value={editMatReqData.description}
                  onChange={e => setEditMatReqData({ ...editMatReqData, description: e.target.value })}
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📦 Required Material / Item Details
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Material / Item Description</label>
                    <select 
                      className="select-field"
                      value={
                        editMatReqData.selectedProdId || 
                        (products.some(p => p.name === editMatReqData.itemTitle) ? products.find(p => p.name === editMatReqData.itemTitle)?.id : (editMatReqData.itemTitle ? 'CUSTOM' : ''))
                      }
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'CUSTOM') {
                          setEditMatReqData(prev => ({ ...prev, selectedProdId: 'CUSTOM', itemTitle: '' }));
                        } else if (val) {
                          const prod = products.find(p => p.id === val);
                          if (prod) {
                            setEditMatReqData(prev => ({ 
                              ...prev, 
                              selectedProdId: val,
                              itemTitle: prod.name, 
                              unit: prod.unit || 'Pcs' 
                            }));
                          }
                        } else {
                          setEditMatReqData(prev => ({ ...prev, selectedProdId: '', itemTitle: '' }));
                        }
                      }}
                      style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                    >
                      <option value="">Select Material / Item from Inventory...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category || 'Stock'}) — {p.stockQuantity} {p.unit} in stock
                        </option>
                      ))}
                      <option value="CUSTOM">✏ Enter Custom Item Description...</option>
                    </select>

                    {(editMatReqData.selectedProdId === 'CUSTOM' || (!products.some(p => p.name === editMatReqData.itemTitle) && editMatReqData.itemTitle)) && (
                      <input 
                        className="input-field" 
                        value={editMatReqData.itemTitle}
                        onChange={e => setEditMatReqData({ ...editMatReqData, itemTitle: e.target.value })}
                        style={{ marginTop: '0.35rem', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                      />
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Quantity</label>
                    <input 
                      type="number"
                      min="1"
                      className="input-field" 
                      value={editMatReqData.quantity}
                      onChange={e => setEditMatReqData({ ...editMatReqData, quantity: e.target.value })}
                      style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Unit</label>
                    <input 
                      className="input-field" 
                      value={editMatReqData.unit}
                      onChange={e => setEditMatReqData({ ...editMatReqData, unit: e.target.value })}
                      style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Link to Service Meeting (Optional)</label>
                  <select 
                    className="select-field"
                    value={editMatReqData.meetingId}
                    onChange={e => setEditMatReqData({ ...editMatReqData, meetingId: e.target.value })}
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                  >
                    <option value="">Select Service Meeting (Optional)</option>
                    {meetings.map(m => (
                      <option key={m.id} value={m.id}>#{m.id.substring(0, 8)} - {m.clientName || m.client} ({m.title})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <button type="button" className="btn" onClick={() => setEditingMatReq(null)} style={{ background: '#64748b', color: '#ffffff', border: 'none', padding: '0.65rem 1.4rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff', border: 'none', padding: '0.65rem 1.6rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MATERIAL REQUEST */}
      {deletingMaterialReq && (
        <div className="modal-overlay" onClick={() => setDeletingMaterialReq(null)}>
          <div className="modal-content" style={{ maxWidth: '450px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#ef4444' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0, color: '#0f172a' }}>
                Confirm Material Request Deletion
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete material request <strong>{deletingMaterialReq.subject || deletingMaterialReq.itemTitle}</strong> (#{deletingMaterialReq.id.substring(0, 8)})?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingMaterialReq(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleDeleteMaterialRequest}>
                Delete Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Add New Product */}
      {showAddProdModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px', padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem', color: '#0f172a' }}>
              Add Product Line Item to Central Inventory
            </h3>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Product Name</label>
                <input 
                  className="input-field" 
                  required
                  value={newProd.name}
                  onChange={e => setNewProd({ ...newProd, name: e.target.value })}
                  placeholder="e.g. Cisco 48-Port Core Switch"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Category</label>
                  <select 
                    className="select-field"
                    value={newProd.category}
                    onChange={e => setNewProd({ ...newProd, category: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="Networking Equipment">Networking Equipment</option>
                    <option value="Security & Surveillance">Security & Surveillance</option>
                    <option value="Cables & Wiring">Cables & Wiring</option>
                    <option value="Power Systems">Power Systems</option>
                    <option value="Access Control">Access Control</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Brand / OEM</label>
                  <input 
                    className="input-field" 
                    required
                    value={newProd.brand}
                    onChange={e => setNewProd({ ...newProd, brand: e.target.value })}
                    placeholder="e.g. Hikvision / D-Link"
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Initial Qty</label>
                  <input 
                    type="number"
                    className="input-field" 
                    required
                    value={newProd.stockQuantity}
                    onChange={e => setNewProd({ ...newProd, stockQuantity: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Unit Price (₹)</label>
                  <input 
                    type="number"
                    className="input-field" 
                    required
                    value={newProd.unitPrice}
                    onChange={e => setNewProd({ ...newProd, unitPrice: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Min Alert Level</label>
                  <input 
                    type="number"
                    className="input-field" 
                    value={newProd.minStockAlert}
                    onChange={e => setNewProd({ ...newProd, minStockAlert: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddProdModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save to Inventory</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 1B: Edit Product */}
      {editingProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px', padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem', color: '#0f172a' }}>
              Edit Product ({editingProduct.code})
            </h3>
            <form onSubmit={handleEditProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Product Name</label>
                <input 
                  className="input-field" 
                  required
                  value={editProd.name}
                  onChange={e => setEditProd({ ...editProd, name: e.target.value })}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Category</label>
                  <select 
                    className="select-field"
                    value={editProd.category}
                    onChange={e => setEditProd({ ...editProd, category: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  >
                    <option value="Networking Equipment">Networking Equipment</option>
                    <option value="Security & Surveillance">Security & Surveillance</option>
                    <option value="Cables & Wiring">Cables & Wiring</option>
                    <option value="Power Systems">Power Systems</option>
                    <option value="Access Control">Access Control</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Brand / OEM</label>
                  <input 
                    className="input-field" 
                    required
                    value={editProd.brand}
                    onChange={e => setEditProd({ ...editProd, brand: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Stock Quantity</label>
                  <input 
                    type="number"
                    className="input-field" 
                    required
                    value={editProd.stockQuantity}
                    onChange={e => setEditProd({ ...editProd, stockQuantity: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Unit Price (₹)</label>
                  <input 
                    type="number"
                    className="input-field" 
                    required
                    value={editProd.unitPrice}
                    onChange={e => setEditProd({ ...editProd, unitPrice: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Min Alert Level</label>
                  <input 
                    type="number"
                    className="input-field" 
                    value={editProd.minStockAlert}
                    onChange={e => setEditProd({ ...editProd, minStockAlert: e.target.value })}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingProduct(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Inflow / Outflow Stock Transaction */}
      {showTxModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '0.35rem', color: '#0f172a' }}>
              Stock Movement: {selectedProduct.name}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
              Current Quantity On Hand: <strong>{selectedProduct.stockQuantity} {selectedProduct.unit}</strong>
            </p>

            <form onSubmit={handleStockTxSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Transaction Type</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="txtype"
                      value="INFLOW"
                      checked={stockTx.type === 'INFLOW'}
                      onChange={e => setStockTx({ ...stockTx, type: e.target.value })}
                    />
                    <span style={{ color: '#16a34a', fontWeight: 700 }}>Inflow (+) Received</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="txtype"
                      value="OUTFLOW"
                      checked={stockTx.type === 'OUTFLOW'}
                      onChange={e => setStockTx({ ...stockTx, type: e.target.value })}
                    />
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>Outflow (-) Dispatched</span>
                  </label>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Quantity</label>
                <input 
                  type="number"
                  className="input-field"
                  required
                  min="1"
                  value={stockTx.quantity}
                  onChange={e => setStockTx({ ...stockTx, quantity: e.target.value })}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>Reference PO / Invoice No</label>
                <input 
                  className="input-field"
                  required
                  value={stockTx.referenceNo}
                  onChange={e => setStockTx({ ...stockTx, referenceNo: e.target.value })}
                  placeholder="e.g. PO/2026/551 or Field Job Ref"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTxModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Process Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {deletingProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#ef4444' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0, color: '#0f172a' }}>
                Confirm Product Deletion
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete product <strong>{deletingProduct.name}</strong> ({deletingProduct.code})?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingProduct(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleDeleteProduct}>
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: QR / Barcode Scanner Simulator */}
      {showScanModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', maxWidth: '480px', padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '0.5rem', color: '#0f172a' }}>
              Real-time Barcode & QR Code Scanner
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>
              Simulates camera scanning of inventory tags for instant stock lookup and update.
            </p>

            <div style={{
              width: '100%',
              height: 200,
              background: '#0f172a',
              borderRadius: '12px',
              border: '2px dashed #f59e0b',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              marginBottom: '1.25rem'
            }}>
              <QrCode style={{ width: 56, height: 56, color: '#f59e0b' }} />
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                Align barcode within scanner frame...
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowScanModal(false)}>Close Camera</button>
              <button className="btn btn-primary" onClick={() => {
                alert('Scanned QR-VS-NET-001: Inventory Product Tag identified!');
                setShowScanModal(false);
              }}>
                Simulate Scan Tag
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
