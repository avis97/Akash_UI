import React from 'react';
import { LogOut } from 'lucide-react';

export default function Header({ 
  activeLabel, 
  currentRole, 
  onRoleChange, 
  currentUser, 
  onLogout 
}) {
  return (
    <header className="top-bar">
      <div className="page-heading">
        {activeLabel}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        
        {/* Role Selector Pill */}
        <div className="role-selector-pill">
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Role:</span>
          <select 
            className="select-field"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', width: 'auto' }}
            value={currentRole}
            onChange={e => onRoleChange(e.target.value)}
          >
            <option value="SUPERADMIN">Superadmin</option>
            <option value="USER">Normal User</option>
            <option value="MASTER_ADMIN">Master Admin</option>
            <option value="SUB_ADMIN">Sub Admin</option>
            <option value="FACILITY_MANAGER">Facility Manager</option>
            <option value="SERVICE_PERSONNEL">Service Personnel</option>
          </select>
        </div>

        {/* User Profile Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <img 
            src={currentUser?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"} 
            alt="Profile" 
            style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid var(--brand-primary)' }} 
          />
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
              {currentUser?.name || currentUser?.email || 'User'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--brand-primary)' }}>
              {currentRole.replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button 
          className="btn btn-outline" 
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          onClick={onLogout}
        >
          <LogOut size={14} style={{ marginRight: '4px' }} /> Logout
        </button>

      </div>
    </header>
  );
}
