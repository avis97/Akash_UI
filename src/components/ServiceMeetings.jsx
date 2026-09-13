import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from './common/PageHeader';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  PackageOpen, 
  AlertTriangle, 
  Plus, 
  UserCheck, 
  MapPin, 
  FileText,
  Edit3,
  ShieldCheck,
  Trash2,
  X,
  Edit,
  Building,
  CheckCircle2
} from 'lucide-react';

const ServiceMeetings = ({ meetings: initialMeetings = [], materialRequests: initialRequests = [], role = 'SUPERADMIN', onRefresh = () => {}, users: initialUsers = [] }) => {
  const [activeTab, setActiveTab] = useState('meetings');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  const [meetings, setMeetings] = useState(initialMeetings);
  const [materialRequests, setMaterialRequests] = useState(initialRequests);
  const [users, setUsers] = useState(initialUsers);

  // Deletion modals
  const [deletingMeeting, setDeletingMeeting] = useState(null);
  const [deletingMaterialReq, setDeletingMaterialReq] = useState(null);
  const [editingMatReq, setEditingMatReq] = useState(null);

  const fetchMeetingsData = useCallback(async () => {
    try {
      const [mtgRes, matRes, usrRes] = await Promise.allSettled([
        fetch('/api/meetings').then(r => r.json()),
        fetch('/api/material-requests').then(r => r.json()),
        fetch('/api/users').then(r => r.json())
      ]);

      if (mtgRes.status === 'fulfilled' && mtgRes.value?.success) setMeetings(mtgRes.value.data);
      if (matRes.status === 'fulfilled' && matRes.value?.success) setMaterialRequests(matRes.value.data);
      if (usrRes.status === 'fulfilled' && usrRes.value?.success) setUsers(usrRes.value.data);
    } catch (err) {
      console.error('Error fetching meetings data:', err);
    }
  }, []);

  useEffect(() => {
    fetchMeetingsData();
  }, [fetchMeetingsData]);

  const [selectedMeeting, setSelectedMeeting] = useState(null);

  // New Meeting Form State
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    clientName: '',
    clientAddress: '',
    scheduledAt: new Date().toISOString().slice(0, 16),
    assignedToId: '',
    agenda: '',
    deliverables: ''
  });

  // Edit / Update Meeting Form State
  const [updateData, setUpdateData] = useState({
    title: '',
    clientName: '',
    clientAddress: '',
    scheduledAt: '',
    assignedToId: '',
    agenda: '',
    deliverables: '',
    status: 'COMPLETED',
    outcomeNotes: '',
    serviceUpdates: ''
  });

  // Material Request Form State
  const [newMatReq, setNewMatReq] = useState({
    meetingId: '',
    itemTitle: '',
    quantity: 1,
    unit: 'Pcs',
    justification: '',
    expectedUsage: ''
  });

  // Edit Material Request Form State
  const [editMatReqData, setEditMatReqData] = useState({
    itemTitle: '',
    quantity: 1,
    unit: 'Pcs',
    justification: '',
    expectedUsage: '',
    status: 'PENDING_MASTER_ADMIN'
  });

  // Handlers
  const handleScheduleMeeting = async (e) => {
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
        setNewMeeting({
          title: '',
          clientName: '',
          clientAddress: '',
          scheduledAt: new Date().toISOString().slice(0, 16),
          assignedToId: '',
          agenda: '',
          deliverables: ''
        });
        fetchMeetingsData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMeeting = async (e) => {
    e.preventDefault();
    if (!selectedMeeting) return;
    try {
      const res = await fetch(`/api/meetings/${selectedMeeting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      const json = await res.json();
      if (json.success) {
        setShowUpdateModal(false);
        setSelectedMeeting(null);
        fetchMeetingsData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!deletingMeeting) return;
    try {
      const res = await fetch(`/api/meetings/${deletingMeeting.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setDeletingMeeting(null);
        fetchMeetingsData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitMaterialRequest = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/material-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newMatReq,
          requestedBy: role
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowMaterialModal(false);
        setNewMatReq({
          meetingId: '',
          itemTitle: '',
          quantity: 1,
          unit: 'Pcs',
          justification: '',
          expectedUsage: ''
        });
        fetchMeetingsData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMaterialRequest = async (e) => {
    e.preventDefault();
    if (!editingMatReq) return;
    try {
      const res = await fetch(`/api/material-requests/${editingMatReq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editMatReqData)
      });
      const json = await res.json();
      if (json.success) {
        setEditingMatReq(null);
        fetchMeetingsData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMaterialRequest = async () => {
    if (!deletingMaterialReq) return;
    try {
      const res = await fetch(`/api/material-requests/${deletingMaterialReq.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setDeletingMaterialReq(null);
        fetchMeetingsData();
        if (onRefresh) onRefresh();
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
          role,
          approverName: role === 'MASTER_ADMIN' ? 'Master Admin' : 'Facility Manager'
        })
      });
      const json = await res.json();
      if (json.success) {
        fetchMeetingsData();
        if (onRefresh) onRefresh();
      } else {
        alert(json.message || 'Error processing approval');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const pendingMasterAdminCount = materialRequests.filter(r => r.status === 'PENDING_MASTER_ADMIN').length;
  const pendingFacilityCount = materialRequests.filter(r => r.status === 'PENDING_FACILITY_MANAGER').length;

  // Format date helper
  const formatMeetingDate = (dateVal) => {
    if (!dateVal) return 'Not Scheduled';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (e) {
      return String(dateVal);
    }
  };

  // Convert date to datetime-local string format YYYY-MM-THH:mm
  const toDatetimeLocal = (dateVal) => {
    if (!dateVal) return new Date().toISOString().slice(0, 16);
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 16);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
      return localISOTime;
    } catch (e) {
      return new Date().toISOString().slice(0, 16);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PageHeader 
        title="Service Meetings & Material Requests Workflow" 
        breadcrumbs={['Dashboard', 'Service Meetings']} 
      />

      {/* Navigation & Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button 
            className={`btn ${activeTab === 'meetings' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('meetings')}
          >
            <Calendar style={{ width: 16, height: 16 }} />
            Meeting Cards ({meetings.length})
          </button>
          <button 
            className={`btn ${activeTab === 'materials' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('materials')}
          >
            <PackageOpen style={{ width: 16, height: 16 }} />
            Material Requests ({materialRequests.length})
            {role === 'MASTER_ADMIN' && pendingMasterAdminCount > 0 && (
              <span style={{ marginLeft: '8px', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 7px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {pendingMasterAdminCount}
              </span>
            )}
            {role === 'FACILITY_MANAGER' && pendingFacilityCount > 0 && (
              <span style={{ marginLeft: '8px', background: '#eab308', color: 'black', borderRadius: '50%', padding: '2px 7px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {pendingFacilityCount}
              </span>
            )}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowMaterialModal(true)}>
            <PackageOpen style={{ width: 16, height: 16, color: 'var(--brand-yellow)' }} />
            Submit Material Request
          </button>
          <button className="btn btn-primary" onClick={() => setShowScheduleModal(true)}>
            <Plus style={{ width: 16, height: 16 }} />
            Schedule Service Meeting
          </button>
        </div>
      </div>

      {/* TAB 1: Meeting Cards */}
      {activeTab === 'meetings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {meetings.map(m => {
            const isCompleted = m.status === 'COMPLETED' || m.status === 'Completed';
            const isInProgress = m.status === 'IN_PROGRESS' || m.status === 'In Progress';
            const formattedSchedule = formatMeetingDate(m.scheduledAt || m.date);

            return (
              <div 
                key={m.id} 
                className="glass-card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justify: 'space-between', 
                  gap: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div>
                  {/* Top Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#f59e0b', fontSize: '0.9rem', letterSpacing: '0.5px' }}>
                      {m.id}
                    </span>
                    <span className={`badge ${isCompleted ? 'badge-approved' : isInProgress ? 'badge-pending' : 'badge-scheduled'}`} style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                      {m.status ? m.status.replace('_', ' ') : 'SCHEDULED'}
                    </span>
                  </div>

                  {/* Title & Client Name */}
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem', lineHeight: 1.3 }}>
                    {m.title || `Service Visit: ${m.clientName || m.client}`}
                  </h3>
                  
                  <div style={{ fontSize: '0.88rem', color: '#38bdf8', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Building size={15} />
                    <span>Client: {m.clientName || m.client}</span>
                  </div>
                  
                  {m.clientAddress && (
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'flex-start', gap: '0.35rem', marginBottom: '0.85rem' }}>
                      <MapPin size={15} style={{ flexShrink: 0, marginTop: '2px', color: '#f43f5e' }} />
                      <span>{m.clientAddress}</span>
                    </div>
                  )}

                  {/* Scheduled Time & Assignee Highlight Box */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '0.5rem', 
                    fontSize: '0.85rem', 
                    background: 'rgba(30, 41, 59, 0.85)', 
                    padding: '0.85rem 1rem', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(245, 158, 11, 0.3)', 
                    marginBottom: '0.85rem',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: 700 }}>
                      <Calendar size={16} />
                      <span style={{ fontSize: '0.85rem' }}>📅 {formattedSchedule}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 600 }}>
                      <UserCheck size={16} />
                      <span>Assignee: <strong style={{ color: '#ffffff' }}>{m.assignedToName || m.assignee || 'Field Staff'}</strong></span>
                    </div>
                  </div>

                  {m.agenda && (
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '0.65rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.6rem 0.75rem', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                      <strong style={{ color: '#60a5fa' }}>Agenda:</strong> {m.agenda}
                    </div>
                  )}

                  {m.serviceUpdates && (
                    <div style={{ fontSize: '0.8rem', color: '#e2e8f0', background: 'rgba(245, 158, 11, 0.1)', padding: '0.6rem 0.75rem', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
                      <strong style={{ color: '#fbbf24' }}>Real-time Update:</strong> {m.serviceUpdates}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.85rem', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)', borderRadius: '8px', fontWeight: 600 }}
                    onClick={() => setDeletingMeeting(m)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', borderRadius: '8px', fontWeight: 700, backgroundColor: '#f59e0b', borderColor: '#d97706', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={() => {
                      setSelectedMeeting(m);
                      setUpdateData({
                        title: m.title || '',
                        clientName: m.clientName || m.client || '',
                        clientAddress: m.clientAddress || '',
                        scheduledAt: toDatetimeLocal(m.scheduledAt || m.date),
                        assignedToId: m.assignedToId || '',
                        agenda: m.agenda || '',
                        deliverables: m.deliverables || '',
                        status: m.status || 'SCHEDULED',
                        outcomeNotes: m.outcomeNotes || '',
                        serviceUpdates: m.serviceUpdates || ''
                      });
                      setShowUpdateModal(true);
                    }}
                  >
                    <Edit3 size={15} /> Edit Schedule & Notes
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Material Requests Workflow */}
      {activeTab === 'materials' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PackageOpen size={20} /> 2-Tier Material Request Approval Workflow
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Stage 1: Master Admin of Inventory ➔ Stage 2: Facility Manager Approval
            </span>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Request Ref</th>
                <th>Meeting Ref</th>
                <th>Requested Material</th>
                <th>Qty & Unit</th>
                <th>Justification & Usage</th>
                <th>Stage 1: Master Admin</th>
                <th>Stage 2: Facility Manager</th>
                <th>Workflow Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {materialRequests.map(r => {
                const isMasterApproved = r.status === 'PENDING_FACILITY_MANAGER' || r.status === 'APPROVED';
                const isFinalApproved = r.status === 'APPROVED';

                return (
                  <tr key={r.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-yellow)' }}>
                        {r.id}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
                        {r.meetingTitle || r.meetingId}
                      </span>
                    </td>
                    <td><strong>{r.itemTitle}</strong></td>
                    <td>{r.quantity} {r.unit}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 200 }}>
                      <div>{r.justification}</div>
                      {r.expectedUsage && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Usage: {r.expectedUsage}</div>}
                    </td>
                    <td>
                      {isMasterApproved ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontWeight: 600, fontSize: '0.8rem' }}>
                          <CheckCircle size={14} /> Approved
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#eab308', fontWeight: 600, fontSize: '0.8rem' }}>
                          <Clock size={14} /> Pending Step 1
                        </span>
                      )}
                    </td>
                    <td>
                      {isFinalApproved ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontWeight: 600, fontSize: '0.8rem' }}>
                          <CheckCircle size={14} /> Approved Work
                        </span>
                      ) : isMasterApproved ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#eab308', fontWeight: 600, fontSize: '0.8rem' }}>
                          <AlertTriangle size={14} /> Pending Step 2
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Waiting Step 1</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${isFinalApproved ? 'badge-approved' : 'badge-pending'}`}>
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        {r.status === 'PENDING_MASTER_ADMIN' && (role === 'MASTER_ADMIN' || role === 'SUPERADMIN') && (
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            onClick={() => handleApproveMaterialRequest(r.id)}
                          >
                            <ShieldCheck size={14} /> Step 1
                          </button>
                        )}
                        {r.status === 'PENDING_FACILITY_MANAGER' && (role === 'FACILITY_MANAGER' || role === 'SUPERADMIN') && (
                          <button 
                            className="btn btn-primary" 
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', backgroundColor: '#10b981' }}
                            onClick={() => handleApproveMaterialRequest(r.id)}
                          >
                            <CheckCircle size={14} /> Step 2
                          </button>
                        )}
                        <button 
                          className="btn btn-secondary"
                          title="Edit Material Request"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => {
                            setEditingMatReq(r);
                            setEditMatReqData({
                              itemTitle: r.itemTitle || '',
                              quantity: r.quantity || 1,
                              unit: r.unit || 'Pcs',
                              justification: r.justification || '',
                              expectedUsage: r.expectedUsage || '',
                              status: r.status || 'PENDING_MASTER_ADMIN'
                            });
                          }}
                        >
                          <Edit size={14} color="var(--brand-primary)" />
                        </button>
                        <button 
                          className="btn btn-secondary"
                          title="Delete Material Request"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                          onClick={() => setDeletingMaterialReq(r)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Schedule Service Meeting */}
      {showScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Schedule Service Meeting & Assign Personnel
            </h3>
            <form onSubmit={handleScheduleMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Meeting Title</label>
                <input 
                  className="input-field" 
                  required
                  placeholder="e.g. Field Inspection & Maintenance Audit"
                  value={newMeeting.title}
                  onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Name</label>
                  <input 
                    className="input-field" 
                    required
                    placeholder="e.g. Tata Consultancy Services"
                    value={newMeeting.clientName}
                    onChange={e => setNewMeeting({ ...newMeeting, clientName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Address / Site</label>
                  <input 
                    className="input-field" 
                    required
                    placeholder="e.g. Sector V, Salt Lake, Kolkata"
                    value={newMeeting.clientAddress}
                    onChange={e => setNewMeeting({ ...newMeeting, clientAddress: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Scheduled Date & Time</label>
                  <input 
                    type="datetime-local"
                    className="input-field" 
                    required
                    value={newMeeting.scheduledAt}
                    onChange={e => setNewMeeting({ ...newMeeting, scheduledAt: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assign Service Personnel</label>
                  <select 
                    className="select-field"
                    value={newMeeting.assignedToId}
                    onChange={e => setNewMeeting({ ...newMeeting, assignedToId: e.target.value })}
                  >
                    <option value="">Select Service Personnel</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Agenda & Description</label>
                <textarea 
                  className="input-field" 
                  rows={2}
                  value={newMeeting.agenda}
                  onChange={e => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
                  placeholder="Outline meeting goals..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Meeting Card</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Service Meeting (Including Time Schedule Editing) */}
      {showUpdateModal && selectedMeeting && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                Edit Service Meeting ({selectedMeeting.id})
              </h3>
              <button 
                type="button" 
                onClick={() => setShowUpdateModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Meeting Title</label>
                  <input 
                    className="input-field" 
                    required
                    value={updateData.title}
                    onChange={e => setUpdateData({ ...updateData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Client Name</label>
                  <input 
                    className="input-field" 
                    required
                    value={updateData.clientName}
                    onChange={e => setUpdateData({ ...updateData, clientName: e.target.value })}
                  />
                </div>
              </div>

              {/* Scheduled Date & Time Edit Field */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(245, 158, 11, 0.1)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '4px' }}>
                    <Calendar size={15} /> Scheduled Date & Time
                  </label>
                  <input 
                    type="datetime-local"
                    className="input-field" 
                    required
                    style={{ borderColor: '#f59e0b', fontWeight: 600 }}
                    value={updateData.scheduledAt}
                    onChange={e => setUpdateData({ ...updateData, scheduledAt: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '4px' }}>
                    <UserCheck size={15} /> Assigned Staff
                  </label>
                  <select 
                    className="select-field"
                    value={updateData.assignedToId}
                    onChange={e => setUpdateData({ ...updateData, assignedToId: e.target.value })}
                  >
                    <option value="">Select Assignee</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Client Address</label>
                  <input 
                    className="input-field" 
                    value={updateData.clientAddress}
                    onChange={e => setUpdateData({ ...updateData, clientAddress: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Current Meeting Status</label>
                  <select 
                    className="select-field"
                    value={updateData.status}
                    onChange={e => setUpdateData({ ...updateData, status: e.target.value })}
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Meeting Agenda & Description</label>
                <textarea 
                  className="input-field" 
                  rows={2}
                  value={updateData.agenda}
                  onChange={e => setUpdateData({ ...updateData, agenda: e.target.value })}
                  placeholder="Outline meeting goals..."
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Real-time Service Progress Update</label>
                <textarea 
                  className="input-field" 
                  rows={2}
                  value={updateData.serviceUpdates}
                  onChange={e => setUpdateData({ ...updateData, serviceUpdates: e.target.value })}
                  placeholder="Field inspection details..."
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Outcome Notes & Deliverables Summary</label>
                <textarea 
                  className="input-field" 
                  rows={2}
                  value={updateData.outcomeNotes}
                  onChange={e => setUpdateData({ ...updateData, outcomeNotes: e.target.value })}
                  placeholder="Final deliverables or recommendations..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUpdateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#f59e0b', borderColor: '#d97706', fontWeight: 700 }}>
                  Save Meeting Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Submit Material Request */}
      {showMaterialModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Submit Material Request for Inventory Team
            </h3>
            <form onSubmit={handleSubmitMaterialRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Link to Service Meeting</label>
                <select 
                  className="select-field"
                  required
                  value={newMatReq.meetingId}
                  onChange={e => setNewMatReq({ ...newMatReq, meetingId: e.target.value })}
                >
                  <option value="">Select Service Meeting</option>
                  {meetings.map(m => (
                    <option key={m.id} value={m.id}>{m.id} - {m.clientName || m.client} ({m.title})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Material / Item Description</label>
                  <input 
                    className="input-field" 
                    required
                    placeholder="e.g. Copper Wire Coil 50m"
                    value={newMatReq.itemTitle}
                    onChange={e => setNewMatReq({ ...newMatReq, itemTitle: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quantity</label>
                  <input 
                    type="number"
                    min="1"
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
                    required
                    value={newMatReq.unit}
                    onChange={e => setNewMatReq({ ...newMatReq, unit: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Justification for Request</label>
                <textarea 
                  className="input-field" 
                  rows={2}
                  required
                  value={newMatReq.justification}
                  onChange={e => setNewMatReq({ ...newMatReq, justification: e.target.value })}
                  placeholder="Explain why materials are required for the job..."
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Expected Usage Details</label>
                <input 
                  className="input-field" 
                  value={newMatReq.expectedUsage}
                  onChange={e => setNewMatReq({ ...newMatReq, expectedUsage: e.target.value })}
                  placeholder="e.g. Replacement of faulty main line during HVAC service"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMaterialModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit for Approval Workflow</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Edit Material Request */}
      {editingMatReq && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Edit Material Request #{editingMatReq.id}
            </h3>
            <form onSubmit={handleUpdateMaterialRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Material Title</label>
                  <input 
                    className="input-field" 
                    required
                    value={editMatReqData.itemTitle}
                    onChange={e => setEditMatReqData({ ...editMatReqData, itemTitle: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quantity</label>
                  <input 
                    type="number"
                    min="1"
                    className="input-field" 
                    required
                    value={editMatReqData.quantity}
                    onChange={e => setEditMatReqData({ ...editMatReqData, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Unit</label>
                  <input 
                    className="input-field" 
                    required
                    value={editMatReqData.unit}
                    onChange={e => setEditMatReqData({ ...editMatReqData, unit: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Justification</label>
                <textarea 
                  className="input-field" 
                  rows={2}
                  required
                  value={editMatReqData.justification}
                  onChange={e => setEditMatReqData({ ...editMatReqData, justification: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status</label>
                <select 
                  className="select-field"
                  value={editMatReqData.status}
                  onChange={e => setEditMatReqData({ ...editMatReqData, status: e.target.value })}
                >
                  <option value="PENDING_MASTER_ADMIN">PENDING MASTER ADMIN</option>
                  <option value="PENDING_FACILITY_MANAGER">PENDING FACILITY MANAGER</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingMatReq(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Meeting Confirmation Modal */}
      {deletingMeeting && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f87171' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0 }}>
                Confirm Meeting Deletion
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete service meeting <strong>{deletingMeeting.title || deletingMeeting.id}</strong> for <strong>{deletingMeeting.clientName}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingMeeting(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleDeleteMeeting}>
                Delete Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Material Request Confirmation Modal */}
      {deletingMaterialReq && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f87171' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0 }}>
                Confirm Material Request Deletion
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete material request <strong>{deletingMaterialReq.itemTitle}</strong> (#{deletingMaterialReq.id})?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingMaterialReq(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleDeleteMaterialRequest}>
                Delete Request
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ServiceMeetings;
