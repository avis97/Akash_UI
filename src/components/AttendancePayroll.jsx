import React, { useState } from 'react';
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
  Building
} from 'lucide-react';

export default function AttendancePayroll({ data, currentRole, onRefresh }) {
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'leaves' | 'payroll'
  const [selectedSalarySlip, setSelectedSalarySlip] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Leave Form state
  const [newLeave, setNewLeave] = useState({
    leaveType: 'CASUAL',
    startDate: '2026-09-10',
    endDate: '2026-09-12',
    reason: ''
  });

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
        onRefresh();
        alert('Web Attendance Check-in Successful!');
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
        onRefresh();
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
        onRefresh();
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
            Attendance Register ({data.attendance.length})
          </button>
          <button 
            className={`btn ${activeTab === 'leaves' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('leaves')}
          >
            <Calendar style={{ width: 16, height: 16 }} />
            Leave Requests ({data.leaves.length})
          </button>
          <button 
            className={`btn ${activeTab === 'payroll' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('payroll')}
          >
            <DollarSign style={{ width: 16, height: 16 }} />
            Salary & Payroll ({data.salaryRecords.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={handleWebCheckIn}>
            <Clock style={{ width: 16, height: 16, color: 'var(--brand-yellow)' }} />
            Web Attendance Punch
          </button>
          <button className="btn btn-primary" onClick={() => setShowLeaveModal(true)}>
            <Plus style={{ width: 16, height: 16 }} />
            Apply Leave
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
              </tr>
            </thead>
            <tbody>
              {data.attendance.map(att => (
                <tr key={att.id}>
                  <td><strong>{att.userName}</strong></td>
                  <td>{att.date}</td>
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.leaves.map(l => (
                <tr key={l.id}>
                  <td><strong>{l.userName}</strong></td>
                  <td><span style={{ color: 'var(--brand-yellow)', fontWeight: 600 }}>{l.leaveType}</span></td>
                  <td>{l.startDate} to {l.endDate}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{l.reason}</td>
                  <td>
                    <span className={`badge ${l.status === 'APPROVED' ? 'badge-approved' : 'badge-pending'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td>{l.approvedBy || '—'}</td>
                  <td>
                    {l.status === 'PENDING' && (currentRole === 'MASTER_ADMIN' || currentRole === 'FACILITY_MANAGER') && (
                      <button className="btn btn-primary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleApproveLeave(l.id)}>
                        Approve Leave
                      </button>
                    )}
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
                <th>Salary Slip</th>
              </tr>
            </thead>
            <tbody>
              {data.salaryRecords.map(sal => (
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
                    <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => setSelectedSalarySlip(sal)}>
                      <FileText style={{ width: 14, height: 14, color: 'var(--brand-yellow)' }} />
                      View Slip
                    </button>
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

      {/* Modal 2: Digital Salary Slip Modal */}
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
                PAYSLIP FOR THE MONTH OF {selectedSalarySlip.month.toUpperCase()} {selectedSalarySlip.year}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem', marginBottom: '1.25rem', background: 'rgba(15,23,42,0.6)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
              <div><strong>Employee Name:</strong> {selectedSalarySlip.userName}</div>
              <div><strong>Designation:</strong> {selectedSalarySlip.designation}</div>
              <div><strong>Status:</strong> {selectedSalarySlip.status}</div>
              <div><strong>Generated Date:</strong> {selectedSalarySlip.generatedAt}</div>
            </div>

            {/* Salary Breakdown Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ color: 'var(--brand-green)', fontSize: '0.9rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  EARNINGS
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>Basic Pay:</span>
                  <strong>₹{selectedSalarySlip.baseSalary.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>Overtime Pay ({selectedSalarySlip.overtimeHours}h):</span>
                  <strong>₹{selectedSalarySlip.overtimePay.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>Allowances:</span>
                  <strong>₹{selectedSalarySlip.allowances.toLocaleString()}</strong>
                </div>
              </div>

              <div>
                <h4 style={{ color: 'var(--brand-red)', fontSize: '0.9rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  DEDUCTIONS & STATUTORY
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>Provident Fund (PF):</span>
                  <strong>₹{selectedSalarySlip.pfDeduction.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>Tax Deduction (TDS):</span>
                  <strong>₹{selectedSalarySlip.taxDeduction.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>Other Deductions:</span>
                  <strong>₹{selectedSalarySlip.deductions.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>NET PAYABLE SALARY:</div>
              <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--brand-green)' }}>
                ₹{selectedSalarySlip.netSalary.toLocaleString()}
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

    </div>
  );
}
