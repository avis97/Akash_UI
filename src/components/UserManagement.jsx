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
  X
} from 'lucide-react';

export default function UserManagement({ data = {}, currentRole = 'SUPERADMIN', onRefresh }) {
  const isSuperAdmin = currentRole === 'SUPERADMIN';

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'activity-logs'
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // User object being edited
  const [deletingUser, setDeletingUser] = useState(null); // User object targeted for deletion
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

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    designation: '',
    role: 'USER'
  });

  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    designation: '',
    role: 'USER'
  });

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditUserData({
      name: user.name || '',
      email: user.email || '',
      password: '', // leave empty unless updating
      phone: user.phone || '',
      designation: user.designation || '',
      role: user.role || 'USER',
      avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'
    });
    setErrorMsg('');
  };

const compressImage = (file, maxDim = 150, quality = 0.8) => {
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

  const handleAddUser = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newUser)
      });
      const json = await res.json();
      if (json.success) {
        setShowAddUserModal(false);
        setNewUser({ name: '', email: '', password: '', phone: '', designation: '', role: 'USER' });
        setSuccessMsg(`User ${json.data?.name || ''} created successfully!`);
        setTimeout(() => setSuccessMsg(''), 4000);
        fetchUserData();
        if (onRefresh) onRefresh();
      } else {
        setErrorMsg(json.message || 'Error registering user');
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
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(editUserData)
      });
      const json = await res.json();
      if (json.success) {
        setEditingUser(null);
        setSuccessMsg(`User ${editUserData.name} updated successfully!`);
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
        setSuccessMsg(`User deleted successfully`);
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

  // If current role is NOT SUPERADMIN, display Access Denied banner
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
          User Management (creating, editing, deleting user accounts and assigning system roles) is strictly restricted to <strong>Superadmin</strong> role accounts.
        </p>
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'inline-block', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Current Role: <span style={{ color: 'var(--brand-yellow)', fontWeight: 700 }}>{currentRole.replace('_', ' ')}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Toast Notifications */}
      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#f87171', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}><X size={16} /></button>
        </div>
      )}

      {/* Sub-nav & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button 
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('users')}
          >
            <Users style={{ width: 16, height: 16 }} />
            User Accounts & Roles ({users.length})
          </button>
          <button 
            className={`btn ${activeTab === 'activity-logs' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('activity-logs')}
          >
            <Activity style={{ width: 16, height: 16 }} />
            Full Audit Activity Logs ({activityLogs.length})
          </button>
        </div>

        <button className="btn btn-primary" onClick={() => { setErrorMsg(''); setShowAddUserModal(true); }}>
          <Plus style={{ width: 16, height: 16 }} />
          Register New User
        </button>
      </div>

      {/* TAB 1: User Accounts */}
      {activeTab === 'users' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
                Superadmin Role-Based User Control (RBAC)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Only Superadmin can add, edit, or delete users and assign specific system roles.
              </p>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Superadmin • Normal User • Master Admin • Sub Admin • Facility Manager • Service Personnel
            </span>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role Assignment</th>
                <th>Designation</th>
                <th>Contact Details</th>
                <th>MFA Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} alt={u.name} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--brand-gold)' }} />
                      <div>
                        <div style={{ fontWeight: 700 }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${
                      u.role === 'SUPERADMIN' ? 'role-superadmin' :
                      u.role === 'USER' ? 'role-user' :
                      u.role === 'MASTER_ADMIN' ? 'role-master' :
                      u.role === 'SUB_ADMIN' ? 'role-sub' :
                      u.role === 'FACILITY_MANAGER' ? 'role-facility' : 'role-service'
                    }`}>
                      {u.role ? u.role.replace('_', ' ') : 'USER'}
                    </span>
                  </td>
                  <td>{u.designation || 'Staff'}</td>
                  <td>{u.phone || 'N/A'}</td>
                  <td>
                    {u.isMfaEnabled ? (
                      <span className="badge badge-approved">🔒 MFA ACTIVE</span>
                    ) : (
                      <span className="badge badge-pending">OFF</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
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
                        title="Edit User Details & Role"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => openEditModal(u)}
                      >
                        <Edit2 style={{ width: 14, height: 14, color: 'var(--brand-primary)' }} />
                        Edit
                      </button>

                      <button 
                        className="btn btn-secondary" 
                        title="Delete User"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                        onClick={() => { setErrorMsg(''); setDeletingUser(u); }}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* Modal: Register New User */}
      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Register New System User (Superadmin)
            </h3>
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <input 
                  className="input-field" 
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="e.g. Anish Ghosh"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email Address</label>
                  <input 
                    type="email"
                    className="input-field" 
                    required
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="name@akashcrm.com"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Account Password</label>
                  <input 
                    type="password"
                    className="input-field" 
                    required
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone Number</label>
                  <input 
                    className="input-field" 
                    value={newUser.phone}
                    onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="+91 98300 00000"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Job Designation</label>
                  <input 
                    className="input-field" 
                    required
                    value={newUser.designation}
                    onChange={e => setNewUser({ ...newUser, designation: e.target.value })}
                    placeholder="e.g. Field Specialist"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assign System Role</label>
                <select 
                  className="select-field"
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="SUPERADMIN">Superadmin</option>
                  <option value="USER">Normal User</option>
                  <option value="MASTER_ADMIN">Master Admin</option>
                  <option value="SUB_ADMIN">Sub Admin</option>
                  <option value="FACILITY_MANAGER">Facility Manager</option>
                  <option value="SERVICE_PERSONNEL">Service Personnel</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddUserModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Register User Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing User */}
      {editingUser && (
        <div 
          className="modal-overlay" 
          onClick={() => setEditingUser(null)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1.5rem' }}
        >
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()}
            style={{ background: '#ffffff', color: '#0f172a', borderRadius: '16px', width: '100%', maxWidth: '520px', maxHeight: 'calc(100vh - 3rem)', overflowY: 'auto', padding: '1.5rem 1.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)', border: '1px solid #cbd5e1', margin: 'auto' }}
          >
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit2 size={20} style={{ color: '#2563eb' }} />
                Edit User Account ({editingUser.name})
              </h3>
              <button 
                type="button"
                onClick={() => setEditingUser(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              {/* Profile Image Section */}
              <div style={{ background: '#f8fafc', padding: '1.15rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.75rem' }}>
                  Upload User Image from Device
                </label>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <img 
                    src={editUserData.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'} 
                    alt="User Avatar" 
                    style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid #2563eb', objectFit: 'cover', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.15)' }} 
                  />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      id="mgmt-avatar-upload" 
                      style={{ display: 'none' }} 
                      onChange={handleUserImageUpload} 
                    />
                    <label 
                      htmlFor="mgmt-avatar-upload" 
                      style={{ 
                        background: '#2563eb', 
                        color: '#ffffff', 
                        padding: '0.6rem 1.1rem', 
                        borderRadius: '8px', 
                        fontSize: '0.85rem', 
                        fontWeight: 600, 
                        cursor: 'pointer', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 2px 6px rgba(37,99,235,0.3)'
                      }}
                    >
                      <Upload size={16} /> Choose Image File from Device
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Select image from computer or phone (JPG, PNG, WEBP)</span>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Full Name</label>
                <input 
                  className="input-field" 
                  required
                  value={editUserData.name}
                  onChange={e => setEditUserData({ ...editUserData, name: e.target.value })}
                  style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.6rem 0.85rem', borderRadius: '8px', width: '100%', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Email Address</label>
                  <input 
                    type="email"
                    className="input-field" 
                    required
                    value={editUserData.email}
                    onChange={e => setEditUserData({ ...editUserData, email: e.target.value })}
                    style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.6rem 0.85rem', borderRadius: '8px', width: '100%', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>New Password</label>
                  <input 
                    type="password"
                    className="input-field" 
                    value={editUserData.password}
                    onChange={e => setEditUserData({ ...editUserData, password: e.target.value })}
                    placeholder="Leave blank to keep current"
                    style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.6rem 0.85rem', borderRadius: '8px', width: '100%', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Phone Number</label>
                  <input 
                    className="input-field" 
                    value={editUserData.phone}
                    onChange={e => setEditUserData({ ...editUserData, phone: e.target.value })}
                    style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.6rem 0.85rem', borderRadius: '8px', width: '100%', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>Job Designation</label>
                  <input 
                    className="input-field" 
                    required
                    value={editUserData.designation}
                    onChange={e => setEditUserData({ ...editUserData, designation: e.target.value })}
                    style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.6rem 0.85rem', borderRadius: '8px', width: '100%', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>System Role</label>
                <select 
                  className="select-field"
                  value={editUserData.role}
                  onChange={e => setEditUserData({ ...editUserData, role: e.target.value })}
                  style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.6rem 0.85rem', borderRadius: '8px', width: '100%', fontSize: '0.9rem' }}
                >
                  <option value="SUPERADMIN">Superadmin</option>
                  <option value="USER">Normal User</option>
                  <option value="MASTER_ADMIN">Master Admin</option>
                  <option value="SUB_ADMIN">Sub Admin</option>
                  <option value="FACILITY_MANAGER">Facility Manager</option>
                  <option value="SERVICE_PERSONNEL">Service Personnel</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <button type="button" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '0.6rem 1.35rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(37,99,235,0.3)' }}>Save User Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete User */}
      {deletingUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f87171' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0 }}>
                Confirm User Deletion
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to permanently delete user account <strong>{deletingUser.name}</strong> (<code>{deletingUser.email}</code>)? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingUser(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleDeleteUser}>
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
