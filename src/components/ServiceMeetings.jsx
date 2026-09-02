import React, { useState } from 'react';
import { 
  Calendar, 
  UserCheck, 
  FileText, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Send,
  Printer,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

export default function ServiceMeetings({ data, currentRole, onRefresh }) {
  const [activeTab, setActiveTab] = useState('meetings'); // 'meetings' | 'material-requests'
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showMatReqModal, setShowMatReqModal] = useState(false);
  const [selectedMeetingCard, setSelectedMeetingCard] = useState(null);

  // New Meeting Form state
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    clientName: '',
    clientAddress: '',
    assignedToId: 'usr-4',
    agenda: '',
    deliverables: ''
  });

  // New Material Request Form state
  const [newMatReq, setNewMatReq] = useState({
    meetingId: data.meetings[0]?.id || '',
    itemTitle: '',
    quantity: 1,
    unit: 'Pcs',
    justification: '',
    expectedUsage: ''
  });

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMeeting)
      });
      const json = await res.json();
      if (json.success) {
        setShowScheduleModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMaterialRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/material-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMatReq,
          requestedBy: currentRole === 'MASTER_ADMIN' ? 'Master Admin' : 'Sujan Mukhopadhyay (Service Tech)'
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowMatReqModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveMaterialRequest = async (reqId) => {
    try {
      const res = await fetch(`/api/material-requests/${reqId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: currentRole,
          approverName: currentRole === 'MASTER_ADMIN' ? 'Rahul Sharma' : 'Amitabh Roy'
        })
      });
      const json = await res.json();
      if (json.success) {
        onRefresh();
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Actions & Sub-nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button 
            className={`btn ${activeTab === 'meetings' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('meetings')}
          >
            <Calendar style={{ width: 16, height: 16 }} />
            Service Meetings ({data.meetings.length})
          </button>
          <button 
            className={`btn ${activeTab === 'material-requests' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('material-requests')}
          >
            <AlertCircle style={{ width: 16, height: 16 }} />
            Material Requests & Approval Workflow ({data.materialRequests.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowMatReqModal(true)}>
            <Send style={{ width: 16, height: 16, color: 'var(--brand-yellow)' }} />
            Submit Material Request
          </button>
          <button className="btn btn-primary" onClick={() => setShowScheduleModal(true)}>
            <Plus style={{ width: 16, height: 16 }} />
            Schedule New Meeting
          </button>
        </div>
      </div>

      {/* TAB 1: Service Meetings List */}
      {activeTab === 'meetings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
          {data.meetings.map(m => (
            <div key={m.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span className={`badge ${m.status === 'COMPLETED' ? 'badge-approved' : m.status === 'IN_PROGRESS' ? 'badge-pending' : 'badge-scheduled'}`}>
                    {m.status}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(m.scheduledAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  {m.title}
                </h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--brand-yellow)', fontWeight: 600, marginBottom: '0.5rem' }}>
                  🏢 {m.clientName}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  📍 {m.clientAddress}
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.65rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  <strong>Agenda:</strong> {m.agenda}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                  <UserCheck style={{ width: 16, height: 16, color: 'var(--brand-green)' }} />
                  <span>Assigned Personnel: <strong>{m.assignedToName || 'Unassigned'}</strong></span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, fontSize: '0.78rem' }}
                  onClick={() => setSelectedMeetingCard(m)}
                >
                  <FileText style={{ width: 14, height: 14 }} />
                  Generate Meeting Card
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Material Requests & 2-Tier Approval Workflow */}
      {activeTab === 'material-requests' && (
        <div className="glass-card">
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>
              2-Tier Material Request Approval Workflow
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Step 1: Master Admin Review & Approval ➔ Step 2: Facility Manager Approval for Stock Release.
            </p>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Request ID & Item</th>
                <th>Service Job</th>
                <th>Qty</th>
                <th>Justification</th>
                <th>Status Lifecycle</th>
                <th>Approvals Log</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.materialRequests.map(req => (
                <tr key={req.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--brand-yellow)' }}>#{req.id}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{req.itemTitle}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By: {req.requestedBy}</div>
                  </td>
                  <td style={{ fontSize: '0.82rem', maxWidth: 180 }}>{req.meetingTitle}</td>
                  <td><strong>{req.quantity} {req.unit}</strong></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 200 }}>
                    {req.justification}
                  </td>
                  <td>
                    {req.status === 'PENDING_MASTER_ADMIN' && (
                      <span className="badge badge-pending">Stage 1: Pending Master Admin</span>
                    )}
                    {req.status === 'PENDING_FACILITY_MANAGER' && (
                      <span className="badge badge-scheduled">Stage 2: Pending Facility Mgr</span>
                    )}
                    {req.status === 'APPROVED' && (
                      <span className="badge badge-approved">✓ Fully Approved</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.78rem' }}>
                    <div>1. Master Admin: {req.masterAdminApprovedBy || '⏳ Pending'}</div>
                    <div>2. Facility Mgr: {req.facilityManagerApprovedBy || '⏳ Pending'}</div>
                  </td>
                  <td>
                    {req.status === 'PENDING_MASTER_ADMIN' && currentRole === 'MASTER_ADMIN' && (
                      <button className="btn btn-primary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleApproveMaterialRequest(req.id)}>
                        Approve (Master Admin)
                      </button>
                    )}
                    {req.status === 'PENDING_FACILITY_MANAGER' && (currentRole === 'FACILITY_MANAGER' || currentRole === 'MASTER_ADMIN') && (
                      <button className="btn btn-success" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleApproveMaterialRequest(req.id)}>
                        Final Approve (Facility Mgr)
                      </button>
                    )}
                    {req.status === 'APPROVED' && (
                      <span style={{ fontSize: '0.78rem', color: 'var(--brand-green)', fontWeight: 600 }}>Ready for Dispatch</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Schedule Meeting */}
      {showScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Schedule Service Meeting
            </h3>
            <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Meeting Title</label>
                <input 
                  className="input-field" 
                  required
                  value={newMeeting.title}
                  onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  placeholder="e.g. Server Rack Audit & Wiring"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Name</label>
                <input 
                  className="input-field" 
                  required
                  value={newMeeting.clientName}
                  onChange={e => setNewMeeting({ ...newMeeting, clientName: e.target.value })}
                  placeholder="Client Organization Name"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Site Location / Address</label>
                <input 
                  className="input-field" 
                  required
                  value={newMeeting.clientAddress}
                  onChange={e => setNewMeeting({ ...newMeeting, clientAddress: e.target.value })}
                  placeholder="Full address in Kolkata"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assign Service Personnel</label>
                <select 
                  className="select-field"
                  value={newMeeting.assignedToId}
                  onChange={e => setNewMeeting({ ...newMeeting, assignedToId: e.target.value })}
                >
                  {data.users.filter(u => u.role === 'SERVICE_PERSONNEL').map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.designation})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Meeting Agenda</label>
                <textarea 
                  className="input-field" 
                  rows={3}
                  value={newMeeting.agenda}
                  onChange={e => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
                  placeholder="Outline key tasks to perform"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Meeting</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Submit Material Request */}
      {showMatReqModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Submit Material Request for Inventory Team
            </h3>
            <form onSubmit={handleMaterialRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Link to Service Meeting</label>
                <select 
                  className="select-field"
                  value={newMatReq.meetingId}
                  onChange={e => setNewMatReq({ ...newMatReq, meetingId: e.target.value })}
                >
                  {data.meetings.map(m => (
                    <option key={m.id} value={m.id}>{m.title} - ({m.clientName})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Required Item Title</label>
                <input 
                  className="input-field" 
                  required
                  value={newMatReq.itemTitle}
                  onChange={e => setNewMatReq({ ...newMatReq, itemTitle: e.target.value })}
                  placeholder="e.g. D-Link 8-Port POE Switch"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quantity</label>
                  <input 
                    type="number"
                    className="input-field" 
                    required
                    value={newMatReq.quantity}
                    onChange={e => setNewMatReq({ ...newMatReq, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Unit</label>
                  <input 
                    className="input-field" 
                    value={newMatReq.unit}
                    onChange={e => setNewMatReq({ ...newMatReq, unit: e.target.value })}
                    placeholder="Pcs / Meters / Drums"
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Justification & Reason</label>
                <textarea 
                  className="input-field" 
                  rows={2}
                  value={newMatReq.justification}
                  onChange={e => setNewMatReq({ ...newMatReq, justification: e.target.value })}
                  placeholder="Why is this material required for the job?"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMatReqModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Digital Meeting Card View */}
      {selectedMeetingCard && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ border: '2px solid var(--brand-gold)' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--brand-yellow)', fontWeight: 800, letterSpacing: '1px' }}>
                VS DIGITECH TECHNOLOGY • SERVICE MEETING CARD
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800 }}>
                {selectedMeetingCard.title}
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
              <div><strong>Client:</strong> {selectedMeetingCard.clientName}</div>
              <div><strong>Location:</strong> {selectedMeetingCard.clientAddress}</div>
              <div><strong>Assigned Specialist:</strong> {selectedMeetingCard.assignedToName}</div>
              <div><strong>Scheduled Date:</strong> {new Date(selectedMeetingCard.scheduledAt).toLocaleString()}</div>
              
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <strong style={{ color: 'var(--brand-yellow)' }}>Meeting Agenda & Responsibilities:</strong>
                <p style={{ marginTop: '0.35rem', color: 'var(--text-secondary)' }}>{selectedMeetingCard.agenda}</p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <strong style={{ color: 'var(--brand-green)' }}>Expected Deliverables:</strong>
                <p style={{ marginTop: '0.35rem', color: 'var(--text-secondary)' }}>{selectedMeetingCard.deliverables || 'Service log & client sign-off sheet.'}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <Printer style={{ width: 16, height: 16 }} /> Print Card
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedMeetingCard(null)}>
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
