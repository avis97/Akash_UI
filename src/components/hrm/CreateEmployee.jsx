import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Upload, Check, X, AlertCircle } from 'lucide-react';
import { API_URL } from '../../config/api';

export default function CreateEmployee({ onCancel, onSuccess, currentRole = 'SUPERADMIN' }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Default dynamic lists for Branch, Department, Designation
  const [branches, setBranches] = useState(['Main Branch', 'Corporate HQ', 'North Regional Office', 'South Regional Office']);
  const [departments, setDepartments] = useState(['Financial', 'HR', 'Engineering', 'Operations', 'Sales & Marketing', 'Customer Service']);
  const [designations, setDesignations] = useState(['Software Engineer', 'Senior Developer', 'Project Manager', 'Service Personnel', 'Accountant', 'HR Executive']);

  // Modals for adding custom options
  const [modalType, setModalType] = useState(null); // 'branch' | 'department' | 'designation'
  const [newItemText, setNewItemText] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    role: 'EMPLOYEE', // 'EMPLOYEE' | 'CLIENT'
    name: '',
    phone: '',
    dob: '',
    gender: 'Male',
    email: '',
    password: '',
    address: '',
    employeeId: '#EMP00058',
    branch: '',
    department: '',
    designation: '',
    dateOfJoining: '',
    companyName: '',
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    bankIdentifierCode: '',
    branchLocation: ''
  });

  // Document file objects / preview names
  const [documents, setDocuments] = useState({
    hsCertificate: null,
    panCard: null,
    aadhaarCard: null,
    passport: null,
    graduation: null,
    experienceLetter: null,
    addressProof: null
  });

  // Fetch next employee ID from backend on mount
  useEffect(() => {
    const fetchNextId = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_URL('/api/employees/next-id'), {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            'X-User-Role': currentRole
          }
        });
        const data = await res.json();
        if (data.employeeId) {
          setFormData(prev => ({ ...prev, employeeId: data.employeeId }));
        }
      } catch (err) {
        console.warn('Fallback next ID:', err);
      }
    };
    fetchNextId();
  }, [currentRole]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Convert file to Base64 data URL for storage
    const reader = new FileReader();
    reader.onload = () => {
      setDocuments(prev => ({
        ...prev,
        [fieldName]: {
          name: file.name,
          dataUrl: reader.result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDocument = (fieldName) => {
    setDocuments(prev => ({ ...prev, [fieldName]: null }));
  };

  const handleAddCustomOption = () => {
    if (!newItemText.trim()) return;
    const val = newItemText.trim();
    if (modalType === 'branch') {
      if (!branches.includes(val)) setBranches([...branches, val]);
      setFormData(prev => ({ ...prev, branch: val }));
    } else if (modalType === 'department') {
      if (!departments.includes(val)) setDepartments([...departments, val]);
      setFormData(prev => ({ ...prev, department: val }));
    } else if (modalType === 'designation') {
      if (!designations.includes(val)) setDesignations([...designations, val]);
      setFormData(prev => ({ ...prev, designation: val }));
    }
    setNewItemText('');
    setModalType(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const isClient = formData.role === 'CLIENT';

    if (!formData.name || !formData.phone || !formData.email || !formData.password) {
      setError('Please fill in all mandatory Personal / Contact Detail fields.');
      return;
    }
    if (!isClient && (!formData.branch || !formData.department || !formData.designation || !formData.dateOfJoining)) {
      setError('Please complete all mandatory Company Detail selections for employee.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const payload = isClient ? {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        address: formData.address || formData.companyName,
        designation: 'Client Representative',
        role: 'CLIENT'
      } : {
        name: formData.name,
        phone: formData.phone,
        dob: formData.dob,
        gender: formData.gender,
        email: formData.email,
        password: formData.password,
        address: formData.address,
        employeeId: formData.employeeId,
        branch: formData.branch,
        department: formData.department,
        designation: formData.designation,
        dateOfJoining: formData.dateOfJoining,
        role: 'EMPLOYEE',
        hsCertificate: documents.hsCertificate?.dataUrl || null,
        panCard: documents.panCard?.dataUrl || null,
        aadhaarCard: documents.aadhaarCard?.dataUrl || null,
        passport: documents.passport?.dataUrl || null,
        graduation: documents.graduation?.dataUrl || null,
        experienceLetter: documents.experienceLetter?.dataUrl || null,
        addressProof: documents.addressProof?.dataUrl || null,
        accountHolderName: formData.accountHolderName,
        accountNumber: formData.accountNumber,
        bankName: formData.bankName,
        bankIdentifierCode: formData.bankIdentifierCode,
        branchLocation: formData.branchLocation
      };

      const endpoint = isClient ? API_URL('/api/users') : API_URL('/api/employees');

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': currentRole,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Failed to create ${isClient ? 'client' : 'employee'}`);
      }

      setSuccessMsg(`${isClient ? 'Client' : 'Employee'} account ${data.data.name} created successfully!`);
      setTimeout(() => {
        if (onSuccess) onSuccess(data.data);
      }, 1200);

    } catch (err) {
      setError(err.message || 'Error creating account');
    } finally {
      setLoading(false);
    }
  };

  const documentList = [
    { key: 'hsCertificate', label: 'HS Certificate' },
    { key: 'panCard', label: 'PAN Card' },
    { key: 'aadhaarCard', label: 'Aadhaar Card' },
    { key: 'passport', label: 'Passport' },
    { key: 'graduation', label: 'Graduation' },
    { key: 'experienceLetter', label: 'Experience Letter' },
    { key: 'addressProof', label: 'Address Proof' }
  ];

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', minHeight: '100vh', color: '#1e293b' }}>
      {/* Header & Breadcrumb */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.25rem 0', fontWeight: 600, fontSize: '1.4rem', color: '#0f172a' }}>Create Employee</h2>
        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
          <span style={{ color: '#22c55e', cursor: 'pointer' }} onClick={onCancel}>Home</span> &gt;{' '}
          <span style={{ color: '#22c55e', cursor: 'pointer' }} onClick={onCancel}>Employee</span> &gt;{' '}
          <span style={{ color: '#64748b' }}>Create Employee</span>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.85rem 1rem', borderRadius: '6px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '0.85rem 1rem', borderRadius: '6px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Role Selector Bar */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>Select System Account Type:</span>
            <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Choose whether you are registering an Internal Employee or an External Client</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '6px' }}>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, role: 'EMPLOYEE' }))}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: formData.role === 'EMPLOYEE' ? '#22c55e' : 'transparent',
                color: formData.role === 'EMPLOYEE' ? '#ffffff' : '#64748b',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              💼 Employee Account
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, role: 'CLIENT' }))}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: formData.role === 'CLIENT' ? '#2563eb' : 'transparent',
                color: formData.role === 'CLIENT' ? '#ffffff' : '#64748b',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              🤝 Client Account
            </button>
          </div>
        </div>

        {/* Row 1: Personal Detail & Company Detail */}
        <div style={{ display: 'grid', gridTemplateColumns: formData.role === 'CLIENT' ? '1fr' : 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          
          {/* Personal Detail Card */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: '4px', height: '18px', backgroundColor: formData.role === 'CLIENT' ? '#2563eb' : '#22c55e', borderRadius: '2px', marginRight: '0.5rem' }}></div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#1e293b' }}>
                {formData.role === 'CLIENT' ? 'Client Contact Details' : 'Personal Detail'}
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.4rem' }}>
                  {formData.role === 'CLIENT' ? 'Client Contact Name' : 'Name'}<span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={formData.role === 'CLIENT' ? "e.g. Arnab Talukdar" : "Enter employee name"}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.4rem' }}>
                  Phone<span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none' }}
                  required
                />
                <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', marginTop: '0.2rem' }}>
                  Include country code (ex. +91)
                </span>
              </div>
            </div>

            {formData.role === 'EMPLOYEE' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.4rem' }}>
                    Date of Birth<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: formData.dob ? '#1e293b' : '#94a3b8', outline: 'none' }}
                    required={formData.role === 'EMPLOYEE'}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.4rem' }}>
                    Gender<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', height: '38px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', cursor: 'pointer', color: '#334155' }}>
                      <input
                        type="radio"
                        name="gender"
                        value="Male"
                        checked={formData.gender === 'Male'}
                        onChange={handleChange}
                        style={{ accentColor: '#22c55e', width: '16px', height: '16px' }}
                      />
                      Male
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', cursor: 'pointer', color: '#334155' }}>
                      <input
                        type="radio"
                        name="gender"
                        value="Female"
                        checked={formData.gender === 'Female'}
                        onChange={handleChange}
                        style={{ accentColor: '#22c55e', width: '16px', height: '16px' }}
                      />
                      Female
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.4rem' }}>
                  Email Address<span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="client@company.com"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.4rem' }}>
                  Account Password<span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••"
                    style={{ width: '100%', padding: '0.55rem 2.25rem 0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.4rem' }}>
                {formData.role === 'CLIENT' ? 'Client Organization / Billing Address' : 'Address'}<span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                name="address"
                rows="3"
                value={formData.address}
                onChange={handleChange}
                placeholder={formData.role === 'CLIENT' ? "Enter client company name & registered office address" : "Enter employee address"}
                style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none', resize: 'vertical' }}
                required
              />
            </div>
          </div>

          {/* Company Detail Card - ONLY for EMPLOYEE role */}
          {formData.role === 'EMPLOYEE' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: '4px', height: '18px', backgroundColor: '#22c55e', borderRadius: '2px', marginRight: '0.5rem' }}></div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#1e293b' }}>Company Detail</h3>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.4rem' }}>
                  Employee ID
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 600, fontSize: '0.875rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.4rem' }}>
                    Select Branch<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff', outline: 'none' }}
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b, idx) => <option key={idx} value={b}>{b}</option>)}
                  </select>
                  <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Create branch here.{' '}
                    <span
                      onClick={() => setModalType('branch')}
                      style={{ color: '#22c55e', fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}
                    >
                      Create branch
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.4rem' }}>
                    Select Department<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff', outline: 'none' }}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((d, idx) => <option key={idx} value={d}>{d}</option>)}
                  </select>
                  <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Create department here.{' '}
                    <span
                      onClick={() => setModalType('department')}
                      style={{ color: '#22c55e', fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}
                    >
                      Create department
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.4rem' }}>
                    Select Designation<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', backgroundColor: '#fff', outline: 'none' }}
                    required
                  >
                    <option value="">Select Designation</option>
                    {designations.map((d, idx) => <option key={idx} value={d}>{d}</option>)}
                  </select>
                  <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Create designation here.{' '}
                    <span
                      onClick={() => setModalType('designation')}
                      style={{ color: '#22c55e', fontWeight: 500, cursor: 'pointer', textDecoration: 'none' }}
                    >
                      Create designation
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.4rem' }}>
                    Company Date Of Joining<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfJoining"
                    value={formData.dateOfJoining}
                    onChange={handleChange}
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', color: formData.dateOfJoining ? '#1e293b' : '#94a3b8', outline: 'none' }}
                    required
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Document & Bank Account Detail - ONLY for EMPLOYEE role */}
        {formData.role === 'EMPLOYEE' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* Document Card */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: '4px', height: '18px', backgroundColor: '#22c55e', borderRadius: '2px', marginRight: '0.5rem' }}></div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#1e293b' }}>Document</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {documentList.map((doc) => {
                  const uploaded = documents[doc.key];
                  return (
                    <div key={doc.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px dashed #f1f5f9', paddingBottom: '0.65rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>{doc.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {uploaded ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.3rem 0.6rem', borderRadius: '5px', fontSize: '0.775rem', color: '#166534' }}>
                            <Check size={14} color="#22c55e" />
                            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploaded.name}</span>
                            <X size={14} style={{ cursor: 'pointer', marginLeft: '0.2rem' }} onClick={() => handleRemoveDocument(doc.key)} />
                          </div>
                        ) : (
                          <label style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            backgroundColor: '#22c55e',
                            color: '#ffffff',
                            padding: '0.4rem 0.85rem',
                            borderRadius: '5px',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            transition: 'background-color 0.2s'
                          }}>
                            <Upload size={14} />
                            <span>Choose file here</span>
                            <input
                              type="file"
                              onChange={(e) => handleFileUpload(e, doc.key)}
                              style={{ display: 'none' }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bank Account Detail Card */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: '4px', height: '18px', backgroundColor: '#22c55e', borderRadius: '2px', marginRight: '0.5rem' }}></div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#1e293b' }}>Bank Account Detail</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.4rem' }}>
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleChange}
                    placeholder="Enter account holder name"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.4rem' }}>
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder="Enter account number"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.4rem' }}>
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="Enter bank name"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.4rem' }}>
                    Bank Identifier Code
                  </label>
                  <input
                    type="text"
                    name="bankIdentifierCode"
                    value={formData.bankIdentifierCode}
                    onChange={handleChange}
                    placeholder="Enter bank identifier code"
                    style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#334155', marginBottom: '0.4rem' }}>
                  Branch Location
                </label>
                <input
                  type="text"
                  name="branchLocation"
                  value={formData.branchLocation}
                  onChange={handleChange}
                  placeholder="Enter branch location"
                  style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.875rem', outline: 'none' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '0.55rem 1.4rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#64748b',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.55rem 1.4rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: formData.role === 'CLIENT' ? '#2563eb' : '#22c55e',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            {loading ? 'Creating...' : formData.role === 'CLIENT' ? 'Create Client Account' : 'Create Employee Account'}
          </button>
        </div>
      </form>

      {/* Dynamic Add Custom Option Modal */}
      {modalType && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', textTransform: 'capitalize' }}>Add New {modalType}</h4>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setModalType(null)} />
            </div>
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder={`Enter ${modalType} name`}
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', marginBottom: '1.25rem', outline: 'none' }}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setModalType(null)}
                style={{ padding: '0.45rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomOption}
                style={{ padding: '0.45rem 1rem', borderRadius: '6px', border: 'none', backgroundColor: '#22c55e', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
