import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckSquare, 
  Calendar, 
  UserCheck, 
  Plus, 
  CheckCircle, 
  FileCheck,
  Building,
  Award,
  Edit2,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export default function SiteAMCTracker({ data = {}, currentRole, currentUser, onRefresh }) {
  const [showAMCModal, setShowAMCModal] = useState(false);
  const [selectedAmcSignOff, setSelectedAmcSignOff] = useState(null);

  // Edit and Delete states
  const [editingAmc, setEditingAmc] = useState(null);
  const [deletingAmc, setDeletingAmc] = useState(null);

  const [siteAMCs, setSiteAMCs] = useState(data.siteAMCs || data.amcs || []);
  const [users, setUsers] = useState(data.users || []);

  const isClient = currentRole === 'CLIENT' || currentUser?.role === 'CLIENT';
  const isEmployee = currentRole === 'EMPLOYEE' || currentRole === 'SERVICE_PERSONNEL' || currentRole === 'FACILITY_MANAGER' || currentUser?.role === 'EMPLOYEE';

  const displayedAMCs = siteAMCs.filter(amc => {
    if (isClient && currentUser) {
      const clientName = currentUser.name?.toLowerCase().trim();
      const clientId = currentUser.id;
      const clientEmail = currentUser.email?.toLowerCase().trim();

      const matchesId = clientId && amc.clientId === clientId;
      const matchesName = clientName && amc.clientName?.toLowerCase().trim() === clientName;
      const matchesEmail = clientEmail && amc.clientEmail?.toLowerCase().trim() === clientEmail;

      return Boolean(matchesId || matchesName || matchesEmail);
    }

    if (isEmployee && currentUser) {
      const empName = currentUser.name?.toLowerCase().trim();
      const empId = currentUser.id;

      const matchesId = empId && amc.assignedEmployeeId === empId;
      const matchesName = empName && amc.assignedEmployeeName?.toLowerCase().trim() === empName;

      return Boolean(matchesId || matchesName);
    }

    return true;
  });

  const fetchAmcData = useCallback(async () => {
    try {
      const [amcRes, usrRes] = await Promise.allSettled([
        fetch('/api/amc').then(r => r.json()),
        fetch('/api/users').then(r => r.json())
      ]);

      if (amcRes.status === 'fulfilled' && amcRes.value?.success) setSiteAMCs(amcRes.value.data);
      if (usrRes.status === 'fulfilled' && usrRes.value?.success) setUsers(usrRes.value.data);
    } catch (err) {
      console.error('Error fetching AMC data:', err);
    }
  }, []);

  useEffect(() => {
    fetchAmcData();
  }, [fetchAmcData]);

  // New AMC Form State
  const [newAmc, setNewAmc] = useState({
    siteName: '',
    clientName: '',
    address: '',
    assignedEmployeeId: '',
    visitDate: new Date().toISOString().slice(0, 10),
    notes: ''
  });

  // Edit AMC Form State
  const [editAmcData, setEditAmcData] = useState({
    siteName: '',
    clientName: '',
    address: '',
    assignedEmployeeId: '',
    visitDate: '',
    status: 'SCHEDULED',
    notes: ''
  });

  const [clientSigner, setClientSigner] = useState('');

  const handleCreateAMC = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/amc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAmc)
      });
      const json = await res.json();
      if (json.success) {
        setShowAMCModal(false);
        setNewAmc({ siteName: '', clientName: '', address: '', assignedEmployeeId: '', visitDate: new Date().toISOString().slice(0, 10), notes: '' });
        fetchAmcData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditAMC = async (e) => {
    e.preventDefault();
    if (!editingAmc) return;
    try {
      const res = await fetch(`/api/amc/${editingAmc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editAmcData)
      });
      const json = await res.json();
      if (json.success) {
        setEditingAmc(null);
        fetchAmcData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAMC = async () => {
    if (!deletingAmc) return;
    try {
      const res = await fetch(`/api/amc/${deletingAmc.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setDeletingAmc(null);
        fetchAmcData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOffSubmit = async (amcId) => {
    try {
      const res = await fetch(`/api/amc/${amcId}/sign-off`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digitalSignOffBy: clientSigner || 'Site Operations Manager' })
      });
      const json = await res.json();
      if (json.success) {
        setSelectedAmcSignOff(null);
        fetchAmcData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner Overview */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>
            Annual Maintenance Contract (AMC) Site Tracker
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Employee-wise site visit schedules, digital checklists, and client sign-off audit records.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAMCModal(true)}>
          <Plus style={{ width: 16, height: 16 }} />
          Schedule Site AMC Visit
        </button>
      </div>

      {/* AMC Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
        {displayedAMCs.map(amc => (
          <div key={amc.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className={`badge ${amc.status === 'COMPLETED' ? 'badge-approved' : 'badge-scheduled'}`}>
                  {amc.status}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  📅 Visit Date: {typeof amc.visitDate === 'string' ? amc.visitDate.slice(0, 10) : new Date(amc.visitDate).toISOString().slice(0, 10)}
                </span>
              </div>

              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                🏢 {amc.siteName}
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--brand-yellow)', fontWeight: 600, marginBottom: '0.5rem' }}>
                Client: {amc.clientName}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                📍 {amc.address}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                <UserCheck style={{ width: 16, height: 16, color: 'var(--brand-green)' }} />
                <span>Assigned Staff: <strong>{amc.assignedEmployeeName}</strong></span>
              </div>

              {/* Digital Checklist Box */}
              {amc.checklists && amc.checklists.length > 0 && (
                <div style={{ background: '#f8fafc', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#d97706', marginBottom: '0.4rem' }}>
                    AMC Compliance Checklist Tasks:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {amc.checklists.map(chk => (
                      <div key={chk.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                        <input type="checkbox" checked={chk.isCompleted} readOnly />
                        <span style={{ color: chk.isCompleted ? 'var(--text-primary)' : 'var(--text-secondary)', textDecoration: chk.isCompleted ? 'line-through' : 'none' }}>
                          {chk.taskName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                  title="Edit AMC Record"
                  onClick={() => {
                    setEditingAmc(amc);
                    setEditAmcData({
                      siteName: amc.siteName || '',
                      clientName: amc.clientName || '',
                      address: amc.address || '',
                      assignedEmployeeId: amc.assignedEmployeeId || '',
                      visitDate: amc.visitDate ? new Date(amc.visitDate).toISOString().slice(0, 10) : '',
                      status: amc.status || 'SCHEDULED',
                      notes: amc.notes || ''
                    });
                  }}
                >
                  <Edit2 size={14} color="var(--brand-primary)" /> Edit
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                  title="Delete AMC Record"
                  onClick={() => setDeletingAmc(amc)}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>

              {amc.status === 'COMPLETED' ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--brand-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileCheck style={{ width: 16, height: 16 }} />
                  Digital Sign-off by: {amc.digitalSignOffBy}
                </div>
              ) : (
                <button className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => setSelectedAmcSignOff(amc)}>
                  <CheckSquare style={{ width: 14, height: 14 }} />
                  Sign-off
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal 1: Schedule Site AMC */}
      {showAMCModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Schedule Site AMC Service Audit
            </h3>
            <form onSubmit={handleCreateAMC} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Site / Facility Name</label>
                <input 
                  className="input-field" 
                  required
                  value={newAmc.siteName}
                  onChange={e => setNewAmc({ ...newAmc, siteName: e.target.value })}
                  placeholder="e.g. Airtel Data Center Newtown"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Organization</label>
                <input 
                  className="input-field" 
                  required
                  value={newAmc.clientName}
                  onChange={e => setNewAmc({ ...newAmc, clientName: e.target.value })}
                  placeholder="e.g. Bharti Airtel Ltd"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Full Address</label>
                <input 
                  className="input-field" 
                  required
                  value={newAmc.address}
                  onChange={e => setNewAmc({ ...newAmc, address: e.target.value })}
                  placeholder="Address in Kolkata / Salt Lake"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assigned Service Staff</label>
                  <select 
                    className="select-field"
                    value={newAmc.assignedEmployeeId}
                    onChange={e => setNewAmc({ ...newAmc, assignedEmployeeId: e.target.value })}
                  >
                    <option value="">Select Service Staff</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Visit Scheduled Date</label>
                  <input 
                    type="date"
                    className="input-field" 
                    value={newAmc.visitDate}
                    onChange={e => setNewAmc({ ...newAmc, visitDate: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAMCModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Visit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 1B: Edit AMC Visit */}
      {editingAmc && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Edit AMC Visit ({editingAmc.siteName})
            </h3>
            <form onSubmit={handleEditAMC} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Site / Facility Name</label>
                <input 
                  className="input-field" 
                  required
                  value={editAmcData.siteName}
                  onChange={e => setEditAmcData({ ...editAmcData, siteName: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Organization</label>
                <input 
                  className="input-field" 
                  required
                  value={editAmcData.clientName}
                  onChange={e => setEditAmcData({ ...editAmcData, clientName: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Address</label>
                <input 
                  className="input-field" 
                  required
                  value={editAmcData.address}
                  onChange={e => setEditAmcData({ ...editAmcData, address: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assigned Staff</label>
                  <select 
                    className="select-field"
                    value={editAmcData.assignedEmployeeId}
                    onChange={e => setEditAmcData({ ...editAmcData, assignedEmployeeId: e.target.value })}
                  >
                    <option value="">Select Assignee</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Scheduled Date</label>
                  <input 
                    type="date"
                    className="input-field" 
                    value={editAmcData.visitDate}
                    onChange={e => setEditAmcData({ ...editAmcData, visitDate: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status</label>
                  <select 
                    className="select-field"
                    value={editAmcData.status}
                    onChange={e => setEditAmcData({ ...editAmcData, status: e.target.value })}
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingAmc(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save AMC Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Digital Sign-off Modal */}
      {selectedAmcSignOff && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Digital Client AMC Sign-off: {selectedAmcSignOff.siteName}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Confirm all compliance checklist tasks are executed before capturing client verification.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Representative Signature / Name</label>
              <input 
                className="input-field"
                required
                placeholder="Enter client manager name (e.g. Dr. S. K. Banerjee)"
                value={clientSigner}
                onChange={e => setClientSigner(e.target.value)}
              />
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px border var(--brand-green)', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--brand-green)', fontWeight: 700 }}>
                ✓ Electronic Audit Stamp will be linked to employee ID #{selectedAmcSignOff.assignedEmployeeId}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedAmcSignOff(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleSignOffSubmit(selectedAmcSignOff.id)}>
                Complete Sign-off
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete AMC Confirmation Modal */}
      {deletingAmc && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f87171' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0 }}>
                Confirm Site AMC Deletion
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete AMC site visit record <strong>{deletingAmc.siteName}</strong> for <strong>{deletingAmc.clientName}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingAmc(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleDeleteAMC}>
                Delete AMC Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
