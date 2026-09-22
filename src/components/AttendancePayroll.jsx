import React, { useState, useEffect, useCallback, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  AlertTriangle,
  Users,
  BarChart3,
  Zap,
  Search,
  Filter,
  ShieldCheck,
  Check,
  X,
  IdCard
} from 'lucide-react';
import EmployeeIDCard from './EmployeeIDCard';

const formatUserRole = (role) => {
  if (!role) return 'Employee';
  switch (role) {
    case 'SUPERADMIN': return 'Super Admin';
    case 'MASTER_ADMIN': return 'Main Admin';
    case 'SUB_ADMIN': return 'Sub Admin';
    case 'FACILITY_MANAGER': return 'Facility Manager';
    case 'SERVICE_PERSONNEL': return 'Service Personnel';
    case 'EMPLOYEE': return 'Employee';
    case 'CLIENT': return 'Client';
    default: return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  }
};

// Haversine formula to calculate distance between two coordinates in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // metres
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function AttendancePayroll({ data = {}, currentRole, currentUser, onRefresh, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab || 'attendance'); // 'attendance' | 'monthly_report' | 'leaves' | 'payroll'
  const [selectedSalarySlip, setSelectedSalarySlip] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showIDCardModal, setShowIDCardModal] = useState(false);

  // Month, Year & Staff Filter
  const [selectedMonth, setSelectedMonth] = useState('September');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedStaffId, setSelectedStaffId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit / Delete states
  const [editingAtt, setEditingAtt] = useState(null);
  const [deletingAtt, setDeletingAtt] = useState(null);

  const [editingLeave, setEditingLeave] = useState(null);
  const [deletingLeave, setDeletingLeave] = useState(null);

  const [editingSal, setEditingSal] = useState(null);
  const [deletingSal, setDeletingSal] = useState(null);

  // Set Basic Salary Modal State
  const [showBasicSalaryModal, setShowBasicSalaryModal] = useState(false);
  const [basicSalaryUser, setBasicSalaryUser] = useState(null);
  const [basicSalaryInput, setBasicSalaryInput] = useState('30000');

  const handleOpenBasicSalaryModal = (user) => {
    setBasicSalaryUser(user);
    setBasicSalaryInput((user.baseSalary || user.basicSalary || 30000).toString());
    setShowBasicSalaryModal(true);
  };

  const handleSaveBasicSalary = async (e) => {
    e.preventDefault();
    if (!basicSalaryUser) return;
    try {
      const targetUserId = basicSalaryUser.userId || basicSalaryUser.id;
      const res = await fetch(`/api/users/${targetUserId}/basic-salary`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {})
        },
        body: JSON.stringify({ basicSalary: Number(basicSalaryInput) })
      });
      const json = await res.json();
      if (json.success) {
        setShowBasicSalaryModal(false);
        fetchAttendanceData();
        fetchMonthlyReport();
        if (onRefresh) onRefresh();
        alert(`Basic salary updated for ${basicSalaryUser.userName || basicSalaryUser.name} to ₹${Number(basicSalaryInput).toLocaleString()}`);
      } else {
        alert(json.message || 'Failed to update basic salary');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating basic salary');
    }
  };

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  const [attendance, setAttendance] = useState(data.attendance || []);
  const [leaves, setLeaves] = useState(data.leaves || []);
  const [salaryRecords, setSalaryRecords] = useState(data.salaryRecords || []);
  const [users, setUsers] = useState(data.users || []);
  const [monthlyReport, setMonthlyReport] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalEmployees: 0,
    totalPresentDays: 0,
    totalLateEntries: 0,
    totalSalariesProcessed: 0
  });
  const [isGeneratingBatch, setIsGeneratingBatch] = useState(false);

  // Resolve active logged-in user from props or localStorage fallback
  const activeUser = useMemo(() => {
    if (currentUser && (currentUser.id || currentUser.name)) return currentUser;
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }, [currentUser]);

  const isEmployee = currentRole === 'EMPLOYEE' || (activeUser && activeUser.role === 'EMPLOYEE');

  // Filter staffUsers to exclude CLIENT and USER role users
  const staffUsers = (users || []).filter(u => u.role !== 'CLIENT' && u.role !== 'USER');

  // Scoped lists based on role and selected employee
  const selectedUserObj = staffUsers.find(u => u.id === selectedStaffId);

  const displayedAttendance = isEmployee
    ? attendance.filter(a => !searchQuery || a.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || a.location?.toLowerCase().includes(searchQuery.toLowerCase()))
    : attendance.filter(a => {
        const matchesSearch = !searchQuery || a.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || a.location?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStaff = selectedStaffId === 'ALL' || a.userId === selectedStaffId || (selectedUserObj && a.userName?.toLowerCase() === selectedUserObj.name?.toLowerCase());
        return matchesSearch && matchesStaff;
      });

  const displayedLeaves = isEmployee
    ? leaves.filter(l => !searchQuery || l.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || l.reason?.toLowerCase().includes(searchQuery.toLowerCase()))
    : leaves.filter(l => {
        const matchesSearch = !searchQuery || l.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || l.reason?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStaff = selectedStaffId === 'ALL' || l.userId === selectedStaffId || (selectedUserObj && l.userName?.toLowerCase() === selectedUserObj.name?.toLowerCase());
        return matchesSearch && matchesStaff;
      });

  const displayedSalaryRecords = isEmployee
    ? salaryRecords.filter(s => !searchQuery || s.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || s.month?.toLowerCase().includes(searchQuery.toLowerCase()))
    : salaryRecords.filter(s => {
        const matchesSearch = !searchQuery || s.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || s.month?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStaff = selectedStaffId === 'ALL' || s.userId === selectedStaffId || (selectedUserObj && s.userName?.toLowerCase() === selectedUserObj.name?.toLowerCase());
        return matchesSearch && matchesStaff;
      });

  const filteredMonthlyReport = monthlyReport.filter(r => {
    const matchesSearch = !searchQuery || r.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || r.designation?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStaff = selectedStaffId === 'ALL' || r.userId === selectedStaffId || (selectedUserObj && r.userName?.toLowerCase() === selectedUserObj.name?.toLowerCase());
    return matchesSearch && matchesStaff;
  });

  // Employee personal summary statistics
  const employeePresentDays = displayedAttendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
  const employeeLateDays = displayedAttendance.filter(a => a.status === 'LATE').length;
  const employeeLeavesCount = displayedLeaves.filter(l => l.status === 'APPROVED').length;

  const fetchAttendanceData = useCallback(async () => {
    try {
      const queryParam = (isEmployee && (activeUser?.id || activeUser?.name)) 
        ? `?userId=${encodeURIComponent(activeUser?.id || '')}&userName=${encodeURIComponent(activeUser?.name || '')}` 
        : '';
      const [attRes, lveRes, payRes, usrRes] = await Promise.allSettled([
        fetch(`/api/attendance${queryParam}`).then(r => r.json()),
        fetch(`/api/leaves${queryParam}`).then(r => r.json()),
        fetch(`/api/payroll${queryParam}`).then(r => r.json()),
        fetch('/api/users').then(r => r.json())
      ]);

      if (attRes.status === 'fulfilled' && attRes.value?.success) setAttendance(attRes.value.data);
      if (lveRes.status === 'fulfilled' && lveRes.value?.success) setLeaves(lveRes.value.data);
      if (payRes.status === 'fulfilled' && payRes.value?.success) setSalaryRecords(payRes.value.data);
      if (usrRes.status === 'fulfilled' && usrRes.value?.success) setUsers(usrRes.value.data);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
    }
  }, [isEmployee, activeUser?.id, activeUser?.name]);

  const fetchMonthlyReport = useCallback(async () => {
    if (isEmployee) return;
    try {
      const res = await fetch(`/api/attendance/monthly-report?month=${selectedMonth}&year=${selectedYear}`);
      const json = await res.json();
      if (json.success) {
        setMonthlyReport(json.data || []);
        if (json.summary) setMonthlyStats(json.summary);
      }
    } catch (err) {
      console.error('Error fetching monthly report:', err);
    }
  }, [isEmployee, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchAttendanceData();
    fetchMonthlyReport();
  }, [fetchAttendanceData, fetchMonthlyReport]);

  // Leave Form state
  const [newLeave, setNewLeave] = useState({
    leaveType: 'CASUAL',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
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
    month: selectedMonth,
    year: selectedYear,
    baseSalary: '45000',
    overtimeHours: '0',
    allowances: '2500',
    deductions: '0'
  });

  // Edit Salary Form state
  const [editSalData, setEditSalData] = useState({
    month: selectedMonth,
    year: selectedYear,
    baseSalary: 45000,
    overtimeHours: 0,
    allowances: 2500,
    deductions: 0,
    status: 'PROCESSED'
  });

  const handleSelectSalaryUser = (userId) => {
    const selectedUser = (users || []).find(u => u.id === userId);
    if (!selectedUser) {
      setNewSalary(prev => ({ ...prev, userId }));
      return;
    }

    const userAtt = attendance.filter(a => a.userId === userId || a.userName === selectedUser.name);
    const lateCount = userAtt.filter(a => a.status === 'LATE').length;
    const baseSal = selectedUser.salary || selectedUser.baseSalary || 45000;
    const autoDeductions = lateCount * 250;

    setNewSalary(prev => ({
      ...prev,
      userId,
      baseSalary: baseSal.toString(),
      deductions: autoDeductions.toString()
    }));
  };

  const handleBatchGenerateSalaries = async () => {
    if (!window.confirm(`Generate & process digital salary slips for ALL employees for ${selectedMonth} ${selectedYear}?`)) return;
    setIsGeneratingBatch(true);
    try {
      const res = await fetch('/api/payroll/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear })
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchAttendanceData();
        fetchMonthlyReport();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingBatch(false);
    }
  };

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
        fetchMonthlyReport();
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
        fetchMonthlyReport();
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
        fetchMonthlyReport();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [isPunching, setIsPunching] = useState(false);

  const todayPunchRecord = (attendance || []).find(a => {
    const isSameUser = (activeUser?.id && a.userId === activeUser.id) || (activeUser?.name && a.userName?.toLowerCase() === activeUser.name.toLowerCase());
    if (!isSameUser || !a.date) return false;
    const aDate = new Date(a.date);
    const now = new Date();
    return aDate.getFullYear() === now.getFullYear() &&
           aDate.getMonth() === now.getMonth() &&
           aDate.getDate() === now.getDate();
  });

  const handleWebClock = async (isClockOut = false) => {
    if (!isClockOut && todayPunchRecord) {
      alert("You have already punched attendance for today!");
      return;
    }
    if (isClockOut && (!todayPunchRecord || todayPunchRecord.clockOutTime)) {
      alert("You have already clocked out for today or haven't clocked in.");
      return;
    }

    setIsPunching(true);

    const submitPunch = async (coords = null) => {
      try {
        // Geofence check
        if (coords && activeUser?.assignedOfficeLatitude && activeUser?.assignedOfficeLongitude) {
           const dist = calculateDistance(coords.latitude, coords.longitude, activeUser.assignedOfficeLatitude, activeUser.assignedOfficeLongitude);
           if (dist > (activeUser.assignedOfficeRadius || 100)) {
               alert(`Geofence restriction: You are ${Math.round(dist)}m away from the office. You must be within ${activeUser.assignedOfficeRadius || 100}m to punch.`);
               setIsPunching(false);
               return;
           }
        }

        const endpoint = isClockOut ? '/api/attendance/clock-out' : '/api/attendance/check-in';
        const payload = {
          userId: activeUser?.id,
          userName: activeUser?.name || activeUser?.email || 'Staff Member',
          method: 'WEB'
        };
        if (coords) {
          payload.latitude = coords.latitude;
          payload.longitude = coords.longitude;
          payload.location = `GPS (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`;
        } else {
          payload.location = 'Office HO (Web Punch)';
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          fetchAttendanceData();
          fetchMonthlyReport();
          if (onRefresh) onRefresh();
          alert(`Attendance ${isClockOut ? 'Clock-out' : 'Check-in'} Successful!\nLocation: ${json.data.location || payload.location}`);
        } else {
           // Fallback UI update
           alert(`Mock ${isClockOut ? 'Clock-out' : 'Check-in'} Successful!`);
           if (onRefresh) onRefresh();
        }
      } catch (err) {
        console.error(err);
        alert(`Mock ${isClockOut ? 'Clock-out' : 'Check-in'} Successful! (Backend not ready)`);
      } finally {
        setIsPunching(false);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          submitPunch({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation unavailable or denied:', error.message);
          submitPunch(null);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      submitPunch(null);
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
        fetchMonthlyReport();
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
        fetchMonthlyReport();
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
          userId: currentUser?.id || 'usr-4',
          userName: currentUser?.name || currentUser?.email || 'Staff Member'
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowLeaveModal(false);
        fetchAttendanceData();
        fetchMonthlyReport();
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
        fetchMonthlyReport();
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
        fetchMonthlyReport();
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
        body: JSON.stringify({ approverName: currentRole === 'MASTER_ADMIN' ? 'Rahul Sharma' : 'Super Admin' })
      });
      const json = await res.json();
      if (json.success) {
        fetchAttendanceData();
        fetchMonthlyReport();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPayslip = () => {
    if (!selectedSalarySlip) return;
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const employeeData = selectedSalarySlip.employee || { name: selectedSalarySlip.userName, id: selectedSalarySlip.userId, role: 'Employee' };
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(31, 41, 55);
    doc.text('AKASH ENGINEERING', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128);
    doc.text('Headquarters - Salt Lake City', 105, 28, { align: 'center' });
    
    // Title
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.text(`PAYSLIP FOR ${selectedSalarySlip.month || 'MONTH'}`, 105, 40, { align: 'center' });
    
    // Line separator
    doc.setDrawColor(229, 231, 235);
    doc.line(14, 45, 196, 45);

    // Employee Details
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    
    doc.text('Employee Name:', 14, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(employeeData.name || 'N/A', 50, 55);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Employee ID:', 14, 62);
    doc.setFont('helvetica', 'bold');
    doc.text(employeeData.id?.toString() || 'N/A', 50, 62);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Role/Grade:', 120, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(employeeData.role || 'N/A', 150, 55);
    
    // Table for Earnings & Deductions
    autoTable(doc, {
      startY: 75,
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255] },
      bodyStyles: { textColor: [55, 65, 81] },
      columns: [
        { header: 'EARNINGS', dataKey: 'earnLabel' },
        { header: 'AMOUNT (INR)', dataKey: 'earnValue' },
        { header: 'DEDUCTIONS', dataKey: 'dedLabel' },
        { header: 'AMOUNT (INR)', dataKey: 'dedValue' },
      ],
      body: [
        { earnLabel: 'Basic Pay', earnValue: selectedSalarySlip.basicSalary, dedLabel: 'Provident Fund (PF)', dedValue: selectedSalarySlip.pfDeduction || 0 },
        { earnLabel: 'Allowances / Bonus', earnValue: selectedSalarySlip.bonus || 0, dedLabel: 'Tax Deduction (TDS)', dedValue: selectedSalarySlip.taxDeduction || 0 },
        { earnLabel: '', earnValue: '', dedLabel: 'Other Deductions', dedValue: selectedSalarySlip.deductions || 0 },
      ]
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFillColor(243, 244, 246);
    doc.rect(14, finalY + 10, 182, 20, 'F');
    
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text('NET PAYABLE:', 20, finalY + 22);
    
    doc.setFontSize(14);
    doc.setTextColor(13, 148, 136);
    doc.text(`INR ${selectedSalarySlip.netSalary}`, 160, finalY + 23);
    
    // Footer
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(156, 163, 175);
    doc.text('This is a computer-generated document. No signature is required.', 105, 280, { align: 'center' });

    doc.save(`Payslip_${employeeData.name.replace(/\\s+/g, '_')}_${selectedSalarySlip.month || 'Current'}.pdf`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Enterprise HR Header Controls */}
      <div style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        background: '#ffffff',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        border: '1px solid var(--border-color)',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            color: '#fff',
            fontWeight: 'bold'
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
              {isEmployee ? 'My Attendance & Salary Portal' : 'HR Portal & Payroll Management'}
            </h2>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              {isEmployee ? `Logged in as ${currentUser?.name || 'Employee'}` : 'Superadmin HR Overview & Payroll Generation System'}
            </div>
          </div>
        </div>

        {/* Month, Year & Staff Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {!isEmployee && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#f8fafc', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <Users size={15} color="#64748b" />
              <select 
                value={selectedStaffId} 
                onChange={e => setSelectedStaffId(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer', outline: 'none', maxWidth: 210 }}
              >
                <option value="ALL">👤 All Staff</option>
                {staffUsers.map(u => (
                  <option key={u.id} value={u.id}>👤 {u.name} ({formatUserRole(u.role)})</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#f8fafc', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
            <Calendar size={15} color="#64748b" />
            <select 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 600, color: '#334155', cursor: 'pointer', outline: 'none' }}
            >
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={e => setSelectedYear(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', fontWeight: 600, color: '#334155', cursor: 'pointer', outline: 'none' }}
            >
              {['2025', '2026', '2027'].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                padding: '0.35rem 0.65rem 0.35rem 2rem',
                fontSize: '0.82rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
                outline: 'none',
                width: 150
              }}
            />
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      {isEmployee ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
          gap: '1rem'
        }}>
          <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Present Days</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>{employeePresentDays} Days</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Out of 22 Working Days</div>
          </div>
          <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Late Entries</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.2rem' }}>{employeeLateDays} Times</div>
            <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>Late after 09:30 AM (₹250/late)</div>
          </div>
          <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Approved Leaves</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.2rem' }}>{employeeLeavesCount} Days</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Casual & Privilege Leaves</div>
          </div>
          <div style={{ background: '#ffffff', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Salary Status</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '0.3rem' }}>
              {displayedSalaryRecords.length > 0 ? displayedSalaryRecords[0].status : 'PROCESSED'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>Payslip available in Payroll tab</div>
          </div>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
          gap: '1rem'
        }}>
          <div style={{ background: '#ffffff', padding: '1.1rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                {selectedStaffId !== 'ALL' ? (selectedUserObj?.name || 'Selected Employee') : 'Total Staff'}
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '0.2rem' }}>
                {selectedStaffId !== 'ALL' ? (selectedUserObj?.designation || 'Staff') : `${monthlyStats.totalEmployees ?? users.length} Staff`}
              </div>
            </div>
            <Users size={32} color="#3b82f6" style={{ opacity: 0.8 }} />
          </div>

          <div style={{ background: '#ffffff', padding: '1.1rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Present Days ({selectedMonth})
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>
                {selectedStaffId !== 'ALL'
                  ? displayedAttendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length
                  : (monthlyStats.totalPresentDays ?? 0)} Days
              </div>
            </div>
            <UserCheck size={32} color="#10b981" style={{ opacity: 0.8 }} />
          </div>

          <div style={{ background: '#ffffff', padding: '1.1rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Late Entries Count</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.2rem' }}>
                {selectedStaffId !== 'ALL'
                  ? displayedAttendance.filter(a => a.status === 'LATE').length
                  : (monthlyStats.totalLateEntries ?? 0)} Times
              </div>
            </div>
            <Clock size={32} color="#f59e0b" style={{ opacity: 0.8 }} />
          </div>

          <div style={{ background: '#ffffff', padding: '1.1rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Salaries Generated</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#6366f1', marginTop: '0.2rem' }}>
                {selectedStaffId !== 'ALL'
                  ? displayedSalaryRecords.length
                  : (monthlyStats.totalSalariesProcessed ?? 0)} Slips
              </div>
            </div>
            <DollarSign size={32} color="#6366f1" style={{ opacity: 0.8 }} />
          </div>
        </div>
      )}

      {/* Navigation Tabs Bar & Primary Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', background: '#ffffff', padding: '0.45rem 0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', gap: '0.2rem', background: '#f1f5f9', padding: '0.18rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <button 
            className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            onClick={() => setActiveTab('attendance')}
          >
            <UserCheck style={{ width: 14, height: 14 }} />
            Daily Punch Log ({displayedAttendance.length})
          </button>

          {!isEmployee && (
            <button 
              className={`btn ${activeTab === 'monthly_report' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              onClick={() => setActiveTab('monthly_report')}
            >
              <BarChart3 style={{ width: 14, height: 14 }} />
              HR Monthly Report ({monthlyReport.length})
            </button>
          )}

          <button 
            className={`btn ${activeTab === 'leaves' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            onClick={() => setActiveTab('leaves')}
          >
            <Calendar style={{ width: 14, height: 14 }} />
            Leave Requests ({displayedLeaves.length})
          </button>
          
          <button 
            className={`btn ${activeTab === 'payroll' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            onClick={() => setActiveTab('payroll')}
          >
            <DollarSign style={{ width: 14, height: 14 }} />
            Salary Slips & Payroll ({displayedSalaryRecords.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" style={{ padding: '0.28rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => setShowIDCardModal(true)}>
            <IdCard style={{ width: 14, height: 14, color: 'var(--brand-yellow)' }} />
            ID Card
          </button>

          <button className="btn btn-secondary" style={{ padding: '0.28rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: todayPunchRecord ? 0.5 : 1, cursor: todayPunchRecord ? 'not-allowed' : 'pointer' }} onClick={() => handleWebClock(false)} disabled={isPunching || todayPunchRecord}>
            <Clock style={{ width: 14, height: 14, color: 'var(--brand-yellow)' }} />
            Web Check-in
          </button>

          <button className="btn btn-secondary" style={{ padding: '0.28rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: (!todayPunchRecord || todayPunchRecord?.clockOutTime) ? 0.5 : 1, cursor: (!todayPunchRecord || todayPunchRecord?.clockOutTime) ? 'not-allowed' : 'pointer' }} onClick={() => handleWebClock(true)} disabled={isPunching || !todayPunchRecord || todayPunchRecord?.clockOutTime}>
            <Clock style={{ width: 14, height: 14, color: 'var(--brand-red)' }} />
            Web Clock-out
          </button>
          
          <button className="btn btn-secondary" onClick={() => setShowLeaveModal(true)}>
            <Plus style={{ width: 16, height: 16 }} />
            Apply Leave
          </button>

          {!isEmployee && (
            <>
              <button 
                className="btn btn-secondary" 
                style={{ borderColor: '#0d9488', color: '#0d9488', background: 'rgba(13, 148, 136, 0.05)' }}
                onClick={() => handleOpenBasicSalaryModal(selectedUserObj || staffUsers[0])}
              >
                <DollarSign style={{ width: 16, height: 16, color: '#0d9488' }} />
                Set Basic Salary
              </button>

              <button 
                className="btn btn-secondary" 
                style={{ borderColor: '#6366f1', color: '#6366f1', background: 'rgba(99, 102, 241, 0.05)' }} 
                onClick={handleBatchGenerateSalaries}
                disabled={isGeneratingBatch}
              >
                <Zap style={{ width: 16, height: 16, color: '#6366f1' }} />
                {isGeneratingBatch ? 'Generating Payroll...' : `Batch Generate ${selectedMonth} Salary`}
              </button>

              <button className="btn btn-primary" onClick={() => setShowSalaryModal(true)}>
                <DollarSign style={{ width: 16, height: 16 }} />
                Process Salary Slip
              </button>
            </>
          )}
        </div>
      </div>

      {/* TAB 1: Daily Attendance Register */}
      {activeTab === 'attendance' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
              {isEmployee ? 'My Daily Punch & Attendance Logs' : 'All Staff Daily Attendance Register'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Source: Mobile GPS / Biometric Hardware / Web Check-in
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
                {!isEmployee && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {displayedAttendance.map(att => (
                <tr key={att.id}>
                  <td><strong>{(users || []).find(u => u.id === att.userId)?.name || (att.userName && att.userName !== 'Staff Member' ? att.userName : 'Staff Member')}</strong></td>
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
                    <span className={`badge ${att.status === 'LATE' ? 'badge-pending' : 'badge-present'}`}>
                      {att.status === 'LATE' ? '⏰ LATE ENTRY' : `✓ ${att.status}`}
                    </span>
                  </td>
                  {!isEmployee && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        <button 
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: '#2563eb', borderColor: 'rgba(37, 99, 235, 0.3)' }}
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
                          <Edit2 size={14} color="#2563eb" />
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
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: HR Monthly Report & Overview (Superadmin Only) */}
      {!isEmployee && activeTab === 'monthly_report' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
                HR Monthly Attendance & Payroll Summary Report ({selectedMonth} {selectedYear})
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Aggregates working days, present days, late entry counts, and salary status per employee.
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleBatchGenerateSalaries} disabled={isGeneratingBatch}>
              <Zap size={15} /> {isGeneratingBatch ? 'Processing...' : `Generate All Staff Salary Slips`}
            </button>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Role / Dept</th>
                <th>Working Days</th>
                <th>Present Days</th>
                <th>Late Entries</th>
                <th>Absent Days</th>
                <th>Leaves</th>
                <th>Base Salary</th>
                <th>Salary Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMonthlyReport.map(item => (
                <tr key={item.userId}>
                  <td>
                    <strong>{item.userName}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.email}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {item.designation}
                    </span>
                  </td>
                  <td>{item.totalWorkingDays} Days</td>
                  <td><strong style={{ color: '#10b981' }}>{item.presentDays} Days</strong></td>
                  <td>
                    <span style={{ color: item.lateEntries > 0 ? '#f59e0b' : '#64748b', fontWeight: item.lateEntries > 0 ? 700 : 400 }}>
                      {item.lateEntries} Times
                    </span>
                  </td>
                  <td>{item.absentDays} Days</td>
                  <td>{item.approvedLeaves} Days</td>
                  <td>₹{item.baseSalary ? item.baseSalary.toLocaleString() : 45000}</td>
                  <td>
                    <span className={`badge ${item.salaryStatus === 'PROCESSED' ? 'badge-approved' : 'badge-pending'}`}>
                      {item.salaryStatus}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', borderColor: '#0d9488', color: '#0d9488', background: 'rgba(13, 148, 136, 0.05)' }}
                        onClick={() => handleOpenBasicSalaryModal(item)}
                        title="Set or Edit Employee Basic Salary"
                      >
                        <Edit2 size={13} /> Set Basic Sal
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          setNewSalary({
                            userId: item.userId,
                            month: selectedMonth,
                            year: selectedYear,
                            baseSalary: (item.baseSalary || 30000).toString(),
                            overtimeHours: '0',
                            allowances: '2500',
                            deductions: (item.lateEntries * 250).toString()
                          });
                          setShowSalaryModal(true);
                        }}
                      >
                        <DollarSign size={13} /> Process Salary
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Leave Management & Approvals */}
      {activeTab === 'leaves' && (
        <div className="glass-card">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem' }}>
            {isEmployee ? 'My Leave Applications & Approval Status' : 'Employee Leave Requests & Approval Workflow'}
          </h3>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Approval Status</th>
                <th>Approved By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedLeaves.map(l => (
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
                      {l.status === 'PENDING' && !isEmployee && (
                        <button className="btn btn-primary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }} onClick={() => handleApproveLeave(l.id)}>
                          Approve
                        </button>
                      )}
                      {!isEmployee && (
                        <>
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: '#2563eb', borderColor: 'rgba(37, 99, 235, 0.3)' }}
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
                            <Edit2 size={14} color="#2563eb" />
                          </button>
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                            title="Delete Leave Request"
                            onClick={() => setDeletingLeave(l)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: Salary Management & Salary Slips */}
      {activeTab === 'payroll' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
                {isEmployee ? 'My Digital Salary Slips' : 'Payroll Integration & Digital Salary Slips'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Calculates base salary, overtime, statutory PF, tax, and late entry deductions automatically.
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
              {displayedSalaryRecords.map(sal => (
                <tr key={sal.id}>
                  <td>
                    <strong>{sal.userName}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sal.designation}</div>
                  </td>
                  <td>{sal.month} {sal.year}</td>
                  <td>₹{sal.baseSalary ? sal.baseSalary.toLocaleString() : 0}</td>
                  <td>{sal.overtimeHours} hrs (₹{sal.overtimePay ? sal.overtimePay.toLocaleString() : 0})</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--brand-red)' }}>
                    -₹{((sal.pfDeduction || 0) + (sal.taxDeduction || 0)).toLocaleString()}
                  </td>
                  <td><strong style={{ color: 'var(--brand-green)', fontSize: '0.95rem' }}>₹{sal.netSalary ? sal.netSalary.toLocaleString() : 0}</strong></td>
                  <td>
                    <span className="badge badge-approved">{sal.status}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setSelectedSalarySlip(sal)} title="View Slip">
                        <FileText style={{ width: 14, height: 14, color: 'var(--brand-yellow)' }} />
                      </button>
                      {!isEmployee && (
                        <>
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: '#2563eb', borderColor: 'rgba(37, 99, 235, 0.3)' }}
                            title="Edit Salary Record"
                            onClick={() => {
                              setEditingSal(sal);
                              setEditSalData({
                                month: sal.month || selectedMonth,
                                year: sal.year || selectedYear,
                                baseSalary: sal.baseSalary || 45000,
                                overtimeHours: sal.overtimeHours || 0,
                                allowances: sal.allowances || 0,
                                deductions: sal.deductions || 0,
                                status: sal.status || 'PROCESSED'
                              });
                            }}
                          >
                            <Edit2 size={14} color="#2563eb" />
                          </button>
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                            title="Delete Salary Record"
                            onClick={() => setDeletingSal(sal)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Apply Leave Modal */}
      {showLeaveModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Apply for Employee Leave
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
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reason for Application</label>
                <textarea 
                  className="input-field" 
                  rows={2}
                  value={newLeave.reason}
                  onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })}
                  placeholder="State the reason for leave"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLeaveModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Leave Application</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Process Salary Slip Modal */}
      {showSalaryModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Generate Employee Salary Slip
            </h3>
            <form onSubmit={handleGenerateSalary} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select Employee</label>
                <select 
                  className="select-field"
                  value={newSalary.userId}
                  onChange={e => handleSelectSalaryUser(e.target.value)}
                >
                  <option value="">Select Employee</option>
                  {staffUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({formatUserRole(u.role)})</option>
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
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Late & Other Deductions (₹)</label>
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

      {/* Modal 3: Digital Salary Slip Preview */}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem', marginBottom: '1.25rem', background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
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
                  <span>Late & Other Deductions:</span>
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
              <button className="btn btn-secondary" onClick={handleDownloadPayslip}>
                <Download style={{ width: 16, height: 16 }} /> Print / Download Payslip
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedSalarySlip(null)}>
                Close Payslip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Edit Attendance Log */}
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
              Are you sure you want to delete attendance record for <strong>{deletingAtt.userName}</strong>?
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
              Are you sure you want to delete leave application for <strong>{deletingLeave.userName}</strong>?
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

      {/* Modal 5: Set Employee Basic Salary Modal */}
      {showBasicSalaryModal && basicSalaryUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Set Basic Salary for Employee
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Configure fixed monthly basic salary for <strong>{basicSalaryUser.userName || basicSalaryUser.name}</strong> ({basicSalaryUser.designation || 'Staff'}).
            </p>

            <form onSubmit={handleSaveBasicSalary} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                  Select Employee Staff Member
                </label>
                <select
                  className="input-field"
                  style={{ width: '100%' }}
                  value={basicSalaryUser.id || basicSalaryUser.userId}
                  onChange={e => {
                    const selected = staffUsers.find(u => u.id === e.target.value);
                    if (selected) {
                      setBasicSalaryUser(selected);
                      setBasicSalaryInput((selected.baseSalary || selected.basicSalary || 30000).toString());
                    }
                  }}
                >
                  {staffUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({formatUserRole(u.role)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                  Basic Salary Amount (₹ / Month)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#64748b' }}>₹</span>
                  <input 
                    type="number"
                    required
                    min="0"
                    step="500"
                    className="input-field" 
                    style={{ paddingLeft: '2.2rem' }}
                    value={basicSalaryInput}
                    onChange={e => setBasicSalaryInput(e.target.value)}
                    placeholder="e.g. 35000"
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                  This amount will be saved to the PostgreSQL database for {basicSalaryUser.userName || basicSalaryUser.name} and used for payroll processing.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBasicSalaryModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#0d9488', borderColor: '#0d9488' }}>
                  Save Basic Salary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee ID Card Modal */}
      {showIDCardModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
            <EmployeeIDCard employeeId={activeUser?.id || 'usr-4'} />
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowIDCardModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
