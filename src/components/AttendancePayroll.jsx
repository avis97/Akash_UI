import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserCheck, 
  Calendar, 
  DollarSign, 
  FileText, 
  Clock, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  Download,
  Building,
  Edit2,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export default function AttendancePayroll({ data = {}, currentRole, onRefresh, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab || 'attendance'); // 'attendance' | 'leaves' | 'payroll'
  const [selectedSalarySlip, setSelectedSalarySlip] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Edit / Delete states
  const [editingAtt, setEditingAtt] = useState(null);
  const [deletingAtt, setDeletingAtt] = useState(null);

  const [editingLeave, setEditingLeave] = useState(null);
  const [deletingLeave, setDeletingLeave] = useState(null);

  const [editingSal, setEditingSal] = useState(null);
  const [deletingSal, setDeletingSal] = useState(null);

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  const [attendance, setAttendance] = useState(data.attendance || []);
  const [leaves, setLeaves] = useState(data.leaves || []);
  const [salaryRecords, setSalaryRecords] = useState(data.salaryRecords || []);
  const [users, setUsers] = useState(data.users || []);

  const fetchAttendanceData = useCallback(async () => {
    try {
      const [attRes, lveRes, payRes, usrRes] = await Promise.allSettled([
        fetch('/api/attendance').then(r => r.json()),
        fetch('/api/leaves').then(r => r.json()),
        fetch('/api/payroll').then(r => r.json()),
        fetch('/api/users').then(r => r.json())
      ]);

      if (attRes.status === 'fulfilled' && attRes.value?.success) setAttendance(attRes.value.data);
      if (lveRes.status === 'fulfilled' && lveRes.value?.success) setLeaves(lveRes.value.data);
      if (payRes.status === 'fulfilled' && payRes.value?.success) setSalaryRecords(payRes.value.data);
      if (usrRes.status === 'fulfilled' && usrRes.value?.success) setUsers(usrRes.value.data);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
    }
  }, []);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  // Leave Form state
  const [newLeave, setNewLeave] = useState({
    leaveType: 'CASUAL',
    startDate: '2026-09-10',
    endDate: '2026-09-12',
    reason: ''
  });

  // Edit Leave Form state
  const [editLeaveData, setEditLeaveData] = useState({
    leaveType: 'CASUAL',
    startDate: '',
    endDate: '',
    reason: '',
    status: 'PENDING'
  });

  // Edit Attendance Form state
  const [editAttData, setEditAttData] = useState({
    checkInTime: '09:30 AM',
    checkOutTime: '06:30 PM',
    status: 'PRESENT',
    location: 'Office HO',
    method: 'WEB'
  });

  // Salary Slip POST state
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [newSalary, setNewSalary] = useState({
    userId: '',
    month: 'September',
    year: '2026',
    baseSalary: '45000',
    overtimeHours: '10',
    allowances: '2500',
    deductions: '1000'
  });

  // Edit Salary Form state
  const [editSalData, setEditSalData] = useState({
    month: 'September',
    year: '2026',
    baseSalary: 45000,
    overtimeHours: 10,
    allowances: 2500,
    deductions: 1000,
    status: 'PROCESSED'
  });

  const handleGenerateSalary = async (e) => {
    e.preventDefault();
    try {
      const selectedUser = (users || []).find(u => u.id === newSalary.userId);
      const res = await fetch('/api/payroll/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSalary,
          userName: selectedUser ? selectedUser.name : 'Staff Member'
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowSalaryModal(false);
        fetchAttendanceData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSalary = async (e) => {
    e.preventDefault();
    if (!editingSal) return;
    try {
      const res = await fetch(`/api/payroll/${editingSal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editSalData)
      });
      const json = await res.json();
      if (json.success) {
        setEditingSal(null);
        fetchAttendanceData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSalary = async () => {
    if (!deletingSal) return;
    try {
      const res = await fetch(`/api/payroll/${deletingSal.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDeletingSal(null);
        fetchAttendanceData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWebCheckIn = async () => {
    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'usr-4',
          userName: 'Sujan Mukhopadhyay',
          location: 'VS DIGITECH HO Dumdum',
          method: 'WEB'
        })
      });
      const json = await res.json();
      if (json.success) {
        fetchAttendanceData();
        if (onRefresh) onRefresh();
        alert('Web Attendance Check-in Successful!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditAttendance = async (e) => {
    e.preventDefault();
    if (!editingAtt) return;
    try {
      const res = await fetch(`/api/attendance/${editingAtt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editAttData)
      });
      const json = await res.json();
      if (json.success) {
        setEditingAtt(null);
        fetchAttendanceData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAttendance = async () => {
    if (!deletingAtt) return;
    try {
      const res = await fetch(`/api/attendance/${deletingAtt.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDeletingAtt(null);
        fetchAttendanceData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newLeave,
          userId: 'usr-4',
          userName: 'Sujan Mukhopadhyay'
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowLeaveModal(false);
        fetchAttendanceData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditLeave = async (e) => {
    e.preventDefault();
    if (!editingLeave) return;
    try {
      const res = await fetch(`/api/leaves/${editingLeave.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editLeaveData)
      });
      const json = await res.json();
      if (json.success) {
        setEditingLeave(null);
        fetchAttendanceData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLeave = async () => {
    if (!deletingLeave) return;
    try {
      const res = await fetch(`/api/leaves/${deletingLeave.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDeletingLeave(null);
        fetchAttendanceData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      const res = await fetch(`/api/leaves/${leaveId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverName: currentRole === 'MASTER_ADMIN' ? 'Rahul Sharma' : 'Amitabh Roy' })
      });
      const json = await res.json();
      if (json.success) {
        fetchAttendanceData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button 
            className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('attendance')}
          >
            <UserCheck style={{ width: 16, height: 16 }} />
            Attendance Register ({attendance.length})
          </button>
          <button 
            className={`btn ${activeTab === 'leaves' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('leaves')}
          >
            <Calendar style={{ width: 16, height: 16 }} />
            Leave Requests ({leaves.length})
          </button>
          <button 
            className={`btn ${activeTab === 'payroll' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('payroll')}
          >
            <DollarSign style={{ width: 16, height: 16 }} />
            Salary & Payroll ({salaryRecords.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleWebCheckIn}>
            <Clock style={{ width: 16, height: 16, color: 'var(--brand-yellow)' }} />
            Web Attendance Punch
          </button>
          <button className="btn btn-secondary" onClick={() => setShowLeaveModal(true)}>
            <Plus style={{ width: 16, height: 16 }} />
            Apply Leave
          </button>
          <button className="btn btn-primary" onClick={() => setShowSalaryModal(true)}>
            <DollarSign style={{ width: 16, height: 16 }} />
            Process Salary Slip
          </button>
        </div>
      </div>

      {/* TAB 1: Attendance Register */}
      {activeTab === 'attendance' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
              Daily Attendance Register & Verification Method
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Log Source: Biometric Hardware / Mobile GPS / Web Portal
            </span>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Location / Site</th>
                <th>Punch Method</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map(att => (
                <tr key={att.id}>
                  <td><strong>{att.userName}</strong></td>
                  <td>{typeof att.date === 'string' ? att.date.slice(0, 10) : new Date(att.date).toISOString().slice(0, 10)}</td>
                  <td>{att.checkInTime}</td>
                  <td>{att.checkOutTime || 'Present In Field'}</td>
                  <td>📍 {att.location}</td>
                  <td>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      background: 'rgba(255,255,255,0.06)',
                      fontWeight: 600
                    }}>
                      {att.method}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-present">✓ {att.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                        title="Edit Attendance Record"
                        onClick={() => {
                          setEditingAtt(att);
                          setEditAttData({
                            checkInTime: att.checkInTime || '09:30 AM',
                            checkOutTime: att.checkOutTime || '06:30 PM',
                            status: att.status || 'PRESENT',
                            location: att.location || '',
                            method: att.method || 'WEB'
                          });
                        }}
                      >
                        <Edit2 size={14} color="var(--brand-primary)" />
                      </button>
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                        title="Delete Attendance Record"
                        onClick={() => setDeletingAtt(att)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: Leave Management & Approvals */}
      {activeTab === 'leaves' && (
        <div className="glass-card">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
            Employee Leave Applications & Workflow
          </h3>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Approval Status</th>
                <th>Approved By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(l => (
                <tr key={l.id}>
                  <td><strong>{l.userName}</strong></td>
                  <td><span style={{ color: 'var(--brand-yellow)', fontWeight: 600 }}>{l.leaveType}</span></td>
                  <td>{typeof l.startDate === 'string' ? l.startDate.slice(0, 10) : new Date(l.startDate).toISOString().slice(0, 10)} to {typeof l.endDate === 'string' ? l.endDate.slice(0, 10) : new Date(l.endDate).toISOString().slice(0, 10)}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{l.reason}</td>
                  <td>
                    <span className={`badge ${l.status === 'APPROVED' ? 'badge-approved' : 'badge-pending'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td>{l.approvedBy || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      {l.status === 'PENDING' && (currentRole === 'MASTER_ADMIN' || currentRole === 'FACILITY_MANAGER' || currentRole === 'SUPERADMIN') && (
                        <button className="btn btn-primary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleApproveLeave(l.id)}>
                          Approve
                        </button>
                      )}
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                        title="Edit Leave Request"
                        onClick={() => {
                          setEditingLeave(l);
                          setEditLeaveData({
                            leaveType: l.leaveType || 'CASUAL',
                            startDate: l.startDate ? new Date(l.startDate).toISOString().slice(0, 10) : '',
                            endDate: l.endDate ? new Date(l.endDate).toISOString().slice(0, 10) : '',
                            reason: l.reason || '',
                            status: l.status || 'PENDING'
                          });
                        }}
                      >
                        <Edit2 size={14} color="var(--brand-primary)" />
                      </button>
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                        title="Delete Leave Request"
                        onClick={() => setDeletingLeave(l)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Salary Management & Salary Slips */}
      {activeTab === 'payroll' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
                Payroll Integration & Digital Salary Slips
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Calculates base, overtime, Statutory PF, and Tax deductions automatically.
              </p>
            </div>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th>Base Pay</th>
                <th>Overtime (Hrs)</th>
                <th>PF & Tax</th>
                <th>Net Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {salaryRecords.map(sal => (
                <tr key={sal.id}>
                  <td>
                    <strong>{sal.userName}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sal.designation}</div>
                  </td>
                  <td>{sal.month} {sal.year}</td>
                  <td>₹{sal.baseSalary.toLocaleString()}</td>
                  <td>{sal.overtimeHours} hrs (₹{sal.overtimePay})</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--brand-red)' }}>
                    -₹{(sal.pfDeduction + sal.taxDeduction).toLocaleString()}
                  </td>
                  <td><strong style={{ color: 'var(--brand-green)', fontSize: '0.95rem' }}>₹{sal.netSalary.toLocaleString()}</strong></td>
                  <td>
                    <span className="badge badge-approved">{sal.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setSelectedSalarySlip(sal)} title="View Slip">
                        <FileText style={{ width: 14, height: 14, color: 'var(--brand-yellow)' }} />
                      </button>
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                        title="Edit Salary Record"
                        onClick={() => {
                          setEditingSal(sal);
                          setEditSalData({
                            month: sal.month || 'September',
                            year: sal.year || 2026,
                            baseSalary: sal.baseSalary || 40000,
                            overtimeHours: sal.overtimeHours || 0,
                            allowances: sal.allowances || 0,
                            deductions: sal.deductions || 0,
                            status: sal.status || 'PROCESSED'
                          });
                        }}
                      >
                        <Edit2 size={14} color="var(--brand-primary)" />
                      </button>
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                        title="Delete Salary Record"
                        onClick={() => setDeletingSal(sal)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Apply Leave */}
      {showLeaveModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Request Employee Leave
            </h3>
            <form onSubmit={handleApplyLeave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Leave Category</label>
                <select 
                  className="select-field"
                  value={newLeave.leaveType}
                  onChange={e => setNewLeave({ ...newLeave, leaveType: e.target.value })}
                >
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="SICK">Sick Leave (SL)</option>
                  <option value="EARNED">Earned Privilege Leave (EL)</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Start Date</label>
                  <input 
                    type="date"
                    className="input-field" 
                    value={newLeave.startDate}
                    onChange={e => setNewLeave({ ...newLeave, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>End Date</label>
                  <input 
                    type="date"
                    className="input-field" 
                    value={newLeave.endDate}
                    onChange={e => setNewLeave({ ...newLeave, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reason for Request</label>
                <textarea 
                  className="input-field" 
                  rows={2}
                  value={newLeave.reason}
                  onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })}
                  placeholder="Provide context for approval"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLeaveModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Leave Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 1B: Edit Leave Request */}
      {editingLeave && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Edit Leave Request for {editingLeave.userName}
            </h3>
            <form onSubmit={handleEditLeave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Leave Type</label>
                <select 
                  className="select-field"
                  value={editLeaveData.leaveType}
                  onChange={e => setEditLeaveData({ ...editLeaveData, leaveType: e.target.value })}
                >
                  <option value="CASUAL">Casual Leave (CL)</option>
                  <option value="SICK">Sick Leave (SL)</option>
                  <option value="EARNED">Earned Privilege Leave (EL)</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Start Date</label>
                  <input 
                    type="date"
                    className="input-field" 
                    value={editLeaveData.startDate}
                    onChange={e => setEditLeaveData({ ...editLeaveData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>End Date</label>
                  <input 
                    type="date"
                    className="input-field" 
                    value={editLeaveData.endDate}
                    onChange={e => setEditLeaveData({ ...editLeaveData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reason</label>
                <textarea 
                  className="input-field" 
                  rows={2}
                  value={editLeaveData.reason}
                  onChange={e => setEditLeaveData({ ...editLeaveData, reason: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status</label>
                <select 
                  className="select-field"
                  value={editLeaveData.status}
                  onChange={e => setEditLeaveData({ ...editLeaveData, status: e.target.value })}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingLeave(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Leave Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Attendance Record */}
      {editingAtt && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Edit Attendance Log for {editingAtt.userName}
            </h3>
            <form onSubmit={handleEditAttendance} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Check-in Time</label>
                  <input 
                    className="input-field" 
                    value={editAttData.checkInTime}
                    onChange={e => setEditAttData({ ...editAttData, checkInTime: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Check-out Time</label>
                  <input 
                    className="input-field" 
                    value={editAttData.checkOutTime}
                    onChange={e => setEditAttData({ ...editAttData, checkOutTime: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Location / Site</label>
                  <input 
                    className="input-field" 
                    value={editAttData.location}
                    onChange={e => setEditAttData({ ...editAttData, location: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Punch Method</label>
                  <select 
                    className="select-field"
                    value={editAttData.method}
                    onChange={e => setEditAttData({ ...editAttData, method: e.target.value })}
                  >
                    <option value="WEB">WEB</option>
                    <option value="MOBILE_GPS">MOBILE GPS</option>
                    <option value="BIOMETRIC">BIOMETRIC</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status</label>
                <select 
                  className="select-field"
                  value={editAttData.status}
                  onChange={e => setEditAttData({ ...editAttData, status: e.target.value })}
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="LATE">LATE</option>
                  <option value="HALF_DAY">HALF DAY</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingAtt(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Attendance Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Process Salary Slip Modal */}
      {showSalaryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Generate Employee Salary Slip (Database POST)
            </h3>
            <form onSubmit={handleGenerateSalary} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Employee</label>
                <select 
                  className="select-field"
                  value={newSalary.userId}
                  onChange={e => setNewSalary({ ...newSalary, userId: e.target.value })}
                >
                  <option value="">Select Employee</option>
                  {(users || []).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.designation || u.role})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Month</label>
                  <input 
                    className="input-field" 
                    value={newSalary.month}
                    onChange={e => setNewSalary({ ...newSalary, month: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Year</label>
                  <input 
                    type="number"
                    className="input-field" 
                    value={newSalary.year}
                    onChange={e => setNewSalary({ ...newSalary, year: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Base Salary (₹)</label>
                  <input 
                    type="number"
                    className="input-field" 
                    value={newSalary.baseSalary}
                    onChange={e => setNewSalary({ ...newSalary, baseSalary: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Overtime Hours</label>
                  <input 
                    type="number"
                    className="input-field" 
                    value={newSalary.overtimeHours}
                    onChange={e => setNewSalary({ ...newSalary, overtimeHours: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Allowances (₹)</label>
                  <input 
                    type="number"
                    className="input-field" 
                    value={newSalary.allowances}
                    onChange={e => setNewSalary({ ...newSalary, allowances: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Deductions (₹)</label>
                  <input 
                    type="number"
                    className="input-field" 
                    value={newSalary.deductions}
                    onChange={e => setNewSalary({ ...newSalary, deductions: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSalaryModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate & Save Payslip</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3B: Edit Salary Slip */}
      {editingSal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Edit Salary Record for {editingSal.userName}
            </h3>
            <form onSubmit={handleEditSalary} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Month</label>
                  <input 
                    className="input-field" 
                    value={editSalData.month}
                    onChange={e => setEditSalData({ ...editSalData, month: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Year</label>
                  <input 
                    type="number"
                    className="input-field" 
                    value={editSalData.year}
                    onChange={e => setEditSalData({ ...editSalData, year: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Base Salary (₹)</label>
                  <input 
                    type="number"
                    className="input-field" 
                    value={editSalData.baseSalary}
                    onChange={e => setEditSalData({ ...editSalData, baseSalary: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Overtime Hours</label>
                  <input 
                    type="number"
                    className="input-field" 
                    value={editSalData.overtimeHours}
                    onChange={e => setEditSalData({ ...editSalData, overtimeHours: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Allowances (₹)</label>
                  <input 
                    type="number"
                    className="input-field" 
                    value={editSalData.allowances}
                    onChange={e => setEditSalData({ ...editSalData, allowances: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Deductions (₹)</label>
                  <input 
                    type="number"
                    className="input-field" 
                    value={editSalData.deductions}
                    onChange={e => setEditSalData({ ...editSalData, deductions: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingSal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Salary Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Digital Salary Slip Preview */}
      {selectedSalarySlip && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ border: '2px solid var(--brand-gold)', maxWidth: 650 }}>
            <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--brand-yellow)' }}>
                VS DIGITECH TECHNOLOGY
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                115/1 Purba Sinthee Bye Lane, Dumdum Junction, Kolkata 700030
              </div>
              <div style={{ marginTop: '0.5rem', fontWeight: 700, fontSize: '1rem' }}>
                PAYSLIP FOR THE MONTH OF {selectedSalarySlip.month ? selectedSalarySlip.month.toUpperCase() : ''} {selectedSalarySlip.year}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem', marginBottom: '1.25rem', background: 'rgba(15,23,42,0.6)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <div><strong>Employee Name:</strong> {selectedSalarySlip.userName}</div>
              <div><strong>Designation:</strong> {selectedSalarySlip.designation || 'Staff'}</div>
              <div><strong>Status:</strong> {selectedSalarySlip.status}</div>
              <div><strong>Generated Date:</strong> {selectedSalarySlip.generatedAt ? new Date(selectedSalarySlip.generatedAt).toLocaleDateString() : 'N/A'}</div>
            </div>

            {/* Salary Breakdown Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ color: 'var(--brand-green)', fontSize: '0.9rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  EARNINGS
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>Basic Pay:</span>
                  <strong>₹{selectedSalarySlip.baseSalary?.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>Overtime Pay ({selectedSalarySlip.overtimeHours}h):</span>
                  <strong>₹{selectedSalarySlip.overtimePay?.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>Allowances:</span>
                  <strong>₹{selectedSalarySlip.allowances?.toLocaleString()}</strong>
                </div>
              </div>

              <div>
                <h4 style={{ color: 'var(--brand-red)', fontSize: '0.9rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  DEDUCTIONS & STATUTORY
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>Provident Fund (PF):</span>
                  <strong>₹{selectedSalarySlip.pfDeduction?.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>Tax Deduction (TDS):</span>
                  <strong>₹{selectedSalarySlip.taxDeduction?.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>Other Deductions:</span>
                  <strong>₹{selectedSalarySlip.deductions?.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>NET PAYABLE SALARY:</div>
              <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--brand-green)' }}>
                ₹{selectedSalarySlip.netSalary?.toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => window.print()}>
                <Download style={{ width: 16, height: 16 }} /> Download PDF Slip
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedSalarySlip(null)}>
                Close Payslip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Attendance Confirmation Modal */}
      {deletingAtt && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f87171' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0 }}>
                Confirm Attendance Deletion
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete attendance record for <strong>{deletingAtt.userName}</strong> ({deletingAtt.date})?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingAtt(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleDeleteAttendance}>
                Delete Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Leave Confirmation Modal */}
      {deletingLeave && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f87171' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0 }}>
                Confirm Leave Request Deletion
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete leave application for <strong>{deletingLeave.userName}</strong> ({deletingLeave.leaveType})?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingLeave(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleDeleteLeave}>
                Delete Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Salary Record Confirmation Modal */}
      {deletingSal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f87171' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0 }}>
                Confirm Payroll Record Deletion
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete salary slip for <strong>{deletingSal.userName}</strong> ({deletingSal.month} {deletingSal.year})?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingSal(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleDeleteSalary}>
                Delete Salary Slip
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
