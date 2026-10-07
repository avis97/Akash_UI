import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle,
  AlertTriangle,
  X,
  Layers,
  Tag,
  Box,
  Percent,
  Building,
  Briefcase
} from 'lucide-react';

export default function MasterSettings({ currentRole, onRefresh }) {
  const [activeTab, setActiveTab] = useState('categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // Master Data State
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    rate: 0,
    address: ''
  });

  const fetchAllMasterData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/master-data');
      const json = await res.json();
      if (json.success && json.data) {
        setCategories(json.data.categories || []);
        setBrands(json.data.brands || []);
        setUnits(json.data.units || []);
        setTaxes(json.data.taxes || []);
        setDepartments(json.data.departments || []);
        setBranches(json.data.branches || []);
      }
    } catch (err) {
      console.error('Error loading master settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllMasterData();
  }, [fetchAllMasterData]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', code: '', rate: 0, address: '' });
    setShowAddModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      code: item.code || '',
      rate: item.rate !== undefined ? item.rate : 0,
      address: item.address || ''
    });
    setShowAddModal(true);
  };

  const getEndpoint = (tab) => {
    switch (tab) {
      case 'categories': return '/api/categories';
      case 'brands': return '/api/brands';
      case 'units': return '/api/units';
      case 'taxes': return '/api/taxes';
      case 'departments': return '/api/departments';
      case 'branches': return '/api/branches';
      default: return '/api/categories';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Name field is required');
      return;
    }
    const endpoint = getEndpoint(activeTab);
    const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setEditingItem(null);
        setFormData({ name: '', code: '', rate: 0, address: '' });
        fetchAllMasterData();
        if (onRefresh) onRefresh();
      } else {
        alert(json.message || 'Error saving item');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save master record');
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    const endpoint = getEndpoint(activeTab);
    try {
      const res = await fetch(`${endpoint}/${deletingItem.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDeletingItem(null);
        fetchAllMasterData();
        if (onRefresh) onRefresh();
      } else {
        alert(json.message || 'Error deleting item');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete master record');
    }
  };

  // Tab configurations
  const tabs = [
    { id: 'categories', label: 'Categories', icon: Layers, count: categories.length, color: '#3b82f6' },
    { id: 'brands', label: 'Brands', icon: Tag, count: brands.length, color: '#10b981' },
    { id: 'units', label: 'Units', icon: Box, count: units.length, color: '#8b5cf6' },
    { id: 'taxes', label: 'Tax Rates', icon: Percent, count: taxes.length, color: '#f59e0b' },
    { id: 'departments', label: 'Departments', icon: Briefcase, count: departments.length, color: '#ec4899' },
    { id: 'branches', label: 'Branches', icon: Building, count: branches.length, color: '#06b6d4' }
  ];

  const getActiveList = () => {
    let list = [];
    switch (activeTab) {
      case 'categories': list = categories; break;
      case 'brands': list = brands; break;
      case 'units': list = units; break;
      case 'taxes': list = taxes; break;
      case 'departments': list = departments; break;
      case 'branches': list = branches; break;
      default: list = categories;
    }
    if (!searchTerm) return list;
    return list.filter(item =>
      (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.address && item.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const activeTabMeta = tabs.find(t => t.id === activeTab) || tabs[0];
  const items = getActiveList();

  return (
    <div className="page-container" style={{ padding: '1.5rem' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Settings size={28} style={{ color: 'var(--brand-primary)' }} /> System Master Settings
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#64748b' }}>
            Manage dynamic dropdown lists for Products, Inventory, Service Meetings, and Employees.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.25)' }}
        >
          <Plus size={18} /> Add New {activeTabMeta.label.slice(0, -1)}
        </button>
      </div>

      {/* MASTER SETTINGS TABS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
        {tabs.map(t => {
          const IconComp = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setSearchTerm(''); }}
              style={{
                background: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.65)',
                border: isActive ? `2px solid ${t.color}` : '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1rem 0.85rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 14px rgba(0, 0, 0, 0.08)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: '8px', background: `${t.color}15`, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconComp size={18} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: `${t.color}20`, color: t.color }}>
                  {t.count}
                </span>
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isActive ? '#1e293b' : '#475569' }}>
                {t.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* SEARCH AND MAIN TABLE CONTAINER */}
      <div className="card" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        
        {/* Table Control Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder={`Search ${activeTabMeta.label}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '2.25rem', fontSize: '0.88rem', borderRadius: '8px' }}
            />
          </div>

          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Showing <strong>{items.length}</strong> master records
          </div>
        </div>

        {/* DATA TABLE */}
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>#</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>{activeTabMeta.label.slice(0, -1)} Name</th>
                {activeTab === 'categories' && <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Code</th>}
                {activeTab === 'taxes' && <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Tax Rate (%)</th>}
                {activeTab === 'branches' && <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Code</th>}
                {activeTab === 'branches' && <th style={{ padding: '0.85rem 1rem', textAlign: 'left' }}>Address / Location</th>}
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#94a3b8' }}>
                    No {activeTabMeta.label.toLowerCase()} found. Click <strong>+ Add New {activeTabMeta.label.slice(0, -1)}</strong> to create one.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#1e293b' }}>
                      {item.name}
                    </td>

                    {activeTab === 'categories' && (
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#64748b' }}>
                        {item.code ? <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{item.code}</span> : '—'}
                      </td>
                    )}

                    {activeTab === 'taxes' && (
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#22c55e' }}>
                        {item.rate}%
                      </td>
                    )}

                    {activeTab === 'branches' && (
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#64748b' }}>
                        {item.code ? <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>{item.code}</span> : '—'}
                      </td>
                    )}

                    {activeTab === 'branches' && (
                      <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#64748b' }}>
                        {item.address || 'N/A'}
                      </td>
                    )}

                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', padding: '6px 10px', color: '#3b82f6', cursor: 'pointer' }}
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingItem(item)}
                          style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '6px 10px', color: '#ef4444', cursor: 'pointer' }}
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL: ADD / EDIT MASTER ITEM                                         */}
      {/* ===================================================================== */}
      {showAddModal && (
        <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>
                {editingItem ? `Edit ${activeTabMeta.label.slice(0, -1)}` : `Add New ${activeTabMeta.label.slice(0, -1)}`}
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', marginTop: '1.25rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  {activeTabMeta.label.slice(0, -1)} Name<span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder={`Enter ${activeTabMeta.label.slice(0, -1)} Name`}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              {(activeTab === 'categories' || activeTab === 'branches') && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Code / Abbreviation (Optional)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. CAT-01 or BR-KOL"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              )}

              {activeTab === 'taxes' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Tax Rate (%)<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="100"
                    className="form-control"
                    required
                    placeholder="e.g. 18"
                    value={formData.rate}
                    onChange={e => setFormData({ ...formData, rate: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              )}

              {activeTab === 'branches' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Branch Address / Location
                  </label>
                  <textarea
                    rows={2}
                    className="form-control"
                    placeholder="Enter full address"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem', fontWeight: 600 }}>
                  {editingItem ? 'Save Changes' : 'Create Record'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: DELETE CONFIRMATION                                            */}
      {/* ===================================================================== */}
      {deletingItem && (
        <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#ef4444' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>Confirm Deletion</h3>
            </div>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete <strong>"{deletingItem.name}"</strong> from master {activeTabMeta.label.toLowerCase()}?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingItem(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleDelete} style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
