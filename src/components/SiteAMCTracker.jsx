import React, { useState } from 'react';
import { 
  CheckSquare, 
  Calendar, 
  UserCheck, 
  Plus, 
  CheckCircle, 
  FileCheck,
  Building,
  Award
} from 'lucide-react';

export default function SiteAMCTracker({ data, currentRole, onRefresh }) {
  const [showAMCModal, setShowAMCModal] = useState(false);
  const [selectedAmcSignOff, setSelectedAmcSignOff] = useState(null);

  // New AMC Form State
  const [newAmc, setNewAmc] = useState({
    siteName: '',
    clientName: '',
    address: '',
    assignedEmployeeId: 'usr-4',
    visitDate: '2026-09-15',
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
        onRefresh();
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
        onRefresh();
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {data.siteAMCs.map(amc => (
          <div key={amc.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className={`badge ${amc.status === 'COMPLETED' ? 'badge-approved' : 'badge-scheduled'}`}>
                  {amc.status}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  📅 Visit Date: {amc.visitDate}
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
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--brand-yellow)', marginBottom: '0.4rem' }}>
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
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              {amc.status === 'COMPLETED' ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--brand-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileCheck style={{ width: 16, height: 16 }} />
                  Digital Sign-off by: {amc.digitalSignOffBy}
                </div>
              ) : (
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setSelectedAmcSignOff(amc)}>
                  <CheckSquare style={{ width: 16, height: 16 }} />
                  Perform Digital Sign-off
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
                    {data.users.filter(u => u.role === 'SERVICE_PERSONNEL').map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
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

    </div>
  );
}
