import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Lock, 
  Plus, 
  KeyRound, 
  Activity,
  UserCheck
} from 'lucide-react';

export default function UserManagement({ data, currentRole, onRefresh }) {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'activity-logs'
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    designation: '',
    role: 'USER'
  });

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const json = await res.json();
      if (json.success) {
        setShowAddUserModal(false);
        setNewUser({ name: '', email: '', password: '', phone: '', designation: '', role: 'USER' });
        if (onRefresh) onRefresh();
      } else {
        alert(json.message || 'Error registering user');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMfa = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}/mfa`, {
        method: 'PATCH'
      });
      const json = await res.json();
      if (json.success && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Sub-nav & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button 
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('users')}
          >
            <Users style={{ width: 16, height: 16 }} />
            User Accounts & Roles ({data.users ? data.users.length : 0})
          </button>
          <button 
            className={`btn ${activeTab === 'activity-logs' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('activity-logs')}
          >
            <Activity style={{ width: 16, height: 16 }} />
            Full Audit Activity Logs ({data.activityLogs ? data.activityLogs.length : 0})
          </button>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddUserModal(true)}>
          <Plus style={{ width: 16, height: 16 }} />
          Register New User
        </button>
      </div>

      {/* TAB 1: User Accounts */}
      {activeTab === 'users' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
              Role-Based Access Control (RBAC) & Database User Table
            </h3>
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
                <th>Security Action</th>
              </tr>
            </thead>
            <tbody>
              {data.users && data.users.map(u => (
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
                      {u.role.replace('_', ' ')}
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
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      onClick={() => handleToggleMfa(u.id)}
                    >
                      <KeyRound style={{ width: 14, height: 14, color: 'var(--brand-yellow)' }} />
                      Toggle MFA
                    </button>
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
              {data.activityLogs && data.activityLogs.map(log => (
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
              Register New System User in Database
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
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>System Role</label>
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

    </div>
  );
}
