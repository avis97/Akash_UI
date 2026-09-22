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
  CheckCircle2,
  Camera,
  Upload,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';

const BRANCH_OPTIONS = [
  'Main Branch - Kolkata',
  'Corporate HQ',
  'Sector V Tech Office',
  'Delhi Regional Office',
  'Mumbai Operations',
  'Bengaluru Hub'
];

const DEPARTMENT_OPTIONS = [
  'Field Engineering & Support',
  'IT & Network Operations',
  'HVAC & Facilities',
  'Electrical & Automation',
  'General Maintenance',
  'Quality Audit'
];

const PROJECT_OPTIONS = [
  'AMC Inspection & Maintenance',
  'Network Infrastructure Upgrade',
  'CCTV & Security Systems',
  'Biometric Access Control',
  'HVAC Audit Project',
  'Routine Safety Inspection'
];

const ServiceMeetings = ({ meetings: initialMeetings = [], materialRequests: initialRequests = [], role = 'SUPERADMIN', currentUser, onRefresh = () => {}, users: initialUsers = [], projects: initialProjects = [] }) => {
  const [activeTab, setActiveTab] = useState('meetings');
  const [meetingFilter, setMeetingFilter] = useState((role === 'EMPLOYEE' || currentUser?.role === 'EMPLOYEE') ? 'my' : 'all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  const [meetings, setMeetings] = useState(initialMeetings);
  const [materialRequests, setMaterialRequests] = useState(initialRequests);
  const [users, setUsers] = useState(initialUsers);
  const [projects, setProjects] = useState(initialProjects);

  // Sync prop updates if parent passes new data
  useEffect(() => {
    if (initialProjects && initialProjects.length > 0) setProjects(initialProjects);
  }, [initialProjects]);

  // Deletion modals
  const [deletingMeeting, setDeletingMeeting] = useState(null);
  const [deletingMaterialReq, setDeletingMaterialReq] = useState(null);
  const [editingMatReq, setEditingMatReq] = useState(null);

  // Filter meetings assigned to currently logged-in employee/user
  const myMeetings = meetings.filter(m => {
    if (!currentUser) return false;
    return m.assignedToId === currentUser.id ||
           (m.assignedToName && currentUser.name && m.assignedToName.toLowerCase().trim() === currentUser.name.toLowerCase().trim()) ||
           (m.assignedTo?.email && currentUser.email && m.assignedTo.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim());
  });

  const displayedMeetings = (meetingFilter === 'my' && (currentUser || role === 'EMPLOYEE')) ? myMeetings : meetings;

  // Derived Client and Employee Lists for selection
  const registeredClients = users.filter(u => u.role === 'CLIENT' || u.role === 'USER');
  const employeeUsers = users.filter(u => u.role !== 'CLIENT' && u.role !== 'USER');
  const availableEmployees = employeeUsers.length > 0 ? employeeUsers : users;

  const fetchMeetingsData = useCallback(async () => {
    try {
      const [mtgRes, matRes, usrRes, prjRes] = await Promise.allSettled([
        fetch('/api/meetings').then(r => r.json()),
        fetch('/api/material-requests').then(r => r.json()),
        fetch('/api/users').then(r => r.json()),
        fetch('/api/projects').then(r => r.json())
      ]);

      if (mtgRes.status === 'fulfilled' && mtgRes.value?.success) setMeetings(mtgRes.value.data);
      if (matRes.status === 'fulfilled' && matRes.value?.success) setMaterialRequests(matRes.value.data);
      if (usrRes.status === 'fulfilled' && usrRes.value?.success) setUsers(usrRes.value.data);
      if (prjRes.status === 'fulfilled' && prjRes.value?.success) setProjects(prjRes.value.data);
    } catch (err) {
      console.error('Error fetching meetings data:', err);
    }
  }, []);

  useEffect(() => {
    fetchMeetingsData();
  }, [fetchMeetingsData]);

  const [selectedMeeting, setSelectedMeeting] = useState(null);

  // Camera & Photo Upload States
  const cameraVideoRef = React.useRef(null);
  const [cameraModalTarget, setCameraModalTarget] = useState(null); // 'schedule' | 'update' | null
  const [activeStream, setActiveStream] = useState(null);
  const [viewingPhoto, setViewingPhoto] = useState(null);

  // New Meeting Form State
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    branch: '',
    department: '',
    project: '',
    clientName: '',
    clientAddress: '',
    location: '',
    meetingFeedback: '',
    photos: [],
    scheduledAt: new Date().toISOString().slice(0, 16),
    assignedToId: '',
    agenda: '',
    deliverables: '',
    status: 'SCHEDULED'
  });

  // Edit / Update Meeting Form State
  const [updateData, setUpdateData] = useState({
    title: '',
    branch: '',
    department: '',
    project: '',
    clientName: '',
    clientAddress: '',
    location: '',
    meetingFeedback: '',
    photos: [],
    scheduledAt: '',
    assignedToId: '',
    agenda: '',
    deliverables: '',
    status: 'COMPLETED',
    outcomeNotes: '',
    serviceUpdates: ''
  });

  // Camera Capture & File Upload Handlers
  const startCamera = async (target) => {
    setCameraModalTarget(target);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setActiveStream(stream);
      setTimeout(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
        }
      }, 200);
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Unable to access camera. Please allow camera permissions in your browser or check device connection.');
      setCameraModalTarget(null);
    }
  };

  const stopCamera = () => {
    if (activeStream) {
      activeStream.getTracks().forEach(track => track.stop());
      setActiveStream(null);
    }
    setCameraModalTarget(null);
  };

  const snapPhoto = (target) => {
    if (!cameraVideoRef.current) return;
    const video = cameraVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    if (target === 'schedule') {
      setNewMeeting(prev => ({
        ...prev,
        photos: [...(prev.photos || []), dataUrl]
      }));
    } else if (target === 'update') {
      setUpdateData(prev => ({
        ...prev,
        photos: [...(prev.photos || []), dataUrl]
      }));
    }
    stopCamera();
  };

  const handleFileUpload = (e, target) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        if (target === 'schedule') {
          setNewMeeting(prev => ({
            ...prev,
            photos: [...(prev.photos || []), dataUrl]
          }));
        } else if (target === 'update') {
          setUpdateData(prev => ({
            ...prev,
            photos: [...(prev.photos || []), dataUrl]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Material Request Form State
  const [newMatReq, setNewMatReq] = useState({
    subject: '',
    requestedForUserId: '',
    requestedForUserName: '',
    priority: 'Low',
    status: 'Open',
    endDate: '',
    description: '',
    attachmentUrl: '',
    meetingId: '',
    itemTitle: '',
    quantity: 1,
    unit: 'Pcs',
    justification: '',
    expectedUsage: ''
  });

  // Edit Material Request Form State
  const [editMatReqData, setEditMatReqData] = useState({
    subject: '',
    requestedForUserId: '',
    requestedForUserName: '',
    priority: 'Low',
    status: 'Open',
    endDate: '',
    description: '',
    attachmentUrl: '',
    meetingId: '',
    itemTitle: '',
    quantity: 1,
    unit: 'Pcs',
    justification: '',
    expectedUsage: ''
  });

  // AI Material Request Auto-Fill Generator
  const handleGenerateAIMaterialRequest = () => {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const defaultDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    setNewMatReq({
      subject: 'Urgent Maintenance Materials Supply',
      requestedForUserId: randomUser?.id || '',
      requestedForUserName: randomUser?.name || 'Alok Naiya',
      priority: 'High',
      status: 'Open',
      endDate: defaultDate,
      description: 'Requesting urgent material supply for field installation, replacement of damaged cable lines, and POE switches.',
      attachmentUrl: '',
      meetingId: meetings[0]?.id || '',
      itemTitle: 'Cat6 Network Cable & POE Switch',
      quantity: 2,
      unit: 'Units',
      justification: 'Critical site maintenance required during scheduled client service visit.',
      expectedUsage: 'On-site hardware replacement'
    });
  };

  const handleMatAttachmentUpload = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditMatReqData(prev => ({ ...prev, attachmentUrl: reader.result }));
        } else {
          setNewMatReq(prev => ({ ...prev, attachmentUrl: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handlers
  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newMeeting,
        assignedToId: newMeeting.assignedToId || null
      };
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setShowScheduleModal(false);
        setNewMeeting({
          title: '',
          branch: '',
          department: '',
          project: '',
          clientName: '',
          clientAddress: '',
          location: '',
          meetingFeedback: '',
          photos: [],
          scheduledAt: new Date().toISOString().slice(0, 16),
          assignedToId: '',
          agenda: '',
          deliverables: '',
          status: 'SCHEDULED'
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
      const payload = {
        ...updateData,
        assignedToId: updateData.assignedToId || null
      };
      const res = await fetch(`/api/meetings/${selectedMeeting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setShowUpdateModal(false);
        setSelectedMeeting(null);
        fetchMeetingsData();
        if (onRefresh) onRefresh();
      } else {
        alert(json.message || 'Failed to update meeting');
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
          subject: '',
          requestedForUserId: '',
          requestedForUserName: '',
          priority: 'Low',
          status: 'Open',
          endDate: '',
          description: '',
          attachmentUrl: '',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <PageHeader 
        title="Service Meetings & Material Requests Workflow" 
        breadcrumbs={['Dashboard', 'Service Meetings']} 
      />

      {/* Navigation, Filter & Action Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', background: '#ffffff', padding: '0.45rem 0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        {/* Left: Tab switchers & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem' }}>
          <div style={{ display: 'flex', gap: '0.2rem', background: '#f1f5f9', padding: '0.18rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <button 
              className={`btn ${activeTab === 'meetings' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              onClick={() => setActiveTab('meetings')}
            >
              <Calendar style={{ width: 14, height: 14 }} />
              Meeting Cards ({meetings.length})
            </button>
            <button 
              className={`btn ${activeTab === 'materials' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              onClick={() => setActiveTab('materials')}
            >
              <PackageOpen style={{ width: 14, height: 14 }} />
              Material Requests ({materialRequests.length})
              {role === 'MASTER_ADMIN' && pendingMasterAdminCount > 0 && (
                <span style={{ marginLeft: '4px', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '1px 5px', fontSize: '0.68rem', fontWeight: 'bold' }}>
                  {pendingMasterAdminCount}
                </span>
              )}
              {role === 'FACILITY_MANAGER' && pendingFacilityCount > 0 && (
                <span style={{ marginLeft: '4px', background: '#eab308', color: 'black', borderRadius: '50%', padding: '1px 5px', fontSize: '0.68rem', fontWeight: 'bold' }}>
                  {pendingFacilityCount}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'meetings' && (
            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', borderLeft: '1px solid #cbd5e1', paddingLeft: '0.65rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Filter:</span>
              <button 
                className={`btn ${meetingFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                onClick={() => setMeetingFilter('all')}
              >
                All ({meetings.length})
              </button>
              <button 
                className={`btn ${meetingFilter === 'my' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                onClick={() => setMeetingFilter('my')}
              >
                <UserCheck size={12} />
                My Assigned ({myMeetings.length})
              </button>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', gap: '0.45rem' }}>
          <button className="btn btn-secondary" style={{ padding: '0.28rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => setShowMaterialModal(true)}>
            <PackageOpen style={{ width: 14, height: 14, color: 'var(--brand-yellow)' }} />
            Submit Material Request
          </button>
          <button className="btn btn-primary" style={{ padding: '0.28rem 0.7rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => setShowScheduleModal(true)}>
            <Plus style={{ width: 14, height: 14 }} />
            Schedule Service Meeting
          </button>
        </div>
      </div>

      {/* TAB 1: Meeting Cards */}
      {activeTab === 'meetings' && (
        <>
          {meetingFilter === 'my' && (
            <div style={{ fontSize: '0.75rem', color: '#059669', background: 'rgba(16, 185, 129, 0.08)', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)', fontWeight: 600, width: 'fit-content', marginTop: '0.15rem' }}>
              Viewing meetings assigned to <strong>{currentUser?.name || 'you'}</strong>
            </div>
          )}

          {displayedMeetings.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Calendar size={40} style={{ margin: '0 auto 0.75rem auto', color: '#f59e0b', opacity: 0.7 }} />
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Service Meetings Found</h4>
              <p style={{ fontSize: '0.88rem', margin: 0 }}>
                {meetingFilter === 'my' 
                  ? 'You currently have no meetings assigned to your account. Switch to "All Meetings" to view all organization schedules.'
                  : 'No service meetings have been scheduled yet.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
              {displayedMeetings.map(m => {
                const isCompleted = m.status === 'COMPLETED' || m.status === 'Completed';
                const isInProgress = m.status === 'IN_PROGRESS' || m.status === 'In Progress';
                const formattedSchedule = formatMeetingDate(m.scheduledAt || m.date);
                const isAssignedToCurrentUser = currentUser && (
                  m.assignedToId === currentUser.id ||
                  (m.assignedToName && m.assignedToName.toLowerCase().trim() === currentUser.name.toLowerCase().trim()) ||
                  (m.assignedTo?.email && m.assignedTo.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim())
                );

                return (
                  <div 
                    key={m.id} 
                    className="glass-card" 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between', 
                      gap: '0.65rem',
                      border: isAssignedToCurrentUser ? '1.5px solid #22c55e' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      background: '#ffffff',
                      boxShadow: isAssignedToCurrentUser ? '0 6px 18px -4px rgba(34, 197, 94, 0.15)' : '0 2px 10px -2px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.25s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      padding: '0.85rem 0.95rem'
                    }}
                  >
                    <div>
                      {/* Top Header Bar with ID & Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                        <span 
                          style={{ 
                            fontSize: '0.68rem', 
                            fontFamily: 'monospace', 
                            color: '#64748b', 
                            background: '#f1f5f9', 
                            padding: '0.15rem 0.45rem', 
                            borderRadius: '5px', 
                            fontWeight: 600, 
                            border: '1px solid #e2e8f0',
                            letterSpacing: '0.2px'
                          }} 
                          title={`Meeting ID: ${m.id}`}
                        >
                          #{m.id.length > 10 ? m.id.substring(0, 7) + '...' : m.id}
                        </span>

                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                          {isAssignedToCurrentUser && (
                            <span 
                              className="badge" 
                              style={{ 
                                background: '#22c55e', 
                                color: '#ffffff', 
                                fontWeight: 700, 
                                fontSize: '0.65rem', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.2rem',
                                padding: '0.15rem 0.45rem',
                                borderRadius: '9999px',
                                boxShadow: '0 2px 5px rgba(34, 197, 94, 0.25)'
                              }}
                            >
                              <CheckCircle2 size={10} /> Assigned
                            </span>
                          )}
                          <span 
                            style={{ 
                              textTransform: 'uppercase', 
                              fontWeight: 700, 
                              fontSize: '0.65rem', 
                              letterSpacing: '0.4px',
                              padding: '0.18rem 0.5rem',
                              borderRadius: '9999px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              background: isCompleted ? 'rgba(34, 197, 94, 0.12)' : isInProgress ? 'rgba(245, 158, 11, 0.12)' : 'rgba(6, 182, 212, 0.12)',
                              color: isCompleted ? '#15803d' : isInProgress ? '#b45309' : '#0891b2',
                              border: `1px solid ${isCompleted ? 'rgba(34, 197, 94, 0.3)' : isInProgress ? 'rgba(245, 158, 11, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`
                            }}
                          >
                            <span style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              background: isCompleted ? '#22c55e' : isInProgress ? '#f59e0b' : '#06b6d4',
                              display: 'inline-block'
                            }}></span>
                            {m.status ? m.status.replace('_', ' ') : 'SCHEDULED'}
                          </span>
                        </div>
                      </div>

                      {/* Title & Client Name */}
                      <h3 style={{ fontFamily: 'var(--font-heading, sans-serif)', fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem', lineHeight: 1.3 }}>
                        {m.title || `Service Visit: ${m.clientName || m.client}`}
                      </h3>
                      
                      <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Building size={13} style={{ color: '#0284c7', flexShrink: 0 }} />
                        <span>Client: <strong style={{ color: '#0369a1' }}>{m.clientName || m.client}</strong></span>
                      </div>
                      
                      {m.clientAddress && (
                        <div style={{ fontSize: '0.74rem', color: '#64748b', display: 'flex', alignItems: 'flex-start', gap: '0.3rem', marginBottom: '0.25rem' }}>
                          <MapPin size={12} style={{ flexShrink: 0, marginTop: '2px', color: '#ef4444' }} />
                          <span>{m.clientAddress}</span>
                        </div>
                      )}

                      {/* Custom Location */}
                      {m.location && (
                        <div style={{ fontSize: '0.74rem', color: '#0369a1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem' }}>
                          <MapPin size={12} style={{ color: '#0284c7', flexShrink: 0 }} />
                          <span>Location: {m.location}</span>
                        </div>
                      )}

                      {/* Branch, Department & Project Badges */}
                      {(m.branch || m.department || m.project) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.35rem', marginBottom: '0.5rem' }}>
                          {m.branch && (
                            <span style={{ background: '#f8fafc', color: '#475569', fontSize: '0.68rem', fontWeight: 600, border: '1px solid #e2e8f0', padding: '0.15rem 0.45rem', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              📍 {m.branch}
                            </span>
                          )}
                          {m.department && (
                            <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '0.68rem', fontWeight: 600, border: '1px solid #bfdbfe', padding: '0.15rem 0.45rem', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              🏢 {m.department}
                            </span>
                          )}
                          {m.project && (
                            <span style={{ background: '#f0fdf4', color: '#15803d', fontSize: '0.68rem', fontWeight: 600, border: '1px solid #bbf7d0', padding: '0.15rem 0.45rem', borderRadius: '5px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              🚀 {m.project}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Scheduled Time & Assignee Highlight Box */}
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.35rem', 
                        fontSize: '0.76rem', 
                        background: '#f8fafc', 
                        padding: '0.5rem 0.7rem', 
                        borderRadius: '8px', 
                        border: '1px solid #e2e8f0', 
                        marginBottom: '0.5rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#1e293b', fontWeight: 600 }}>
                          <Clock size={13} style={{ color: '#16a34a', flexShrink: 0 }} />
                          <span>Schedule: <strong style={{ color: '#0f172a', fontWeight: 700 }}>{formattedSchedule}</strong></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#1e293b', fontWeight: 600 }}>
                          <UserCheck size={13} style={{ color: '#16a34a', flexShrink: 0 }} />
                          <span>Assignee: <strong style={{ color: '#0f172a', fontWeight: 700 }}>{m.assignedToName || m.assignee || 'Field Staff'}</strong></span>
                        </div>
                      </div>

                      {/* Agenda */}
                      {m.agenda && (
                        <div style={{ fontSize: '0.76rem', color: '#0369a1', marginBottom: '0.45rem', background: '#f0f9ff', padding: '0.45rem 0.65rem', borderRadius: '8px', borderLeft: '3px solid #0284c7' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, color: '#0284c7', marginBottom: '0.1rem' }}>
                            <FileText size={12} /> Agenda
                          </div>
                          <div style={{ wordBreak: 'break-word' }}>{m.agenda}</div>
                        </div>
                      )}

                      {/* Meeting Feedback */}
                      {m.meetingFeedback && (
                        <div style={{ fontSize: '0.76rem', color: '#15803d', marginBottom: '0.45rem', background: '#f0fdf4', padding: '0.45rem 0.65rem', borderRadius: '8px', borderLeft: '3px solid #22c55e' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, color: '#166534', marginBottom: '0.1rem' }}>
                            <MessageSquare size={12} /> Meeting Feedback
                          </div>
                          <div style={{ wordBreak: 'break-word' }}>{m.meetingFeedback}</div>
                        </div>
                      )}

                      {/* Attached Photos Gallery */}
                      {(() => {
                        let photoList = [];
                        try {
                          if (Array.isArray(m.photos)) photoList = m.photos;
                          else if (typeof m.photos === 'string' && m.photos.trim().startsWith('[')) photoList = JSON.parse(m.photos);
                          else if (typeof m.photos === 'string' && m.photos.length > 0) photoList = [m.photos];
                        } catch (e) {}

                        if (photoList.length === 0) return null;

                        return (
                          <div style={{ marginBottom: '0.45rem', background: '#f8fafc', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Camera size={12} color="#16a34a" /> Attached Photos ({photoList.length}):
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {photoList.map((pUrl, idx) => (
                                <img 
                                  key={idx} 
                                  src={pUrl} 
                                  alt={`Meeting Photo ${idx+1}`} 
                                  style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', cursor: 'pointer', border: '1px solid #cbd5e1', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'transform 0.15s ease' }}
                                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                  onClick={() => setViewingPhoto(pUrl)}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Real-time Service Updates */}
                      {m.serviceUpdates && (
                        <div style={{ fontSize: '0.76rem', color: '#92400e', background: '#fffbeb', padding: '0.45rem 0.65rem', borderRadius: '8px', borderLeft: '3px solid #f59e0b', marginBottom: '0.45rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, color: '#b45309', marginBottom: '0.1rem' }}>
                            <Clock size={12} /> Real-time Update
                          </div>
                          <div style={{ wordBreak: 'break-word' }}>{m.serviceUpdates}</div>
                        </div>
                      )}
                    </div>

                    {/* Card Action Buttons */}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.6rem', display: 'flex', justifyContent: 'flex-end', gap: '0.45rem' }}>
                      <button 
                        className="btn" 
                        style={{ 
                          padding: '0.35rem 0.65rem', 
                          fontSize: '0.76rem', 
                          color: '#dc2626', 
                          border: '1px solid #fecaca', 
                          background: '#fef2f2', 
                          borderRadius: '8px', 
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#dc2626';
                          e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#fef2f2';
                          e.currentTarget.style.color = '#dc2626';
                        }}
                        onClick={() => setDeletingMeeting(m)}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                      <button 
                        className="btn" 
                        style={{ 
                          padding: '0.38rem 0.75rem', 
                          fontSize: '0.78rem', 
                          borderRadius: '8px', 
                          fontWeight: 700, 
                          background: 'linear-gradient(135deg, #22c55e, #16a34a)', 
                          color: '#ffffff',
                          border: 'none', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.35rem',
                          cursor: 'pointer',
                          boxShadow: '0 3px 10px rgba(34, 197, 94, 0.25)',
                          transition: 'transform 0.15s, box-shadow 0.15s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 5px 14px rgba(34, 197, 94, 0.32)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 3px 10px rgba(34, 197, 94, 0.25)';
                        }}
                        onClick={() => {
                          setSelectedMeeting(m);
                          let parsedPhotos = [];
                          try {
                            if (Array.isArray(m.photos)) parsedPhotos = m.photos;
                            else if (typeof m.photos === 'string' && m.photos.trim().startsWith('[')) parsedPhotos = JSON.parse(m.photos);
                            else if (typeof m.photos === 'string' && m.photos.length > 0) parsedPhotos = [m.photos];
                          } catch (e) {}

                          setUpdateData({
                            title: m.title || '',
                            branch: m.branch || '',
                            department: m.department || '',
                            project: m.project || '',
                            clientName: m.clientName || m.client || '',
                            clientAddress: m.clientAddress || '',
                            location: m.location || '',
                            meetingFeedback: m.meetingFeedback || '',
                            photos: parsedPhotos,
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
    </>
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
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Schedule Service Meeting & Assign Personnel
            </h3>
            <form onSubmit={handleScheduleMeeting} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Branch & Department Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Branch<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select 
                    className="select-field"
                    required
                    value={newMeeting.branch}
                    onChange={e => setNewMeeting({ ...newMeeting, branch: e.target.value })}
                  >
                    <option value="">Select Branch</option>
                    {BRANCH_OPTIONS.map((b, idx) => (
                      <option key={idx} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Department<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select 
                    className="select-field"
                    required
                    value={newMeeting.department}
                    onChange={e => setNewMeeting({ ...newMeeting, department: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENT_OPTIONS.map((d, idx) => (
                      <option key={idx} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Project & Meeting Title Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Project
                  </label>
                  <select 
                    className="select-field"
                    value={newMeeting.project}
                    onChange={e => setNewMeeting({ ...newMeeting, project: e.target.value })}
                  >
                    <option value="">Select Project</option>
                    {projects && projects.length > 0 ? (
                      projects.map(p => (
                        <option key={p.id} value={p.name}>
                          {p.name} {p.customerName ? `(${p.customerName})` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No projects found in database</option>
                    )}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Meeting Title<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    className="input-field" 
                    required
                    placeholder="Enter Meeting Title (e.g. Field Audit)"
                    value={newMeeting.title}
                    onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  />
                </div>
              </div>

              {/* Client Selection Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Select Client (Registered)</label>
                  <select 
                    className="select-field"
                    onChange={e => {
                      const selectedId = e.target.value;
                      if (!selectedId) return;
                      const client = users.find(u => u.id === selectedId);
                      if (client) {
                        setNewMeeting(prev => ({
                          ...prev,
                          clientName: client.name,
                          clientAddress: client.address || prev.clientAddress
                        }));
                      }
                    }}
                  >
                    <option value="">-- Choose Registered Client --</option>
                    {registeredClients.length > 0 ? (
                      registeredClients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                      ))
                    ) : (
                      users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Client Name (Auto-filled or Custom)</label>
                  <input 
                    className="input-field" 
                    required
                    placeholder="e.g. Tata Consultancy Services"
                    value={newMeeting.clientName}
                    onChange={e => setNewMeeting({ ...newMeeting, clientName: e.target.value })}
                  />
                </div>
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
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Assign Service Personnel (Employee)</label>
                  <select 
                    className="select-field"
                    value={newMeeting.assignedToId}
                    onChange={e => setNewMeeting({ ...newMeeting, assignedToId: e.target.value })}
                  >
                    <option value="">Select Employee / Staff</option>
                    {availableEmployees.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role ? u.role.replace(/_/g, ' ') : 'Employee'})</option>
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

              {/* Location & Status Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Location
                  </label>
                  <input 
                    className="input-field" 
                    placeholder="Enter Location"
                    value={newMeeting.location}
                    onChange={e => setNewMeeting({ ...newMeeting, location: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Status
                  </label>
                  <select 
                    className="select-field"
                    value={newMeeting.status}
                    onChange={e => setNewMeeting({ ...newMeeting, status: e.target.value })}
                  >
                    <option value="Assign">Assign</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Upload Files / Camera Capture */}
              <div style={{ border: '1px dashed #cbd5e1', padding: '0.85rem', borderRadius: '10px', background: '#f8fafc' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Upload Files / Camera Capture
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      id="schedule-file-input"
                      style={{ display: 'none' }}
                      onChange={e => handleFileUpload(e, 'schedule')}
                    />
                    <label 
                      htmlFor="schedule-file-input"
                      className="btn btn-secondary"
                      style={{ cursor: 'pointer', margin: 0, padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#ffffff' }}
                    >
                      <Upload size={14} /> Choose Files
                    </label>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {newMeeting.photos && newMeeting.photos.length > 0 
                        ? `${newMeeting.photos.length} file(s) chosen` 
                        : 'No file chosen'}
                    </span>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      style={{ backgroundColor: '#475569', borderColor: '#334155', padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      onClick={() => startCamera('schedule')}
                    >
                      <Camera size={14} /> Start Camera
                    </button>
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
                    You can select multiple files or use camera capture below
                  </div>
                  
                  {/* Photos Preview Grid */}
                  {newMeeting.photos && newMeeting.photos.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                      {newMeeting.photos.map((pUrl, pIdx) => (
                        <div key={pIdx} style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                          <img src={pUrl} alt={`Uploaded ${pIdx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => setViewingPhoto(pUrl)} />
                          <button 
                            type="button"
                            style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => setNewMeeting(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== pIdx) }))}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Meeting Feedback */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Meeting Feedback</label>
                <textarea 
                  className="input-field" 
                  rows={2}
                  placeholder="Enter Meeting Feedback"
                  value={newMeeting.meetingFeedback}
                  onChange={e => setNewMeeting({ ...newMeeting, meetingFeedback: e.target.value })}
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
              {/* Branch, Department & Project Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Branch</label>
                  <select 
                    className="select-field"
                    value={updateData.branch}
                    onChange={e => setUpdateData({ ...updateData, branch: e.target.value })}
                  >
                    <option value="">Select Branch</option>
                    {BRANCH_OPTIONS.map((b, i) => <option key={i} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Department</label>
                  <select 
                    className="select-field"
                    value={updateData.department}
                    onChange={e => setUpdateData({ ...updateData, department: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENT_OPTIONS.map((d, i) => <option key={i} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Project</label>
                  <select 
                    className="select-field"
                    value={updateData.project}
                    onChange={e => setUpdateData({ ...updateData, project: e.target.value })}
                  >
                    <option value="">Select Project</option>
                    {projects && projects.length > 0 ? (
                      projects.map(p => (
                        <option key={p.id} value={p.name}>
                          {p.name} {p.customerName ? `(${p.customerName})` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No projects found in database</option>
                    )}
                  </select>
                </div>
              </div>

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
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Select Client (Registered)</label>
                  <select 
                    className="select-field"
                    onChange={e => {
                      const selectedId = e.target.value;
                      if (!selectedId) return;
                      const client = users.find(u => u.id === selectedId);
                      if (client) {
                        setUpdateData(prev => ({
                          ...prev,
                          clientName: client.name,
                          clientAddress: client.address || prev.clientAddress
                        }));
                      }
                    }}
                  >
                    <option value="">-- Choose Registered Client --</option>
                    {registeredClients.length > 0 ? (
                      registeredClients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                      ))
                    ) : (
                      users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Client Name</label>
                  <input 
                    className="input-field" 
                    required
                    value={updateData.clientName}
                    onChange={e => setUpdateData({ ...updateData, clientName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Client Address</label>
                  <input 
                    className="input-field" 
                    value={updateData.clientAddress}
                    onChange={e => setUpdateData({ ...updateData, clientAddress: e.target.value })}
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
                    <UserCheck size={15} /> Assigned Staff (Employee)
                  </label>
                  <select 
                    className="select-field"
                    value={updateData.assignedToId}
                    onChange={e => setUpdateData({ ...updateData, assignedToId: e.target.value })}
                  >
                    <option value="">Select Employee / Staff</option>
                    {availableEmployees.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role ? u.role.replace(/_/g, ' ') : 'Employee'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location & Status Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Location</label>
                  <input 
                    className="input-field" 
                    placeholder="Enter Location"
                    value={updateData.location}
                    onChange={e => setUpdateData({ ...updateData, location: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Current Meeting Status</label>
                  <select 
                    className="select-field"
                    value={updateData.status}
                    onChange={e => setUpdateData({ ...updateData, status: e.target.value })}
                  >
                    <option value="Assign">Assign</option>
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              {/* Upload Files / Camera Capture */}
              <div style={{ border: '1px dashed #cbd5e1', padding: '0.85rem', borderRadius: '10px', background: '#f8fafc' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Upload Files / Camera Capture
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      id="update-file-input"
                      style={{ display: 'none' }}
                      onChange={e => handleFileUpload(e, 'update')}
                    />
                    <label 
                      htmlFor="update-file-input"
                      className="btn btn-secondary"
                      style={{ cursor: 'pointer', margin: 0, padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#ffffff' }}
                    >
                      <Upload size={14} /> Choose Files
                    </label>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {updateData.photos && updateData.photos.length > 0 
                        ? `${updateData.photos.length} file(s) chosen` 
                        : 'No file chosen'}
                    </span>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      style={{ backgroundColor: '#475569', borderColor: '#334155', padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      onClick={() => startCamera('update')}
                    >
                      <Camera size={14} /> Start Camera
                    </button>
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#64748b' }}>
                    You can select multiple files or use camera capture below
                  </div>
                  
                  {/* Photos Preview Grid */}
                  {updateData.photos && updateData.photos.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                      {updateData.photos.map((pUrl, pIdx) => (
                        <div key={pIdx} style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                          <img src={pUrl} alt={`Uploaded ${pIdx+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} onClick={() => setViewingPhoto(pUrl)} />
                          <button 
                            type="button"
                            style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => setUpdateData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== pIdx) }))}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Meeting Feedback */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Meeting Feedback</label>
                <textarea 
                  className="input-field" 
                  rows={2}
                  placeholder="Enter Meeting Feedback"
                  value={updateData.meetingFeedback}
                  onChange={e => setUpdateData({ ...updateData, meetingFeedback: e.target.value })}
                />
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

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      {viewingPhoto && (
        <div className="modal-overlay" style={{ zIndex: 1100, backgroundColor: 'rgba(0, 0, 0, 0.85)' }} onClick={() => setViewingPhoto(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <button 
              type="button"
              style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              onClick={() => setViewingPhoto(null)}
            >
              <X size={28} />
            </button>
            <img src={viewingPhoto} alt="Meeting Photo Full Preview" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} />
          </div>
        </div>
      )}

      {/* Camera Live Stream Modal */}
      {cameraModalTarget && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '500px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={18} /> Live Camera Capture
              </h4>
              <button type="button" onClick={stopCamera} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ width: '100%', height: '300px', background: '#000', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem', position: 'relative' }}>
              <video ref={cameraVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={stopCamera}>Cancel</button>
              <button type="button" className="btn btn-primary" style={{ backgroundColor: '#22c55e', borderColor: '#16a34a' }} onClick={() => snapPhoto(cameraModalTarget)}>
                📸 Snap Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Create Material Request (Matches Image 1 Design) */}
      {showMaterialModal && (
        <div className="modal-overlay" onClick={() => setShowMaterialModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1.5rem' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', color: '#0f172a', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: 'calc(100vh - 3rem)', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', border: '1px solid #e2e8f0', margin: 'auto' }}>
            
            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading, sans-serif)', fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Create Material Request
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleGenerateAIMaterialRequest}
                  style={{
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.45rem 0.85rem',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  title="Auto-fill form with AI generated sample data"
                >
                  🤖 Generate with AI
                </button>
                <button
                  onClick={() => setShowMaterialModal(false)}
                  style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitMaterialRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              {/* Subject */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                  Subject<span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input 
                  className="input-field" 
                  required
                  placeholder="Enter Material Request"
                  value={newMatReq.subject}
                  onChange={e => setNewMatReq({ ...newMatReq, subject: e.target.value })}
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                />
              </div>

              {/* Row 2: Material Request for User & Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.15rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Material Request for User
                  </label>
                  <select 
                    className="select-field"
                    value={newMatReq.requestedForUserId}
                    onChange={e => {
                      const u = users.find(usr => usr.id === e.target.value);
                      setNewMatReq({ 
                        ...newMatReq, 
                        requestedForUserId: e.target.value,
                        requestedForUserName: u ? u.name : ''
                      });
                    }}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                  >
                    <option value="">Select User</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Create user here. <span onClick={() => alert('Please use User Management to create a new user account.')} style={{ color: '#22c55e', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>Create user</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Priority
                  </label>
                  <select 
                    className="select-field"
                    value={newMatReq.priority}
                    onChange={e => setNewMatReq({ ...newMatReq, priority: e.target.value })}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Status & End Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.15rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    Status
                  </label>
                  <select 
                    className="select-field"
                    value={newMatReq.status}
                    onChange={e => setNewMatReq({ ...newMatReq, status: e.target.value })}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                  >
                    <option value="Open">Open</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Approved">Approved</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                    End Date<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    type="date"
                    className="input-field"
                    required
                    value={newMatReq.endDate}
                    onChange={e => setNewMatReq({ ...newMatReq, endDate: e.target.value })}
                    style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                  Description
                </label>
                <textarea 
                  className="input-field" 
                  rows={3}
                  placeholder="Enter Description"
                  value={newMatReq.description}
                  onChange={e => setNewMatReq({ ...newMatReq, description: e.target.value, justification: e.target.value })}
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              {/* Attachment */}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '0.35rem' }}>
                  Attachment
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <input 
                    type="file" 
                    id="create-mat-attachment-input" 
                    style={{ display: 'none' }} 
                    onChange={e => handleMatAttachmentUpload(e, false)}
                  />
                  <label 
                    htmlFor="create-mat-attachment-input"
                    style={{
                      background: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      padding: '0.6rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Upload size={15} /> Choose File
                  </label>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    {newMatReq.attachmentUrl ? 'File Loaded ✓' : 'No file chosen'}
                  </span>
                </div>
                {newMatReq.attachmentUrl && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img src={newMatReq.attachmentUrl} alt="Attachment Preview" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid #cbd5e1' }} />
                    <button type="button" onClick={() => setNewMatReq({ ...newMatReq, attachmentUrl: '' })} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.75rem', cursor: 'pointer' }}>Remove</button>
                  </div>
                )}
              </div>

              {/* Material Item Details (Integrated) */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📦 Required Material / Item Details
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Material / Item Description</label>
                    <input 
                      className="input-field" 
                      placeholder="e.g. Copper Wire Coil 50m"
                      value={newMatReq.itemTitle}
                      onChange={e => setNewMatReq({ ...newMatReq, itemTitle: e.target.value })}
                      style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Quantity</label>
                    <input 
                      type="number"
                      min="1"
                      className="input-field" 
                      value={newMatReq.quantity}
                      onChange={e => setNewMatReq({ ...newMatReq, quantity: e.target.value })}
                      style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Unit</label>
                    <input 
                      className="input-field" 
                      value={newMatReq.unit}
                      onChange={e => setNewMatReq({ ...newMatReq, unit: e.target.value })}
                      style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Link to Service Meeting (Optional)</label>
                  <select 
                    className="select-field"
                    value={newMatReq.meetingId}
                    onChange={e => setNewMatReq({ ...newMatReq, meetingId: e.target.value })}
                    style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', width: '100%' }}
                  >
                    <option value="">Select Service Meeting (Optional)</option>
                    {meetings.map(m => (
                      <option key={m.id} value={m.id}>#{m.id.substring(0, 8)} - {m.clientName || m.client} ({m.title})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.85rem', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                <button 
                  type="button" 
                  className="btn" 
                  onClick={() => setShowMaterialModal(false)}
                  style={{ background: '#64748b', color: '#ffffff', border: 'none', padding: '0.65rem 1.4rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn"
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#ffffff', border: 'none', padding: '0.65rem 1.6rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}
                >
                  Create
                </button>
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
