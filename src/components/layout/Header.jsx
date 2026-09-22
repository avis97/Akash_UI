import React, { useState } from 'react';
import { LogOut, User, Lock, Camera, Check, X, Upload, Image as ImageIcon } from 'lucide-react';

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
];

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

export default function Header({
  activeLabel,
  currentRole,
  currentUser,
  onLogout,
  onUserUpdate
}) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    password: '',
    avatarUrl: currentUser?.avatarUrl || PRESET_AVATARS[0],
    phone: currentUser?.phone || ''
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handleOpenModal = () => {
    setFormData({
      name: currentUser?.name || '',
      password: '',
      avatarUrl: currentUser?.avatarUrl || PRESET_AVATARS[0],
      phone: currentUser?.phone || ''
    });
    setMsg({ type: '', text: '' });
    setShowProfileModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setMsg({ type: 'info', text: 'Optimizing uploaded image...' });
        const compressedDataUrl = await compressImage(file, 150, 0.85);
        setFormData(prev => ({ ...prev, avatarUrl: compressedDataUrl }));
        setMsg({ type: 'success', text: 'Image file loaded & optimized! Click "Save Profile Changes" to update.' });
      } catch (err) {
        console.error(err);
        setMsg({ type: 'error', text: 'Could not process image file.' });
      }
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });

      const json = await res.json();
      if (json.success) {
        setMsg({ type: 'success', text: 'Profile updated successfully!' });
        if (json.token) localStorage.setItem('token', json.token);
        if (json.user) localStorage.setItem('user', JSON.stringify(json.user));

        if (onUserUpdate) {
          onUserUpdate(json.user);
        }

        setTimeout(() => {
          setShowProfileModal(false);
        }, 1200);
      } else {
        setMsg({ type: 'error', text: json.message || 'Error updating profile' });
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Server communication failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <header className="top-bar">
      <div className="page-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: '#22c55e',
          boxShadow: '0 0 10px rgba(34, 197, 94, 0.8)',
          display: 'inline-block'
        }}></span>
        <span style={{ fontWeight: 700, fontSize: '1.35rem', color: 'var(--text-primary, #0f172a)' }}>{activeLabel}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>

        {/* User Profile Badge (Clickable for editing profile) */}
        <div
          onClick={handleOpenModal}
          title="Click to Edit Profile (Name, Password, Avatar Image)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            transition: 'all 0.2s',
            background: 'rgba(34, 197, 94, 0.08)',
            border: '1px solid rgba(34, 197, 94, 0.25)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.16)';
            e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.25)';
          }}
        >
          <div style={{ position: 'relative', width: 36, height: 36 }}>
            <img
              src={currentUser?.avatarUrl || PRESET_AVATARS[0]}
              alt="Profile"
              style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #22c55e', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', bottom: -2, right: -2, background: '#22c55e', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Camera size={10} />
            </div>
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary, #0f172a)' }}>
              {currentUser?.name || currentUser?.email || 'User'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
              {currentRole === 'SUPERADMIN' ? '🛡️ Superadmin' : (currentRole === 'CLIENT' || currentRole === 'USER') ? '🤝 Client' : '💼 Employee'}
            </div>
          </div>
        </div>

        {/* Edit Profile Button */}
        <button
          className="btn"
          style={{
            padding: '0.45rem 0.85rem',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(34, 197, 94, 0.1)',
            color: '#15803d',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#22c55e';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)';
            e.currentTarget.style.color = '#15803d';
          }}
          onClick={handleOpenModal}
          title="Edit My Personal Profile"
        >
          <User size={15} /> Edit Profile
        </button>

        {/* Logout Button */}
        <button
          className="btn"
          style={{
            padding: '0.45rem 0.85rem',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: '#f8fafc',
            color: '#64748b',
            border: '1px solid #cbd5e1',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#ef4444';
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = '#ef4444';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.borderColor = '#cbd5e1';
          }}
          onClick={onLogout}
        >
          <LogOut size={15} /> Logout
        </button>

      </div>

      {/* EDIT PROFILE MODAL */}
      {showProfileModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowProfileModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1.5rem'
          }}
        >
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '520px',
              maxHeight: 'calc(100vh - 3rem)',
              overflowY: 'auto',
              padding: '1.5rem 1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              border: '1px solid #cbd5e1',
              margin: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading, sans-serif)', fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <User size={22} style={{ color: '#22c55e' }} />
                Edit Personal Profile
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {msg.text && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: msg.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${msg.type === 'success' ? '#22c55e' : '#ef4444'}`,
                color: msg.type === 'success' ? '#15803d' : '#991b1b'
              }}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Profile Image Section */}
              <div style={{ background: '#f8fafc', padding: '1.15rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.75rem' }}>
                  Upload Profile Picture from Device
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1rem' }}>
                  <img
                    src={formData.avatarUrl || PRESET_AVATARS[0]}
                    alt="Current Avatar"
                    style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid #22c55e', objectFit: 'cover', boxShadow: '0 4px 6px -1px rgba(34, 197, 94, 0.25)' }}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      id="header-avatar-upload"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                    <label
                      htmlFor="header-avatar-upload"
                      style={{
                        background: 'linear-gradient(135deg, #22c55e, #16a34a)',
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
                        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
                        transition: 'opacity 0.2s'
                      }}
                    >
                      <Upload size={16} /> Choose Image File from Device
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Select any image file from computer or phone (JPG, PNG, WEBP)</span>
                  </div>
                </div>

                {/* Preset Avatars Selection */}
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.35rem' }}>
                    Or pick a default avatar:
                  </span>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {PRESET_AVATARS.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Preset ${idx + 1}`}
                        onClick={() => setFormData({ ...formData, avatarUrl: url })}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          cursor: 'pointer',
                          objectFit: 'cover',
                          border: formData.avatarUrl === url ? '3px solid #22c55e' : '2px solid #cbd5e1',
                          transform: formData.avatarUrl === url ? 'scale(1.1)' : 'scale(1)',
                          transition: 'all 0.15s'
                        }}
                      />
                    ))}
                  </div>
                </div>

              </div>

              {/* Full Name */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Full Name
                </label>
                <input
                  className="input-field"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your Full Name"
                  style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.6rem 0.85rem', borderRadius: '8px', width: '100%', fontSize: '0.9rem' }}
                />
              </div>

              {/* New Password */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  New Password <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>(Leave blank if keeping current password)</span>
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.6rem 0.85rem', borderRadius: '8px', width: '100%', fontSize: '0.9rem' }}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  Phone Number
                </label>
                <input
                  className="input-field"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98000 00000"
                  style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.6rem 0.85rem', borderRadius: '8px', width: '100%', fontSize: '0.9rem' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '0.6rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#ffffff', border: 'none', padding: '0.6rem 1.35rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}
                >
                  {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </header>
  );
}
