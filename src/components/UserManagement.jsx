import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  ShieldCheck,
  Lock,
  Plus,
  KeyRound,
  Activity,
  Edit2,
  Trash2,
  AlertTriangle,
  Upload,
  X,
  Send,
  Copy,
  Check,
  Mail,
  MessageSquare,
  Eye,
  EyeOff,
  FileText,
  Briefcase,
  Building,
  CreditCard,
  Download
} from 'lucide-react';

export default function UserManagement({ data = {}, currentRole = 'SUPERADMIN', onRefresh, initialTab = 'users' }) {
  const isSuperAdmin = currentRole === 'SUPERADMIN';

  const [activeTab, setActiveTab] = useState(initialTab || 'users'); // 'users' | 'employees' | 'clients' | 'activity-logs'
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [registerMode, setRegisterMode] = useState('full'); // 'quick' | 'full'
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [users, setUsers] = useState(data.users || []);
  const [activityLogs, setActivityLogs] = useState(data.activityLogs || []);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'X-User-Role': currentRole,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }, [currentRole]);

  const fetchUserData = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const headers = getAuthHeaders();
      const [usrRes, logRes] = await Promise.allSettled([
        fetch('/api/users', { headers }).then(r => r.json()),
        fetch('/api/activity-logs', { headers }).then(r => r.json())
      ]);

      if (usrRes.status === 'fulfilled' && usrRes.value?.success) {
        setUsers(usrRes.value.data);
      }
      if (logRes.status === 'fulfilled' && logRes.value?.success) {
        setActivityLogs(logRes.value.data);
      }
    } catch (err) {
      console.error('Error fetching user management data:', err);
    }
  }, [isSuperAdmin, getAuthHeaders]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const [shareCredentials, setShareCredentials] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateRandomPassword = () => {
    return `Akash@${Math.floor(1000 + Math.random() * 9000)}`;
  };

  // Branch, Department, Designation defaults
  const [branches] = useState(['Main Branch', 'Corporate HQ', 'North Regional Office', 'South Regional Office']);
  const [departments] = useState(['Financial', 'HR', 'Engineering', 'Operations', 'Sales & Marketing', 'Customer Service']);
  const [designations] = useState(['Software Engineer', 'Senior Developer', 'Project Manager', 'Service Personnel', 'Accountant', 'HR Executive']);

  // New User / Employee form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    designation: 'Staff Member',
    role: 'EMPLOYEE',
    employeeId: '',
    dob: '',
    gender: 'Male',
    address: '',
    branch: 'Main Branch',
    department: 'General',
    dateOfJoining: new Date().toISOString().split('T')[0],
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    bankIdentifierCode: '',
    branchLocation: ''
  });

  // Edit User form state
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    designation: '',
    role: 'EMPLOYEE',
    employeeId: '',
    dob: '',
    gender: 'Male',
    address: '',
    branch: 'Main Branch',
    department: 'General',
    dateOfJoining: '',
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    bankIdentifierCode: '',
    branchLocation: '',
    avatarUrl: ''
  });

  // Document uploads state for Register & Edit
  const [documents, setDocuments] = useState({
    hsCertificate: null,
    panCard: null,
    aadhaarCard: null,
    passport: null,
    graduation: null,
    experienceLetter: null,
    addressProof: null
  });

  const [editDocuments, setEditDocuments] = useState({
    hsCertificate: null,
    panCard: null,
    aadhaarCard: null,
    passport: null,
    graduation: null,
    experienceLetter: null,
    addressProof: null
  });

  const documentFields = [
    { key: 'hsCertificate', label: 'HS Certificate' },
    { key: 'panCard', label: 'PAN Card' },
    { key: 'aadhaarCard', label: 'Aadhaar Card' },
    { key: 'passport', label: 'Passport' },
    { key: 'graduation', label: 'Graduation' },
    { key: 'experienceLetter', label: 'Experience Letter' },
    { key: 'addressProof', label: 'Address Proof' }
  ];

  const getDocFieldsForRole = (role) => {
    if (role === 'CLIENT') {
      return documentFields.filter(d => ['panCard', 'aadhaarCard', 'addressProof'].includes(d.key));
    }
    return documentFields;
  };

  // Fetch next employee ID on add modal open
  useEffect(() => {
    if (showAddUserModal) {
      fetch('/api/employees/next-id', { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => {
          if (data.employeeId) {
            setNewUser(prev => ({ ...prev, employeeId: data.employeeId }));
          }
        })
        .catch(err => console.warn('Next ID fetch failed:', err));
    }
  }, [showAddUserModal, getAuthHeaders]);

  const openShareModalForUser = (user, customPassword = null) => {
    const displayRole = user.role === 'SUPERADMIN' ? 'SUPERADMIN' : (user.role === 'CLIENT' || user.role === 'USER') ? 'CLIENT' : 'EMPLOYEE';
    setShareCredentials({
      name: user.name,
      email: user.email,
      password: customPassword || 'Account Password set during creation',
      role: displayRole,
      phone: user.phone || '',
      designation: user.designation || '',
      portalUrl: window.location.origin
    });
    setCopied(false);
    setShowShareModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    const displayRole = user.role === 'SUPERADMIN' ? 'SUPERADMIN' : (user.role === 'CLIENT' || user.role === 'USER') ? 'CLIENT' : 'EMPLOYEE';
    setEditUserData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      designation: user.designation || '',
      role: displayRole,
      employeeId: user.employeeId || '',
      dob: user.dob || '',
      gender: user.gender || 'Male',
      address: user.address || '',
      branch: user.branch || 'Main Branch',
      department: user.department || 'General',
      dateOfJoining: user.dateOfJoining || (user.createdAt ? user.createdAt.split('T')[0] : ''),
      basicSalary: user.basicSalary || user.baseSalary || 30000,
      accountHolderName: user.accountHolderName || '',
      accountNumber: user.accountNumber || '',
      bankName: user.bankName || '',
      bankIdentifierCode: user.bankIdentifierCode || '',
      branchLocation: user.branchLocation || '',
      avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
    });
    setEditDocuments({
      hsCertificate: user.hsCertificate ? { name: 'Attached Document', dataUrl: user.hsCertificate } : null,
      panCard: user.panCard ? { name: 'Attached Document', dataUrl: user.panCard } : null,
      aadhaarCard: user.aadhaarCard ? { name: 'Attached Document', dataUrl: user.aadhaarCard } : null,
      passport: user.passport ? { name: 'Attached Document', dataUrl: user.passport } : null,
      graduation: user.graduation ? { name: 'Attached Document', dataUrl: user.graduation } : null,
      experienceLetter: user.experienceLetter ? { name: 'Attached Document', dataUrl: user.experienceLetter } : null,
      addressProof: user.addressProof ? { name: 'Attached Document', dataUrl: user.addressProof } : null
    });
    setErrorMsg('');
  };

  const handleDownloadDocument = (docDataUrl, label, userName) => {
    if (!docDataUrl) return;
    const link = document.createElement('a');
    link.href = docDataUrl;
    const isPdf = docDataUrl.includes('application/pdf') || docDataUrl.toLowerCase().endsWith('.pdf');
    const ext = isPdf ? '.pdf' : '.png';
    const cleanUser = (userName || 'user').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanLabel = label.replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `${cleanUser}_${cleanLabel}${ext}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const compressImage = (file, maxDim = 150, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (event) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUserImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedDataUrl = await compressImage(file, 150, 0.85);
        setEditUserData(prev => ({ ...prev, avatarUrl: compressedDataUrl }));
      } catch (err) {
        console.error(err);
        setErrorMsg('Error processing uploaded image file');
      }
    }
  };

  const handleFileUpload = (e, fieldName, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const obj = { name: file.name, dataUrl: reader.result };
      if (isEdit) {
        setEditDocuments(prev => ({ ...prev, [fieldName]: obj }));
      } else {
        setDocuments(prev => ({ ...prev, [fieldName]: obj }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const finalPassword = newUser.password && newUser.password.trim() ? newUser.password : generateRandomPassword();
    const finalRole = newUser.role === 'SUPERADMIN' ? 'SUPERADMIN' : newUser.role === 'CLIENT' ? 'CLIENT' : 'EMPLOYEE';

    const payload = {
      ...newUser,
      role: finalRole,
      password: finalPassword,
      hsCertificate: documents.hsCertificate?.dataUrl || null,
      panCard: documents.panCard?.dataUrl || null,
      aadhaarCard: documents.aadhaarCard?.dataUrl || null,
      passport: documents.passport?.dataUrl || null,
      graduation: documents.graduation?.dataUrl || null,
      experienceLetter: documents.experienceLetter?.dataUrl || null,
      addressProof: documents.addressProof?.dataUrl || null
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setShowAddUserModal(false);
        const creds = {
          name: json.data?.name || newUser.name,
          email: json.data?.email || newUser.email,
          password: json.credentials?.password || finalPassword,
          role: newUser.role,
          phone: json.data?.phone || newUser.phone,
          designation: json.data?.designation || newUser.designation,
          portalUrl: window.location.origin
        };
        setShareCredentials(creds);
        setCopied(false);
        setShowShareModal(true);
        setNewUser({
          name: '', email: '', password: '', phone: '', designation: 'Staff Member', role: 'EMPLOYEE',
          employeeId: '', dob: '', gender: 'Male', address: '', branch: 'Main Branch', department: 'General',
          dateOfJoining: new Date().toISOString().split('T')[0], accountHolderName: '', accountNumber: '', bankName: '', bankIdentifierCode: '', branchLocation: ''
        });
        setDocuments({ hsCertificate: null, panCard: null, aadhaarCard: null, passport: null, graduation: null, experienceLetter: null, addressProof: null });
        setSuccessMsg(`Account for ${json.data?.name || ''} registered successfully!`);
        setTimeout(() => setSuccessMsg(''), 5000);
        fetchUserData();
        if (onRefresh) onRefresh();
      } else {
        setErrorMsg(json.message || 'Error registering account');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Server connection error');
    }
  };

  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setErrorMsg('');
    const finalEditRole = editUserData.role === 'SUPERADMIN' ? 'SUPERADMIN' : editUserData.role === 'CLIENT' ? 'CLIENT' : 'EMPLOYEE';
    const payload = {
      ...editUserData,
      role: finalEditRole,
      hsCertificate: editDocuments.hsCertificate?.dataUrl || null,
      panCard: editDocuments.panCard?.dataUrl || null,
      aadhaarCard: editDocuments.aadhaarCard?.dataUrl || null,
      passport: editDocuments.passport?.dataUrl || null,
      graduation: editDocuments.graduation?.dataUrl || null,
      experienceLetter: editDocuments.experienceLetter?.dataUrl || null,
      addressProof: editDocuments.addressProof?.dataUrl || null
    };

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setEditingUser(null);
        setSuccessMsg(`User account ${editUserData.name} updated successfully!`);
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchUserData();
        if (onRefresh) onRefresh();
      } else {
        setErrorMsg(json.message || 'Error updating user');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Server connection error');
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setErrorMsg('');
    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success) {
        setDeletingUser(null);
        setSuccessMsg(`User account deleted successfully`);
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchUserData();
        if (onRefresh) onRefresh();
      } else {
        setErrorMsg(json.message || 'Error deleting user');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Server connection error');
    }
  };

  const handleToggleMfa = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}/mfa`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success) {
        fetchUserData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Users
  const employeesList = users.filter(u => u.role !== 'CLIENT' && u.role !== 'USER');
  const clientsList = users.filter(u => u.role === 'CLIENT' || u.role === 'USER');

  const displayedUsers = activeTab === 'employees' ? employeesList
    : activeTab === 'clients' ? clientsList
      : users;

  // Access check
  if (!isSuperAdmin) {
    return (
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '650px', margin: '2rem auto' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Lock size={32} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '0.75rem', color: '#f87171' }}>
          Access Denied: Superadmin Privilege Required
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          User & Employee Management is strictly restricted to <strong>Superadmin</strong> role accounts.
        </p>
        <div style={{ background: '#f8fafc', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', display: 'inline-block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Current Role: <span style={{ color: 'var(--brand-yellow)', fontWeight: 700 }}>{currentRole.replace('_', ' ')}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>

      {/* Notifications */}
      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><X size={14} /></button>
        </div>
      )}

      {/* Top Controls & Tab Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', background: '#ffffff', padding: '0.45rem 0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', gap: '0.2rem', background: '#f1f5f9', padding: '0.18rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <button
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            onClick={() => setActiveTab('users')}
          >
            <Users style={{ width: 14, height: 14 }} />
            All Accounts ({users.length})
          </button>
          <button
            className={`btn ${activeTab === 'employees' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            onClick={() => setActiveTab('employees')}
          >
            <Briefcase style={{ width: 14, height: 14 }} />
            Employees ({employeesList.length})
          </button>
          <button
            className={`btn ${activeTab === 'clients' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            onClick={() => setActiveTab('clients')}
          >
            <Building style={{ width: 14, height: 14 }} />
            Clients ({clientsList.length})
          </button>
          <button
            className={`btn ${activeTab === 'activity-logs' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            onClick={() => setActiveTab('activity-logs')}
          >
            <Activity style={{ width: 14, height: 14 }} />
            Audit Logs ({activityLogs.length})
          </button>
        </div>

        <button className="btn btn-primary" style={{ padding: '0.28rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => { setErrorMsg(''); setShowAddUserModal(true); }}>
          <Plus style={{ width: 14, height: 14 }} />
          Register New User / Employee
        </button>
      </div>

      {/* TAB 1: Main User/Employee Table */}
      {activeTab !== 'activity-logs' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
                {activeTab === 'employees' ? 'Employee Management (Unified User Database)' : activeTab === 'clients' ? 'Client Accounts Management' : 'Superadmin Role & User Management'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                All user accounts and employees are managed securely in the single <code>User</code> database table.
              </p>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Total Records: {displayedUsers.length}
            </span>
          </div>

          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="custom-table" style={{ width: '100%', minWidth: '950px' }}>
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>User Details</th>
                  <th>System Role</th>
                  <th>Branch / Dept</th>
                  <th>Designation</th>
                  <th>Contact</th>
                  <th>Joining Date</th>
                  <th>MFA</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No accounts available in this category.
                    </td>
                  </tr>
                ) : (
                  displayedUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#22c55e',
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: '4px',
                          fontFamily: 'monospace'
                        }}>
                          {u.employeeId || `#EMP${u.id.substring(0, 5).toUpperCase()}`}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} alt={u.name} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--brand-gold)', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 700 }}>{u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '0.28rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          ...(u.role === 'SUPERADMIN' ? { background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.4)' } :
                            u.role === 'CLIENT' ? { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' } :
                              u.role === 'EMPLOYEE' ? { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)' } :
                                { background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)' })
                        }}>
                          {u.role === 'SUPERADMIN' ? '🛡️ Superadmin' : u.role === 'CLIENT' ? '🤝 Client' : u.role === 'EMPLOYEE' ? '💼 Employee' : (u.role ? u.role.replace('_', ' ') : 'Staff')}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{u.branch || 'Main Branch'}</div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{u.department || 'General'}</div>
                      </td>
                      <td>{u.designation && u.designation !== 'Staff Member' ? u.designation : (u.role === 'EMPLOYEE' ? 'Employee' : u.role === 'SUPERADMIN' ? 'Super Admin' : u.role === 'MASTER_ADMIN' ? 'Main Admin' : 'Employee')}</td>
                      <td>{u.phone || 'N/A'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {u.dateOfJoining || (u.createdAt ? u.createdAt.split('T')[0] : '-')}
                      </td>
                      <td>
                        {u.isMfaEnabled ? (
                          <span className="badge badge-approved">🔒 ACTIVE</span>
                        ) : (
                          <span className="badge badge-pending">OFF</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            className="btn btn-secondary"
                            title="View Full Profile & Documents"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => setViewingUser(u)}
                          >
                            <Eye style={{ width: 14, height: 14, color: '#60a5fa' }} />
                          </button>

                          <button
                            className="btn btn-secondary"
                            title="Send / Share Login Credentials"
                            style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', borderColor: '#3b82f6', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            onClick={() => openShareModalForUser(u)}
                          >
                            <Send style={{ width: 12, height: 12 }} /> Share
                          </button>

                          <button
                            className="btn btn-secondary"
                            title="Toggle MFA Status"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => handleToggleMfa(u.id)}
                          >
                            <KeyRound style={{ width: 14, height: 14, color: 'var(--brand-yellow)' }} />
                          </button>

                          <button
                            className="btn btn-secondary"
                            title="Edit User Details & Employee Info"
                            style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem' }}
                            onClick={() => openEditModal(u)}
                          >
                            <Edit2 style={{ width: 13, height: 13, color: 'var(--brand-primary)' }} /> Edit
                          </button>

                          <button
                            className="btn btn-secondary"
                            title="Delete User"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                            onClick={() => setDeletingUser(u)}
                          >
                            <Trash2 style={{ width: 14, height: 14 }} />
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
      )}

      {/* TAB 2: Activity Logs */}
      {activeTab === 'activity-logs' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
              Complete System Audit & Security Logs
            </h3>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User Account</th>
                <th>Module</th>
                <th>Action & Operation</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {activityLogs.map(log => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td><strong>{log.userName}</strong></td>
                  <td><span style={{ color: 'var(--brand-yellow)', fontWeight: 600 }}>{log.module}</span></td>
                  <td>{log.action}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Register New User / Create Employee */}
      {showAddUserModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1.5rem' }}>
          <div className="modal-content" style={{ background: '#ffffff', color: '#0f172a', borderRadius: '16px', width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                  Register New System Account
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Account will be created directly in the unified database `User` table</span>
              </div>
              <button onClick={() => setShowAddUserModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            {/* Registration Mode Selector */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setRegisterMode('full')}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: 'none', background: registerMode === 'full' ? '#2563eb' : 'transparent', color: registerMode === 'full' ? '#ffffff' : '#475569', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                💼 Full Employee Profile Setup
              </button>
              <button
                type="button"
                onClick={() => setRegisterMode('quick')}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: 'none', background: registerMode === 'quick' ? '#2563eb' : 'transparent', color: registerMode === 'quick' ? '#ffffff' : '#475569', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                ⚡ Quick User Registration
              </button>
            </div>

            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>

              {/* Personal Info */}
              <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.85rem 0', color: '#1e293b', fontSize: '0.95rem', fontWeight: 700 }}>Personal Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Full Name*</label>
                    <input className="input-field" required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="e.g. Rahul Sharma" style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.88rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Email Address*</label>
                    <input type="email" className="input-field" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="rahul@akashcrm.com" style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.88rem' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Account Password*</label>
                      <button type="button" onClick={() => setNewUser({ ...newUser, password: generateRandomPassword() })} style={{ fontSize: '0.72rem', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', padding: 0, fontWeight: 600 }}>⚡ Auto-generate</button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showAddPassword ? 'text' : 'password'}
                        className="input-field"
                        required
                        value={newUser.password}
                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="e.g. Akash@8891"
                        style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem 2.25rem 0.55rem 0.75rem', borderRadius: '6px', width: '100%', fontSize: '0.88rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAddPassword(!showAddPassword)}
                        style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                        title={showAddPassword ? "Hide Password" : "Show Password"}
                      >
                        {showAddPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Phone Number*</label>
                    <input className="input-field" required value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} placeholder="+91 98300 00000" style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.88rem' }} />
                  </div>
                </div>

                {registerMode === 'full' && (
                  newUser.role === 'CLIENT' ? (
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Address</label>
                      <input className="input-field" value={newUser.address} onChange={e => setNewUser({ ...newUser, address: e.target.value })} placeholder="Kolkata, WB" style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }} />
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Date of Birth</label>
                        <input type="date" className="input-field" value={newUser.dob} onChange={e => setNewUser({ ...newUser, dob: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Gender</label>
                        <select className="select-field" value={newUser.gender} onChange={e => setNewUser({ ...newUser, gender: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }}>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Date of Joining</label>
                        <input type="date" className="input-field" value={newUser.dateOfJoining} onChange={e => setNewUser({ ...newUser, dateOfJoining: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Address</label>
                        <input className="input-field" value={newUser.address} onChange={e => setNewUser({ ...newUser, address: e.target.value })} placeholder="Kolkata, WB" style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }} />
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Company & Role Details */}
              <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.85rem 0', color: '#1e293b', fontSize: '0.95rem', fontWeight: 700 }}>
                  {newUser.role === 'CLIENT' ? 'System Role & Client Classification' : 'Company & System Role Details'}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: newUser.role === 'CLIENT' ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: newUser.role === 'CLIENT' ? 0 : '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Assign System Role*</label>
                    <select className="select-field" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.88rem' }}>
                      <option value="EMPLOYEE">💼 Employee (Internal Staff & Field Personnel)</option>
                      <option value="CLIENT">🤝 Client (External Customer Portal)</option>
                      <option value="SUPERADMIN">🛡️ Superadmin (Full System Control)</option>
                    </select>
                  </div>
                  {newUser.role !== 'CLIENT' && (
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Employee ID</label>
                      <input className="input-field" value={newUser.employeeId} onChange={e => setNewUser({ ...newUser, employeeId: e.target.value })} placeholder="#EMP00058" style={{ background: '#e2e8f0', color: '#334155', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.88rem', fontWeight: 600 }} />
                    </div>
                  )}
                </div>

                {newUser.role !== 'CLIENT' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Branch</label>
                      <select className="select-field" value={newUser.branch} onChange={e => setNewUser({ ...newUser, branch: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }}>
                        {branches.map((b, i) => <option key={i} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Department</label>
                      <select className="select-field" value={newUser.department} onChange={e => setNewUser({ ...newUser, department: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }}>
                        {departments.map((d, i) => <option key={i} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Designation</label>
                      <select className="select-field" value={newUser.designation} onChange={e => setNewUser({ ...newUser, designation: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }}>
                        {designations.map((d, i) => <option key={i} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Document Upload Card (Full setup mode) - PDF & Images supported (ONLY for non-CLIENT) */}
              {registerMode === 'full' && newUser.role !== 'CLIENT' && (
                <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <div style={{ width: '4px', height: '18px', backgroundColor: '#22c55e', borderRadius: '2px', marginRight: '0.5rem' }}></div>
                    <h4 style={{ margin: 0, color: '#1e293b', fontSize: '0.95rem', fontWeight: 700 }}>
                      Employee Documents (PDF / Images)
                    </h4>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                    {getDocFieldsForRole(newUser.role).map((doc) => {
                      const uploaded = documents[doc.key];
                      return (
                        <div key={doc.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>{doc.label}</span>
                          <div>
                            {uploaded ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: '#166534' }}>
                                <Check size={13} color="#22c55e" />
                                <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploaded.name}</span>
                                <X size={13} style={{ cursor: 'pointer', marginLeft: '0.2rem' }} onClick={() => setDocuments(prev => ({ ...prev, [doc.key]: null }))} />
                              </div>
                            ) : (
                              <label style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                backgroundColor: '#22c55e',
                                color: '#ffffff',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '5px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                              }}>
                                <Upload size={13} />
                                <span>Choose file</span>
                                <input
                                  type="file"
                                  accept="application/pdf,image/*,.pdf"
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
              )}

              {/* Bank Account Details (Full setup mode) - ONLY for non-CLIENT */}
              {registerMode === 'full' && newUser.role !== 'CLIENT' && (
                <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 0.85rem 0', color: '#1e293b', fontSize: '0.95rem', fontWeight: 700 }}>Bank Account Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.85rem' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Account Holder Name</label>
                      <input className="input-field" value={newUser.accountHolderName} onChange={e => setNewUser({ ...newUser, accountHolderName: e.target.value })} placeholder="Account holder" style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Account Number</label>
                      <input className="input-field" value={newUser.accountNumber} onChange={e => setNewUser({ ...newUser, accountNumber: e.target.value })} placeholder="A/C Number" style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Bank Name</label>
                      <input className="input-field" value={newUser.bankName} onChange={e => setNewUser({ ...newUser, bankName: e.target.value })} placeholder="e.g. HDFC Bank" style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>IFSC / SWIFT Code</label>
                      <input className="input-field" value={newUser.bankIdentifierCode} onChange={e => setNewUser({ ...newUser, bankIdentifierCode: e.target.value })} placeholder="HDFC0001234" style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>Branch Location</label>
                      <input className="input-field" value={newUser.branchLocation} onChange={e => setNewUser({ ...newUser, branchLocation: e.target.value })} placeholder="Branch location" style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }} />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddUserModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.65rem 1.5rem', borderRadius: '8px', fontWeight: 600 }}>Create User Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing User / Employee */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1.5rem' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', color: '#0f172a', borderRadius: '16px', width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={20} style={{ color: '#2563eb' }} /> Edit Account Details ({editingUser.name})
              </h3>
              <button onClick={() => setEditingUser(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleEditUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* Profile Image Section */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <img src={editUserData.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} alt="Avatar" style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid #2563eb', objectFit: 'cover' }} />
                <div>
                  <input type="file" accept="image/*" id="mgmt-avatar-upload" style={{ display: 'none' }} onChange={handleUserImageUpload} />
                  <label htmlFor="mgmt-avatar-upload" style={{ background: '#2563eb', color: '#ffffff', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Upload size={14} /> Upload New Photo
                  </label>
                </div>
              </div>

              {/* Personal Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Full Name</label>
                  <input className="input-field" required value={editUserData.name} onChange={e => setEditUserData({ ...editUserData, name: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.88rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Email Address</label>
                  <input type="email" className="input-field" required value={editUserData.email} onChange={e => setEditUserData({ ...editUserData, email: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.88rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Password (Leave empty to retain current)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      className="input-field"
                      value={editUserData.password}
                      onChange={e => setEditUserData({ ...editUserData, password: e.target.value })}
                      placeholder="New password"
                      style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem 2.25rem 0.55rem 0.75rem', borderRadius: '6px', width: '100%', fontSize: '0.88rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      style={{ position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                      title={showEditPassword ? "Hide Password" : "Show Password"}
                    >
                      {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Phone Number</label>
                  <input className="input-field" value={editUserData.phone} onChange={e => setEditUserData({ ...editUserData, phone: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.88rem' }} />
                </div>
              </div>

              {/* Personal Details Extra Info (Edit Modal) */}
              {editUserData.role === 'CLIENT' ? (
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Address</label>
                  <input className="input-field" value={editUserData.address} onChange={e => setEditUserData({ ...editUserData, address: e.target.value })} placeholder="Kolkata, WB" style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }} />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Date of Birth</label>
                    <input type="date" className="input-field" value={editUserData.dob} onChange={e => setEditUserData({ ...editUserData, dob: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Gender</label>
                    <select className="select-field" value={editUserData.gender} onChange={e => setEditUserData({ ...editUserData, gender: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Date of Joining</label>
                    <input type="date" className="input-field" value={editUserData.dateOfJoining} onChange={e => setEditUserData({ ...editUserData, dateOfJoining: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Address</label>
                    <input className="input-field" value={editUserData.address} onChange={e => setEditUserData({ ...editUserData, address: e.target.value })} placeholder="Kolkata, WB" style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }} />
                  </div>
                </div>
              )}

              {/* Company Info - ONLY for non-CLIENT */}
              {editUserData.role !== 'CLIENT' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Employee ID</label>
                    <input className="input-field" value={editUserData.employeeId} onChange={e => setEditUserData({ ...editUserData, employeeId: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.88rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Branch</label>
                    <select className="select-field" value={editUserData.branch} onChange={e => setEditUserData({ ...editUserData, branch: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.88rem' }}>
                      {branches.map((b, i) => <option key={i} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Department</label>
                    <select className="select-field" value={editUserData.department} onChange={e => setEditUserData({ ...editUserData, department: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.88rem' }}>
                      {departments.map((d, i) => <option key={i} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: editUserData.role === 'CLIENT' ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                {editUserData.role !== 'CLIENT' && (
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Job Designation</label>
                    <select className="select-field" value={editUserData.designation} onChange={e => setEditUserData({ ...editUserData, designation: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.88rem' }}>
                      {designations.map((d, i) => <option key={i} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>System Role</label>
                  <select className="select-field" value={editUserData.role} onChange={e => setEditUserData({ ...editUserData, role: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.55rem', borderRadius: '6px', width: '100%', fontSize: '0.88rem' }}>
                    <option value="EMPLOYEE">💼 Employee (Internal Staff)</option>
                    <option value="CLIENT">🤝 Client (External Customer)</option>
                    <option value="SUPERADMIN">🛡️ Superadmin (Full System Control)</option>
                  </select>
                </div>
              </div>

              {/* Document Uploads (Edit Modal) - PDF & Images supported (ONLY for non-CLIENT) */}
              {editUserData.role !== 'CLIENT' && (
                <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <div style={{ width: '4px', height: '18px', backgroundColor: '#22c55e', borderRadius: '2px', marginRight: '0.5rem' }}></div>
                    <h4 style={{ margin: 0, color: '#1e293b', fontSize: '0.95rem', fontWeight: 700 }}>
                      Employee Documents (PDF / Images)
                    </h4>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                    {getDocFieldsForRole(editUserData.role).map((doc) => {
                      const uploaded = editDocuments[doc.key];
                      return (
                        <div key={doc.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '0.55rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>{doc.label}</span>
                          <div>
                            {uploaded ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: '#166534' }}>
                                  <Check size={13} color="#22c55e" />
                                  <span style={{ maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uploaded.name}</span>
                                  <X size={13} style={{ cursor: 'pointer', marginLeft: '0.2rem' }} onClick={() => setEditDocuments(prev => ({ ...prev, [doc.key]: null }))} />
                                </div>
                                {isSuperAdmin && uploaded.dataUrl && (
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadDocument(uploaded.dataUrl, doc.label, editUserData.name)}
                                    style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '0.25rem 0.45rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                    title="Download Document"
                                  >
                                    <Download size={12} />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <label style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                backgroundColor: '#22c55e',
                                color: '#ffffff',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '5px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                              }}>
                                <Upload size={13} />
                                <span>Choose file</span>
                                <input
                                  type="file"
                                  accept="application/pdf,image/*,.pdf"
                                  onChange={(e) => handleFileUpload(e, doc.key, true)}
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
              )}

              {/* Bank Account Details - ONLY for non-CLIENT */}
              {editUserData.role !== 'CLIENT' && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e293b', fontSize: '0.9rem', fontWeight: 700 }}>Bank Account Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Account Holder</label>
                      <input className="input-field" value={editUserData.accountHolderName} onChange={e => setEditUserData({ ...editUserData, accountHolderName: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Account Number</label>
                      <input className="input-field" value={editUserData.accountNumber} onChange={e => setEditUserData({ ...editUserData, accountNumber: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Bank Name</label>
                      <input className="input-field" value={editUserData.bankName} onChange={e => setEditUserData({ ...editUserData, bankName: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>IFSC / Code</label>
                      <input className="input-field" value={editUserData.bankIdentifierCode} onChange={e => setEditUserData({ ...editUserData, bankIdentifierCode: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>Branch Location</label>
                      <input className="input-field" value={editUserData.branchLocation} onChange={e => setEditUserData({ ...editUserData, branchLocation: e.target.value })} style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '6px', width: '100%', fontSize: '0.85rem' }} />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '0.65rem 1.4rem', borderRadius: '8px', fontWeight: 600 }}>Save Account Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Full User / Employee Profile */}
      {viewingUser && (
        <div className="modal-overlay" onClick={() => setViewingUser(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1.5rem' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', color: '#0f172a', borderRadius: '16px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src={viewingUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} alt={viewingUser.name} style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid #2563eb', objectFit: 'cover' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#0f172a' }}>{viewingUser.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{viewingUser.email}</div>
                  <span style={{ display: 'inline-block', marginTop: '4px', padding: '0.15rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                    {viewingUser.role} • {viewingUser.employeeId || '#EMP00058'}
                  </span>
                </div>
              </div>
              <button onClick={() => setViewingUser(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Job Details Card */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.65rem 0', color: '#1e293b', fontSize: '0.9rem', fontWeight: 700 }}>Employment Details</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div><strong>Branch:</strong> {viewingUser.branch || 'Main Branch'}</div>
                  <div><strong>Department:</strong> {viewingUser.department || 'General'}</div>
                  <div><strong>Designation:</strong> {viewingUser.designation || 'Staff'}</div>
                  {viewingUser.role !== 'CLIENT' && <div><strong>Joining Date:</strong> {viewingUser.dateOfJoining || '-'}</div>}
                  <div><strong>Phone:</strong> {viewingUser.phone || 'N/A'}</div>
                  <div><strong>Address:</strong> {viewingUser.address || 'N/A'}</div>
                </div>
              </div>

              {/* Document Viewer Card (Only Super Admin Can Download, for Employees) */}
              {viewingUser.role !== 'CLIENT' && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 0.65rem 0', color: '#1e293b', fontSize: '0.9rem', fontWeight: 700 }}>
                    Attached Identification & Verification Documents (PDF / Certificates)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.82rem' }}>
                    {getDocFieldsForRole(viewingUser.role).map((doc) => {
                      const docUrl = viewingUser[doc.key];
                      return (
                        <div key={doc.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <span style={{ fontWeight: 600, color: '#334155' }}>{doc.label}</span>
                          {docUrl ? (
                            isSuperAdmin ? (
                              <button
                                type="button"
                                onClick={() => handleDownloadDocument(docUrl, doc.label, viewingUser.name)}
                                style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <Download size={13} /> Download File
                              </button>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Lock size={12} style={{ color: '#94a3b8' }} /> Super Admin Only
                              </span>
                            )
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Not uploaded</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bank Details Card (ONLY for Employees) */}
              {viewingUser.role !== 'CLIENT' && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 0.65rem 0', color: '#1e293b', fontSize: '0.9rem', fontWeight: 700 }}>Bank Account Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div><strong>Holder:</strong> {viewingUser.accountHolderName || '-'}</div>
                    <div><strong>A/C No:</strong> {viewingUser.accountNumber || '-'}</div>
                    <div><strong>Bank:</strong> {viewingUser.bankName || '-'}</div>
                    <div><strong>IFSC:</strong> {viewingUser.bankIdentifierCode || '-'}</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn btn-secondary"
                style={{ borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={() => {
                  const u = viewingUser;
                  setViewingUser(null);
                  openEditModal(u);
                }}
              >
                <Edit2 size={15} /> Edit Employee Details
              </button>
              <button className="btn btn-primary" onClick={() => setViewingUser(null)}>Close Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete User / Employee */}
      {deletingUser && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1.5rem' }}>
          <div className="modal-content" style={{ background: '#ffffff', color: '#0f172a', borderRadius: '16px', maxWidth: '450px', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#dc2626' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>
                Confirm Account Deletion
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to permanently delete user/employee account <strong>{deletingUser.name}</strong> (<code>{deletingUser.email}</code>)? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingUser(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444', color: '#ffffff' }} onClick={handleDeleteUser}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Share Credentials */}
      {showShareModal && shareCredentials && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1.5rem' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', color: '#0f172a', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={22} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                    Send Login Credentials
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Share these account details with the user to log in</span>
                </div>
              </div>
              <button onClick={() => setShowShareModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Assigned Role</span>
                <span style={{ padding: '0.2rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, background: shareCredentials.role === 'SUPERADMIN' ? 'rgba(168, 85, 247, 0.15)' : shareCredentials.role === 'CLIENT' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)', color: shareCredentials.role === 'SUPERADMIN' ? '#9333ea' : shareCredentials.role === 'CLIENT' ? '#059669' : '#2563eb' }}>
                  {shareCredentials.role}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>User Name</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{shareCredentials.name} ({shareCredentials.designation || 'Staff'})</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Login Email</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.9rem', color: '#1e293b', background: '#ffffff', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>{shareCredentials.email}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Account Password</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: '#2563eb', background: '#eff6ff', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid #bfdbfe' }}>{shareCredentials.password}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <a href={`mailto:${shareCredentials.email}?subject=Your%20Akash%20CRM%20Account%20Login%20Details&body=Hello%20${encodeURIComponent(shareCredentials.name)},%0A%0AYour%20account%20has%20been%20provisioned%20in%20Akash%20CRM%20as%20${encodeURIComponent(shareCredentials.role)}.%0A%0APortal%20URL:%20${encodeURIComponent(shareCredentials.portalUrl)}%0ALogin%20Email:%20${encodeURIComponent(shareCredentials.email)}%0APassword:%20${encodeURIComponent(shareCredentials.password)}%0A%0APlease%20keep%20your%20credentials%20confidential.%0A%0AThanks,%0AAkash%20Engineering%20Superadmin`} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', textDecoration: 'none', background: '#2563eb', color: '#ffffff', padding: '0.65rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem' }}>
                  <Mail size={16} /> Send via Email
                </a>
                <a href={`https://wa.me/${(shareCredentials.phone || '').replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(shareCredentials.name)},%20your%20Akash%20CRM%20account%20is%20ready.%0APortal:%20${encodeURIComponent(shareCredentials.portalUrl)}%0AEmail:%20${encodeURIComponent(shareCredentials.email)}%0APassword:%20${encodeURIComponent(shareCredentials.password)}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', textDecoration: 'none', background: '#10b981', color: '#ffffff', padding: '0.65rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem' }}>
                  <MessageSquare size={16} /> Send via WhatsApp
                </a>
              </div>
              <button type="button" onClick={() => {
                const text = `🚀 Akash CRM - Account Login Details\n---------------------------------------\nHello ${shareCredentials.name},\nYour account has been created by Superadmin.\nRole: ${shareCredentials.role}\nPortal URL: ${shareCredentials.portalUrl}\nLogin Email: ${shareCredentials.email}\nPassword: ${shareCredentials.password}\n\nPlease keep your credentials safe.`;
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 3000);
              }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: copied ? '#10b981' : '#f1f5f9', color: copied ? '#ffffff' : '#0f172a', border: '1px solid #cbd5e1', padding: '0.65rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Credentials Copied to Clipboard!' : 'Copy Details to Clipboard'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
