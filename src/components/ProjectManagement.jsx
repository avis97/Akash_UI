import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from './common/PageHeader';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  Building, 
  Clock, 
  DollarSign, 
  Tag, 
  Edit, 
  Trash2, 
  X, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { API_URL } from '../config/api';

const ProjectManagement = ({ data = {}, currentRole = 'SUPERADMIN', currentUser, onRefresh = () => {} }) => {
  const [projects, setProjects] = useState(data.projects || []);
  const [users, setUsers] = useState(data.users || []);

  const handleDownloadImage = (imageSrc, fileName) => {
    if (!imageSrc) return;
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `${(fileName || 'project').toLowerCase().replace(/\s+/g, '_')}_image.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);

  // Form State - Matches Screenshot Layout
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    image: '',
    customerId: '',
    customerName: '',
    employeeId: '',
    employeeName: '',
    budget: '',
    estimatedHours: '',
    description: '',
    tag: '',
    status: 'In Progress'
  });

  const fetchProjects = useCallback(async () => {
    try {
      const [projRes, usrRes] = await Promise.allSettled([
        fetch(API_URL('/api/projects')).then(r => r.json()),
        fetch(API_URL('/api/users')).then(r => r.json())
      ]);

      if (projRes.status === 'fulfilled' && projRes.value?.success) {
        setProjects(projRes.value.data);
      }
      if (usrRes.status === 'fulfilled' && usrRes.value?.success) {
        setUsers(usrRes.value.data);
      }
    } catch (err) {
      console.error('Error fetching projects data:', err);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Sync prop updates if parent passes new data
  useEffect(() => {
    if (data.projects && data.projects.length > 0) setProjects(data.projects);
    if (data.users && data.users.length > 0) setUsers(data.users);
  }, [data.projects, data.users]);

  // Derived Client and Employee users
  const customers = users.filter(u => u.role === 'CLIENT' || u.role === 'USER');
  const availableCustomers = customers.length > 0 ? customers : users;
  const employees = users.filter(u => u.role !== 'CLIENT');
  const availableEmployees = employees.length > 0 ? employees : users;

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      image: '',
      customerId: '',
      customerName: '',
      employeeId: '',
      employeeName: '',
      budget: '',
      estimatedHours: '',
      description: '',
      tag: '',
      status: 'In Progress'
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (proj) => {
    setEditingProject(proj);
    setFormData({
      name: proj.name || '',
      startDate: proj.startDate ? new Date(proj.startDate).toISOString().split('T')[0] : '',
      endDate: proj.endDate ? new Date(proj.endDate).toISOString().split('T')[0] : '',
      image: proj.image || '',
      customerId: proj.customerId || '',
      customerName: proj.customerName || '',
      employeeId: proj.employeeId || '',
      employeeName: proj.employeeName || '',
      budget: proj.budget !== null && proj.budget !== undefined ? proj.budget : '',
      estimatedHours: proj.estimatedHours !== null && proj.estimatedHours !== undefined ? proj.estimatedHours : '',
      description: proj.description || '',
      tag: proj.tag || '',
      status: proj.status || 'In Progress'
    });
    setShowModal(true);
  };

  const compressImage = (file, maxWidth = 800, quality = 0.85) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxWidth) {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedDataUrl = await compressImage(file, 800, 0.85);
        if (compressedDataUrl) {
          setFormData(prev => ({ ...prev, image: compressedDataUrl }));
        }
      } catch (err) {
        console.error('Image compression error:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingProject 
        ? API_URL(`/api/projects/${editingProject.id}`)
        : API_URL('/api/projects');
      const method = editingProject ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        budget: formData.budget !== '' ? parseFloat(formData.budget) : null,
        estimatedHours: formData.estimatedHours !== '' ? parseFloat(formData.estimatedHours) : null
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        fetchProjects();
        if (onRefresh) onRefresh();
      } else {
        alert(json.message || 'Failed to save project');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting project form');
    }
  };

  const handleDelete = async () => {
    if (!deletingProject) return;
    try {
      const res = await fetch(API_URL(`/api/projects/${deletingProject.id}`), { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDeletingProject(null);
        fetchProjects();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isClient = currentRole === 'CLIENT' || currentUser?.role === 'CLIENT';
  const isEmployee = currentRole === 'EMPLOYEE' || currentRole === 'SERVICE_PERSONNEL' || currentRole === 'FACILITY_MANAGER' || currentUser?.role === 'EMPLOYEE';

  const userFilteredProjects = projects.filter(p => {
    if (isClient) {
      const clientName = currentUser?.name?.toLowerCase().trim();
      const clientId = currentUser?.id;
      const clientEmail = currentUser?.email?.toLowerCase().trim();

      const matchesId = clientId && p.customerId === clientId;
      const matchesName = clientName && p.customerName?.toLowerCase().trim() === clientName;
      const matchesEmail = clientEmail && p.customerEmail?.toLowerCase().trim() === clientEmail;

      return Boolean(matchesId || matchesName || matchesEmail);
    }

    if (isEmployee) {
      const empName = currentUser?.name?.toLowerCase().trim();
      const empId = currentUser?.id;

      const matchesId = empId && p.employeeId === empId;
      const matchesName = empName && p.employeeName?.toLowerCase().trim() === empName;

      return Boolean(matchesId || matchesName);
    }

    return true; // Superadmin and Master Admin see all projects
  });

  const filteredProjects = userFilteredProjects.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.tag || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (p.status || '').toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    const st = (status || '').toLowerCase();
    if (st === 'completed') return 'badge-approved';
    if (st === 'in progress') return 'badge-pending';
    if (st === 'on hold' || st === 'cancelled') return 'badge-scheduled';
    return 'badge-scheduled';
  };

  return (
    <div className="page-container">
      <PageHeader 
        title="Project Management" 
        subtitle="Manage company projects, assign personnel, track budgets and deliverables" 
        breadcrumbs={['Dashboard', 'Projects']}
      />

      {/* Action Header & Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              className="input-field" 
              style={{ paddingLeft: '2.2rem', padding: '0.35rem 0.65rem 0.35rem 2.2rem', fontSize: '0.82rem' }}
              placeholder="Search projects, tags, employees..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="select-field" 
            style={{ width: '160px', padding: '0.35rem 0.65rem', fontSize: '0.82rem' }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={handleOpenCreateModal}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
        >
          <Plus size={16} /> Create New Project
        </button>
      </div>

      {/* Projects Grid Cards View */}
      {filteredProjects.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <FolderKanban size={44} style={{ margin: '0 auto 0.75rem auto', color: '#22c55e', opacity: 0.8 }} />
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Projects Found</h4>
          <p style={{ fontSize: '0.88rem', margin: 0 }}>
            No projects matched your search criteria. Click "+ Create New Project" to add a new project.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
          {filteredProjects.map(proj => (
            <div 
              key={proj.id} 
              className="glass-card" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                background: '#ffffff',
                padding: '0.85rem 0.95rem',
                gap: '0.65rem'
              }}
            >
              <div>
                {/* Top Header Bar: Tag/ID & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  {proj.tag ? (
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '0.15rem 0.45rem', borderRadius: '5px', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Tag size={10} /> {proj.tag}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, fontFamily: 'monospace' }}>
                      #{proj.id.length > 8 ? proj.id.substring(0, 7) + '...' : proj.id}
                    </span>
                  )}

                  <span className={`badge ${getStatusBadgeClass(proj.status)}`} style={{ textTransform: 'capitalize', fontWeight: 700, fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                    {proj.status || 'In Progress'}
                  </span>
                </div>

                {/* Project Name */}
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem', lineHeight: 1.3 }}>
                  {proj.name}
                </h3>

                {/* Customer & Assigned Employee */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.78rem', marginBottom: '0.5rem' }}>
                  {proj.customerName && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0284c7', fontWeight: 600 }}>
                      <Building size={13} style={{ flexShrink: 0 }} />
                      <span>Customer: <strong style={{ color: '#0369a1' }}>{proj.customerName}</strong></span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#059669', fontWeight: 600 }}>
                    <User size={13} style={{ flexShrink: 0 }} />
                    <span>Employee: <strong style={{ color: '#047857' }}>{proj.employeeName || proj.employee?.name || 'Unassigned'}</strong></span>
                  </div>
                </div>

                {/* Description */}
                {proj.description && (
                  <p style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '0.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: '0 0 0.5rem 0' }}>
                    {proj.description}
                  </p>
                )}

                {/* Budget & Dates info box */}
                <div style={{ background: '#f8fafc', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', fontSize: '0.74rem' }}>
                  {proj.budget !== null && proj.budget !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#047857', fontWeight: 700 }}>
                      <DollarSign size={12} />
                      <span>Budget: ₹{Number(proj.budget).toLocaleString()}</span>
                    </div>
                  )}
                  {proj.estimatedHours !== null && proj.estimatedHours !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#d97706', fontWeight: 700 }}>
                      <Clock size={12} />
                      <span>Est: {proj.estimatedHours} hrs</span>
                    </div>
                  )}
                  {proj.startDate && (
                    <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#475569' }}>
                      <Calendar size={12} />
                      <span>Duration: {new Date(proj.startDate).toLocaleDateString()} {proj.endDate ? `➔ ${new Date(proj.endDate).toLocaleDateString()}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons with Download Option */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.55rem', display: 'flex', justifyContent: 'flex-end', gap: '0.35rem', flexWrap: 'wrap' }}>
                {proj.image && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
                    onClick={() => handleDownloadImage(proj.image, proj.name)}
                    title="Download Attached Image"
                  >
                    <Download size={13} /> Download Image
                  </button>
                )}
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  onClick={() => handleOpenEditModal(proj)}
                >
                  <Edit size={13} /> Edit
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', background: '#fef2f2', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  onClick={() => setDeletingProject(proj)}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT PROJECT MODAL - EXACT REPLICA OF REFERENCE SCREENSHOT */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </h3>
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Project Name* */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Project Name<span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  className="input-field" 
                  required
                  placeholder="Enter Project Name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Start Date & End Date Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Start Date
                  </label>
                  <input 
                    type="date"
                    className="input-field" 
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    End Date
                  </label>
                  <input 
                    type="date"
                    className="input-field" 
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Project Image */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Project Image
                </label>
                <div style={{ border: '1px solid #cbd5e1', padding: '0.5rem 0.75rem', borderRadius: '6px', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    id="proj-image-file"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                  <label 
                    htmlFor="proj-image-file"
                    className="btn btn-secondary"
                    style={{ cursor: 'pointer', margin: 0, padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: '#f1f5f9', borderColor: '#cbd5e1' }}
                  >
                    Choose File
                  </label>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formData.image ? 'Image File Selected' : 'No file chosen'}
                  </span>
                  {formData.image && (
                    <img src={formData.image} alt="Preview" style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover' }} />
                  )}
                </div>
              </div>

              {/* Customer & Employee* Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '2px' }}>
                    Customer
                  </label>
                  <select 
                    className="select-field"
                    value={formData.customerId}
                    onChange={e => {
                      const selectedId = e.target.value;
                      const cust = availableCustomers.find(c => c.id === selectedId);
                      setFormData(prev => ({
                        ...prev,
                        customerId: selectedId,
                        customerName: cust ? cust.name : prev.customerName
                      }));
                    }}
                  >
                    <option value="">Select Customer</option>
                    {availableCustomers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    Create customer here. <span style={{ color: '#22c55e', cursor: 'pointer', fontWeight: 600 }}>Create customer</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '2px' }}>
                    Employee<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select 
                    className="select-field"
                    required
                    value={formData.employeeId}
                    onChange={e => {
                      const selectedId = e.target.value;
                      const emp = availableEmployees.find(u => u.id === selectedId);
                      setFormData(prev => ({
                        ...prev,
                        employeeId: selectedId,
                        employeeName: emp ? emp.name : prev.employeeName
                      }));
                    }}
                  >
                    <option value="">Select User</option>
                    {availableEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.role ? emp.role.replace(/_/g, ' ') : 'Employee'})</option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                    Create user here. <span style={{ color: '#22c55e', cursor: 'pointer', fontWeight: 600 }}>Create user</span>
                  </div>
                </div>
              </div>

              {/* Budget & Estimated Hours Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Budget
                  </label>
                  <input 
                    type="number"
                    className="input-field" 
                    placeholder="Enter Project Budget"
                    value={formData.budget}
                    onChange={e => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Estimated Hours
                  </label>
                  <input 
                    type="number"
                    className="input-field" 
                    placeholder="Enter Project Estimated Hours"
                    value={formData.estimatedHours}
                    onChange={e => setFormData({ ...formData, estimatedHours: e.target.value })}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea 
                  className="input-field" 
                  rows={3}
                  placeholder="Enter Description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Tag */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Tag
                </label>
                <input 
                  className="input-field" 
                  placeholder="Enter Project Tag"
                  value={formData.tag}
                  onChange={e => setFormData({ ...formData, tag: e.target.value })}
                />
              </div>

              {/* Status */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  Status
                </label>
                <select 
                  className="select-field"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                  style={{ background: '#64748b', color: '#ffffff', borderColor: '#64748b' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ backgroundColor: '#22c55e', borderColor: '#16a34a', fontWeight: 700 }}
                >
                  {editingProject ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingProject && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#ef4444' }}>
              <AlertCircle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', margin: 0 }}>Confirm Project Deletion</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Are you sure you want to delete project <strong>{deletingProject.name}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingProject(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ backgroundColor: '#ef4444', borderColor: '#ef4444' }} onClick={handleDelete}>
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
