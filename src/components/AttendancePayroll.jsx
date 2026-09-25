import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  LogIn,
  LogOut,
  MapPin,
  Grid,
  List,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { parseCoordinates, reverseGeocode } from '../utils/locationUtils';
import { toast } from './common/ToastNotification';

const LocationDisplay = ({ location }) => {
  const [address, setAddress] = useState(location || 'Office HO (Web Punch)');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const coords = parseCoordinates(location);
    if (coords) {
      setLoading(true);
      reverseGeocode(coords.lat, coords.lng)
        .then(resolved => {
          if (isMounted && resolved) {
            setAddress(resolved);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setAddress(location || 'Office HO (Web Punch)');
    }
    return () => { isMounted = false; };
  }, [location]);

  return (
    <span title={location || ''} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', wordBreak: 'break-word' }}>
      📍 {address}
      {loading && <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>(resolving...)</span>}
    </span>
  );
};


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

export default function AttendancePayroll({ data = {}, currentRole, currentUser, onRefresh, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab || 'attendance'); // 'attendance' | 'monthly_report' | 'leaves' | 'payroll'
  const [selectedSalarySlip, setSelectedSalarySlip] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

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

  // Set Salary & Payroll Breakdown Modal State
  const [showBasicSalaryModal, setShowBasicSalaryModal] = useState(false);
  const [basicSalaryUser, setBasicSalaryUser] = useState(null);
  const [salaryInputs, setSalaryInputs] = useState({
    basicSalary: '30000',
    others1: '0',
    others2: '0',
    others3: '0',
    others4: '0',
    epfShare: '3600',
    esiShare: '225',
    pTax: '110'
  });

  const handleOpenBasicSalaryModal = (user) => {
    setBasicSalaryUser(user);
    const basic = user.basicSalary || user.baseSalary || 0;
    const o1 = user.others1 || 0;
    const o2 = user.others2 || 0;
    const o3 = user.others3 || 0;
    const o4 = user.others4 || 0;
    const gross = basic + o1 + o2 + o3 + o4;

    const defaultEpf = user.epfShare !== undefined && user.epfShare !== null && user.epfShare > 0 
      ? user.epfShare 
      : Math.round(basic * 0.12);

    const defaultEsi = user.esiShare !== undefined && user.esiShare !== null && user.esiShare > 0 
      ? user.esiShare 
      : Math.round(gross * 0.0075);

    const defaultPtax = user.pTax !== undefined && user.pTax !== null ? user.pTax : 110;

    setSalaryInputs({
      basicSalary: basic.toString(),
      others1: o1.toString(),
      others2: o2.toString(),
      others3: o3.toString(),
      others4: o4.toString(),
      epfShare: defaultEpf.toString(),
      esiShare: defaultEsi.toString(),
      pTax: defaultPtax.toString()
    });
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
        body: JSON.stringify({
          basicSalary: Number(salaryInputs.basicSalary) || 0,
          others1: Number(salaryInputs.others1) || 0,
          others2: Number(salaryInputs.others2) || 0,
          others3: Number(salaryInputs.others3) || 0,
          others4: Number(salaryInputs.others4) || 0,
          epfShare: Number(salaryInputs.epfShare) || 0,
          esiShare: Number(salaryInputs.esiShare) || 0,
          pTax: Number(salaryInputs.pTax) || 0
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowBasicSalaryModal(false);
        fetchAttendanceData();
        fetchMonthlyReport();
        if (onRefresh) onRefresh();
        toast.success(`Salary details successfully updated for ${basicSalaryUser.userName || basicSalaryUser.name}`);
      } else {
        toast.error(json.message || 'Failed to update salary details');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating salary details');
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
  const [showSummaryCards, setShowSummaryCards] = useState(true);

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
    others1: '0',
    others2: '0',
    others3: '0',
    others4: '0',
    epfShare: '5400',
    esiShare: '338',
    pTax: '110',
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
    const lateCount = userAtt.filter(a => a.status === 'LATE' || a.status === 'Late').length;
    const basic = selectedUser.basicSalary || selectedUser.baseSalary || selectedUser.salary || 45000;
    const o1 = selectedUser.others1 || 0;
    const o2 = selectedUser.others2 || 0;
    const o3 = selectedUser.others3 || 0;
    const o4 = selectedUser.others4 || 0;
    const gross = basic + o1 + o2 + o3 + o4;

    const defaultEpf = selectedUser.epfShare !== undefined && selectedUser.epfShare !== null && selectedUser.epfShare > 0 
      ? selectedUser.epfShare 
      : Math.round(basic * 0.12);

    const defaultEsi = selectedUser.esiShare !== undefined && selectedUser.esiShare !== null && selectedUser.esiShare > 0 
      ? selectedUser.esiShare 
      : Math.round(gross * 0.0075);

    const defaultPtax = selectedUser.pTax !== undefined && selectedUser.pTax !== null ? selectedUser.pTax : 110;
    const autoDeductions = lateCount * 250;

    setNewSalary(prev => ({
      ...prev,
      userId,
      baseSalary: basic.toString(),
      others1: o1.toString(),
      others2: o2.toString(),
      others3: o3.toString(),
      others4: o4.toString(),
      epfShare: defaultEpf.toString(),
      esiShare: defaultEsi.toString(),
      pTax: defaultPtax.toString(),
      allowances: (o1 + o2 + o3 + o4).toString(),
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
        toast.success(json.message || 'Batch salary generation completed');
        fetchAttendanceData();
        fetchMonthlyReport();
        if (onRefresh) onRefresh();
      } else {
        toast.error(json.message || 'Failed to generate batch salaries');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error processing batch salary generation');
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
          baseSalary: Number(newSalary.baseSalary) || 0,
          basicSalary: Number(newSalary.baseSalary) || 0,
          others1: Number(newSalary.others1) || 0,
          others2: Number(newSalary.others2) || 0,
          others3: Number(newSalary.others3) || 0,
          others4: Number(newSalary.others4) || 0,
          epfShare: Number(newSalary.epfShare) || 0,
          esiShare: Number(newSalary.esiShare) || 0,
          pTax: Number(newSalary.pTax) || 0,
          allowances: ((Number(newSalary.others1)||0) + (Number(newSalary.others2)||0) + (Number(newSalary.others3)||0) + (Number(newSalary.others4)||0)) || Number(newSalary.allowances) || 0,
          userName: selectedUser ? selectedUser.name : 'Staff Member'
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowSalaryModal(false);
        fetchAttendanceData();
        fetchMonthlyReport();
        if (onRefresh) onRefresh();
        toast.success(json.message || `Salary details updated & payslip generated successfully!`);
      } else {
        toast.error(json.message || 'Failed to generate salary slip');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error generating salary slip');
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

  const [attendanceViewMode, setAttendanceViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);

  const hasPunchedToday = (attendance || []).some(a => {
    const isSameUser = (activeUser?.id && a.userId === activeUser.id) || (activeUser?.name && a.userName?.toLowerCase() === activeUser.name.toLowerCase());
    if (!isSameUser || !a.date) return false;
    const aDateStr = typeof a.date === 'string' ? a.date.slice(0, 10) : new Date(a.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return aDateStr === todayStr && Boolean(a.checkInTime);
  });

  const hasPunchedOutToday = (attendance || []).some(a => {
    const isSameUser = (activeUser?.id && a.userId === activeUser.id) || (activeUser?.name && a.userName?.toLowerCase() === activeUser.name.toLowerCase());
    if (!isSameUser || !a.date) return false;
    const aDateStr = typeof a.date === 'string' ? a.date.slice(0, 10) : new Date(a.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return aDateStr === todayStr && Boolean(a.checkOutTime);
  });

  const handleWebCheckIn = async () => {
    setIsPunching(true);

    const submitPunch = async (coords = null) => {
      try {
        let locationName = 'Office HO (Web Check-In)';
        if (coords) {
          locationName = `GPS (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`;
          try {
            const resolvedAddr = await reverseGeocode(coords.latitude, coords.longitude);
            if (resolvedAddr) {
              locationName = resolvedAddr;
            }
          } catch (geoErr) {
            console.warn('Reverse geocoding error during check-in:', geoErr);
          }
        }

        const payload = {
          userId: activeUser?.id,
          userName: activeUser?.name || activeUser?.email || 'Staff Member',
          method: 'WEB',
          location: locationName
        };
        if (coords) {
          payload.latitude = coords.latitude;
          payload.longitude = coords.longitude;
        }

        const res = await fetch('/api/attendance/check-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          fetchAttendanceData();
          fetchMonthlyReport();
          if (onRefresh) onRefresh();
          if (json.alreadyPunched) {
            toast.info(json.message || `Check-in already recorded today at ${json.data?.checkInTime}`, 'Attendance Record Exist');
          } else {
            toast.success(`Check-In Successful!\nStatus: ${json.data.status}\nTime: ${json.data.checkInTime}\nLocation: ${json.data.location}`, 'Check-In Recorded');
          }
        } else {
          toast.error(json.message || 'Attendance check-in failed');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error recording attendance check-in');
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

  const handleWebCheckOut = async () => {
    setIsPunching(true);

    const submitPunchOut = async (coords = null) => {
      try {
        let locationName = 'Office HO (Web Check-Out)';
        if (coords) {
          locationName = `GPS (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`;
          try {
            const resolvedAddr = await reverseGeocode(coords.latitude, coords.longitude);
            if (resolvedAddr) {
              locationName = resolvedAddr;
            }
          } catch (geoErr) {
            console.warn('Reverse geocoding error during check-out:', geoErr);
          }
        }

        const payload = {
          userId: activeUser?.id,
          userName: activeUser?.name || activeUser?.email || 'Staff Member',
          method: 'WEB',
          location: locationName
        };
        if (coords) {
          payload.latitude = coords.latitude;
          payload.longitude = coords.longitude;
        }

        const res = await fetch('/api/attendance/check-out', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success) {
          fetchAttendanceData();
          fetchMonthlyReport();
          if (onRefresh) onRefresh();
          toast.success(`Check-Out Recorded Successfully!\nTime: ${json.data?.checkOutTime || 'Out'}\nLocation: ${json.data?.location || locationName}`, 'Check-Out Recorded');
        } else {
          toast.error(json.message || 'Attendance check-out failed');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error recording attendance check-out');
      } finally {
        setIsPunching(false);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          submitPunchOut({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation unavailable or denied:', error.message);
          submitPunchOut(null);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      submitPunchOut(null);
    }
  };

  // Month Calendar Days Generator for selected employee & month
  const calendarDays = useMemo(() => {
    const monthMap = {
      'January': 0, 'February': 1, 'March': 2, 'April': 3,
      'May': 4, 'June': 5, 'July': 6, 'August': 7,
      'September': 8, 'October': 9, 'November': 10, 'December': 11
    };
    const mIdx = monthMap[selectedMonth] !== undefined ? monthMap[selectedMonth] : 8;
    const yr = Number(selectedYear) || 2026;
    const totalDaysInMonth = new Date(yr, mIdx + 1, 0).getDate();

    const days = [];
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const dateObj = new Date(yr, mIdx, dayNum);
      const dateStr = `${yr}-${String(mIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat
      const isSunday = dayOfWeek === 0;

      // Find attendance log for this date and selected staff
      const attRecord = (displayedAttendance || []).find(a => {
        if (!a.date) return false;
        const d = typeof a.date === 'string' ? a.date.slice(0, 10) : new Date(a.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        return d === dateStr;
      });

      // Find leave record for this date
      const leaveRecord = (displayedLeaves || []).find(l => {
        if (l.status !== 'APPROVED') return false;
        const s = typeof l.startDate === 'string' ? l.startDate.slice(0, 10) : new Date(l.startDate).toISOString().slice(0, 10);
        const e = typeof l.endDate === 'string' ? l.endDate.slice(0, 10) : new Date(l.endDate).toISOString().slice(0, 10);
        return dateStr >= s && dateStr <= e;
      });

      let status = 'UPCOMING';
      if (attRecord) {
        status = attRecord.status || 'PRESENT';
      } else if (leaveRecord) {
        status = 'LEAVE';
      } else if (isSunday) {
        status = 'WEEKEND';
      } else if (dateStr < todayStr) {
        status = 'ABSENT';
      }

      days.push({
        dayNum,
        dateObj,
        dateStr,
        dayOfWeek,
        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
        attRecord,
        leaveRecord,
        status
      });
    }

    return days;
  }, [selectedMonth, selectedYear, displayedAttendance, displayedLeaves]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      
      {/* Overview Header & Metric Cards (Collapsible) */}
      {showSummaryCards && (
        <>
          {/* Enterprise HR Header Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff',
            padding: '0.35rem 0.65rem',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            border: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '0.4rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{
                width: 26,
                height: 26,
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                color: '#fff',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                <ShieldCheck size={15} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.92rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                  {isEmployee ? 'My Attendance & Salary Portal' : 'HR Portal & Payroll Management'}
                </h2>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                  {isEmployee ? `Logged in as ${currentUser?.name || 'Employee'}` : 'Superadmin HR Overview & Payroll Generation System'}
                </div>
              </div>
            </div>

            {/* Month, Year & Staff Filters + Toggle Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
              {!isEmployee && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#f8fafc', padding: '0.15rem 0.4rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <Users size={12} color="#64748b" />
                  <select 
                    value={selectedStaffId} 
                    onChange={e => setSelectedStaffId(e.target.value)}
                    style={{ border: 'none', background: 'transparent', fontSize: '0.74rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer', outline: 'none', maxWidth: 145 }}
                  >
                    <option value="ALL">👤 All Staff</option>
                    {staffUsers.map(u => (
                      <option key={u.id} value={u.id}>👤 {u.name} ({formatUserRole(u.role)})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#f8fafc', padding: '0.15rem 0.4rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <Calendar size={12} color="#64748b" />
                <select 
                  value={selectedMonth} 
                  onChange={e => setSelectedMonth(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: '0.74rem', fontWeight: 600, color: '#334155', cursor: 'pointer', outline: 'none' }}
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select 
                  value={selectedYear} 
                  onChange={e => setSelectedYear(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: '0.74rem', fontWeight: 600, color: '#334155', cursor: 'pointer', outline: 'none' }}
                >
                  {['2025', '2026', '2027'].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={12} color="#94a3b8" style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    padding: '0.18rem 0.4rem 0.18rem 1.45rem',
                    fontSize: '0.74rem',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    outline: 'none',
                    width: 110
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowSummaryCards(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.18rem 0.45rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#475569',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Hide top header and stats to show only table view"
              >
                <EyeOff size={12} color="#64748b" />
                Hide Stats
              </button>
            </div>
          </div>

          {/* Overview Metric Ribbon Bar (Ultra-Compact Single Row) */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
            gap: '0.4rem'
          }}>
            {isEmployee ? (
              <>
                <div style={{ background: '#ffffff', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <UserCheck size={12} color="#10b981" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', lineHeight: 1.1 }}>Present Days</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10b981' }}>{employeePresentDays} Days</div>
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '4px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={12} color="#f59e0b" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', lineHeight: 1.1 }}>Late Entries</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f59e0b' }}>{employeeLateDays} Times</div>
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '4px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Calendar size={12} color="#3b82f6" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', lineHeight: 1.1 }}>Approved Leaves</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#3b82f6' }}>{employeeLeavesCount} Days</div>
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <DollarSign size={12} color="#10b981" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', lineHeight: 1.1 }}>Salary Status</div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981' }}>
                      {displayedSalaryRecords.length > 0 ? displayedSalaryRecords[0].status : 'PROCESSED'}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ background: '#ffffff', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '4px', background: 'rgba(59, 130, 246, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Users size={12} color="#3b82f6" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', lineHeight: 1.1 }}>
                      {selectedStaffId !== 'ALL' ? (selectedUserObj?.name || 'Selected') : 'Total Staff'}
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                      {selectedStaffId !== 'ALL' ? (selectedUserObj?.designation || 'Staff') : `${monthlyStats.totalEmployees ?? users.length} Staff`}
                    </div>
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <UserCheck size={12} color="#10b981" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', lineHeight: 1.1 }}>
                      Present ({selectedMonth.slice(0, 3)})
                    </div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10b981' }}>
                      {selectedStaffId !== 'ALL'
                        ? displayedAttendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length
                        : (monthlyStats.totalPresentDays ?? 0)} Days
                    </div>
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '4px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={12} color="#f59e0b" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', lineHeight: 1.1 }}>Late Entries</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f59e0b' }}>
                      {selectedStaffId !== 'ALL'
                        ? displayedAttendance.filter(a => a.status === 'LATE').length
                        : (monthlyStats.totalLateEntries ?? 0)} Times
                    </div>
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '4px', background: 'rgba(99, 102, 241, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <DollarSign size={12} color="#6366f1" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', lineHeight: 1.1 }}>Salaries Done</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#6366f1' }}>
                      {selectedStaffId !== 'ALL'
                        ? displayedSalaryRecords.length
                        : (monthlyStats.totalSalariesProcessed ?? 0)} Slips
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Navigation Tabs Bar & Contextual Action Toolbar (Ultra-Compact High Density) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem', background: '#ffffff', padding: '0.25rem 0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '2px', background: '#f1f5f9', padding: '2px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            <button 
              className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.18rem 0.45rem', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '0.2rem', borderRadius: '4px' }}
              onClick={() => setActiveTab('attendance')}
            >
              <UserCheck style={{ width: 12, height: 12 }} />
              Daily Punch Log ({displayedAttendance.length})
            </button>

            {!isEmployee && (
              <button 
                className={`btn ${activeTab === 'monthly_report' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.18rem 0.45rem', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '0.2rem', borderRadius: '4px' }}
                onClick={() => setActiveTab('monthly_report')}
              >
                <BarChart3 style={{ width: 12, height: 12 }} />
                HR Monthly Report ({monthlyReport.length})
              </button>
            )}

            <button 
              className={`btn ${activeTab === 'leaves' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.18rem 0.45rem', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '0.2rem', borderRadius: '4px' }}
              onClick={() => setActiveTab('leaves')}
            >
              <Calendar style={{ width: 12, height: 12 }} />
              Leave Requests ({displayedLeaves.length})
            </button>
            
            <button 
              className={`btn ${activeTab === 'payroll' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.18rem 0.45rem', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '0.2rem', borderRadius: '4px' }}
              onClick={() => setActiveTab('payroll')}
            >
              <DollarSign style={{ width: 12, height: 12 }} />
              Salary Slips & Payroll ({displayedSalaryRecords.length})
            </button>
          </div>

          {!showSummaryCards && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowSummaryCards(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  padding: '0.18rem 0.45rem',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#2563eb',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
                title="Show top header title & summary metrics ribbon"
              >
                <Eye size={12} color="#2563eb" />
                Show Overview
              </button>

              {!isEmployee && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#f8fafc', padding: '0.15rem 0.35rem', borderRadius: '5px', border: '1px solid #cbd5e1' }}>
                  <Users size={12} color="#64748b" />
                  <select 
                    value={selectedStaffId} 
                    onChange={e => setSelectedStaffId(e.target.value)}
                    style={{ border: 'none', background: 'transparent', fontSize: '0.72rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer', outline: 'none', maxWidth: 120 }}
                  >
                    <option value="ALL">All Staff</option>
                    {staffUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: '#f8fafc', padding: '0.15rem 0.35rem', borderRadius: '5px', border: '1px solid #cbd5e1' }}>
                <Calendar size={12} color="#64748b" />
                <select 
                  value={selectedMonth} 
                  onChange={e => setSelectedMonth(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: '0.72rem', fontWeight: 600, color: '#334155', cursor: 'pointer', outline: 'none' }}
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m} value={m}>{m.slice(0, 3)}</option>
                  ))}
                </select>
                <select 
                  value={selectedYear} 
                  onChange={e => setSelectedYear(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: '0.72rem', fontWeight: 600, color: '#334155', cursor: 'pointer', outline: 'none' }}
                >
                  {['2025', '2026', '2027'].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={12} color="#94a3b8" style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    padding: '0.15rem 0.35rem 0.15rem 1.35rem',
                    fontSize: '0.72rem',
                    borderRadius: '5px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    outline: 'none',
                    width: 95
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tab-Contextual & Always-Visible Action Buttons Bar */}
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* ALWAYS VISIBLE: Punch In & Punch Out Buttons */}
          <button 
            className="btn btn-primary" 
            style={{ 
              padding: '0.2rem 0.5rem', 
              fontSize: '0.74rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.2rem', 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
              border: 'none',
              boxShadow: '0 1px 4px rgba(16, 185, 129, 0.25)',
              borderRadius: '5px',
              cursor: isPunching ? 'not-allowed' : 'pointer'
            }} 
            onClick={handleWebCheckIn}
            disabled={isPunching}
            title="Record morning attendance check-in"
          >
            <LogIn style={{ width: 12, height: 12 }} />
            {isPunching ? 'Punching...' : 'Punch In'}
          </button>

          <button 
            className="btn btn-primary" 
            style={{ 
              padding: '0.2rem 0.5rem', 
              fontSize: '0.74rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.2rem', 
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
              border: 'none',
              boxShadow: '0 1px 4px rgba(245, 158, 11, 0.25)',
              borderRadius: '5px',
              cursor: isPunching ? 'not-allowed' : 'pointer'
            }} 
            onClick={handleWebCheckOut}
            disabled={isPunching}
            title="Record evening attendance check-out"
          >
            <LogOut style={{ width: 12, height: 12 }} />
            {isPunching ? 'Punching...' : 'Punch Out'}
          </button>

          {/* TAB 2: Leaves Specific Actions */}
          {activeTab === 'leaves' && (
            <button 
              className="btn btn-primary" 
              style={{ padding: '0.2rem 0.5rem', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '0.2rem', borderRadius: '5px' }}
              onClick={() => setShowLeaveModal(true)}
            >
              <Plus style={{ width: 12, height: 12 }} />
              Apply Leave
            </button>
          )}

          {/* TAB 3: Payroll Specific Actions */}
          {activeTab === 'payroll' && (
            <>
              {!isEmployee && (
                <>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.2rem 0.45rem', fontSize: '0.74rem', borderColor: '#0d9488', color: '#0d9488', background: 'rgba(13, 148, 136, 0.05)', borderRadius: '5px' }}
                    onClick={() => handleOpenBasicSalaryModal(selectedUserObj || staffUsers[0])}
                  >
                    Set Basic Salary
                  </button>

                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.2rem 0.45rem', fontSize: '0.74rem', borderColor: '#6366f1', color: '#6366f1', background: 'rgba(99, 102, 241, 0.05)', display: 'flex', alignItems: 'center', gap: '0.2rem', borderRadius: '5px' }} 
                    onClick={handleBatchGenerateSalaries}
                    disabled={isGeneratingBatch}
                  >
                    <Zap style={{ width: 12, height: 12, color: '#6366f1' }} />
                    {isGeneratingBatch ? 'Generating Payroll...' : `Batch Generate ${selectedMonth.slice(0, 3)} Salary`}
                  </button>

                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '0.2rem', borderRadius: '5px' }} 
                    onClick={() => setShowSalaryModal(true)}
                  >
                    <DollarSign style={{ width: 12, height: 12 }} />
                    Process Salary Slip
                  </button>
                </>
              )}
              {isEmployee && (
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '0.2rem', borderRadius: '5px' }}
                  onClick={() => setShowLeaveModal(true)}
                >
                  <Plus style={{ width: 12, height: 12 }} />
                  Apply Leave
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* TAB 1: Daily Attendance Register / Calendar View */}
      {activeTab === 'attendance' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                {isEmployee ? 'My Attendance Calendar & Punch Logs' : 'All Staff Attendance Calendar & Daily Register'}
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Viewing: {selectedStaffId !== 'ALL' ? (selectedUserObj?.name || 'Selected Employee') : 'All Staff Members'} ({selectedMonth} {selectedYear})
              </span>
            </div>

            {/* View Mode Toggle: Calendar vs Table List */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#f1f5f9', padding: '0.2rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <button
                type="button"
                className={`btn ${attendanceViewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                onClick={() => setAttendanceViewMode('calendar')}
              >
                <Grid size={14} />
                Month Calendar View
              </button>
              <button
                type="button"
                className={`btn ${attendanceViewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.25rem 0.65rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                onClick={() => setAttendanceViewMode('list')}
              >
                <List size={14} />
                Register Table View ({displayedAttendance.length})
              </button>
            </div>
          </div>

          {/* Month Calendar Grid View */}
          {attendanceViewMode === 'calendar' ? (
            <div>
              {/* Status Legend Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', fontSize: '0.78rem', background: '#f8fafc', padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>Legend:</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#166534', fontWeight: 600 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }}></span> Present</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#92400e', fontWeight: 600 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }}></span> Late Entry</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#1e40af', fontWeight: 600 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }}></span> Leave</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#991b1b', fontWeight: 600 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></span> Absent</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#64748b', fontWeight: 600 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#cbd5e1' }}></span> Weekend Off</span>
              </div>

              {/* Days Grid (7 Columns) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
                gap: '0.75rem'
              }}>
                {calendarDays.map(day => {
                  let cardBg = '#ffffff';
                  let borderCol = '#e2e8f0';
                  let badgeClass = 'badge-present';
                  let badgeText = '✓ PRESENT';

                  if (day.status === 'PRESENT') {
                    cardBg = 'rgba(34, 197, 94, 0.04)';
                    borderCol = 'rgba(34, 197, 94, 0.3)';
                    badgeClass = 'badge-present';
                    badgeText = '✓ PRESENT';
                  } else if (day.status === 'LATE') {
                    cardBg = 'rgba(245, 158, 11, 0.05)';
                    borderCol = 'rgba(245, 158, 11, 0.4)';
                    badgeClass = 'badge-pending';
                    badgeText = '⏰ LATE';
                  } else if (day.status === 'LEAVE') {
                    cardBg = 'rgba(59, 130, 246, 0.05)';
                    borderCol = 'rgba(59, 130, 246, 0.3)';
                    badgeClass = 'badge-info';
                    badgeText = '🏖️ LEAVE';
                  } else if (day.status === 'ABSENT') {
                    cardBg = 'rgba(239, 68, 68, 0.04)';
                    borderCol = 'rgba(239, 68, 68, 0.25)';
                    badgeClass = 'badge-danger';
                    badgeText = '❌ ABSENT';
                  } else if (day.status === 'WEEKEND') {
                    cardBg = '#f8fafc';
                    borderCol = '#e2e8f0';
                    badgeText = 'WEEKEND';
                  } else {
                    cardBg = '#ffffff';
                    borderCol = '#e2e8f0';
                    badgeText = 'UPCOMING';
                  }

                  return (
                    <div 
                      key={day.dateStr}
                      onClick={() => setSelectedCalendarDay(day)}
                      style={{
                        background: cardBg,
                        border: `1.5px solid ${borderCol}`,
                        borderRadius: '10px',
                        padding: '0.65rem 0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        minHeight: 105
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                            {day.dayNum} <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>{day.dayName}</span>
                          </span>
                          <span style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }} className={badgeClass}>
                            {badgeText}
                          </span>
                        </div>

                        {day.attRecord ? (
                          <div style={{ fontSize: '0.73rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ color: '#166534', fontWeight: 600 }}>In: {day.attRecord.checkInTime || '--'}</div>
                            <div style={{ color: '#9a3412', fontWeight: 600 }}>Out: {day.attRecord.checkOutTime || 'Active'}</div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '0.2rem' }}>
                            {day.status === 'WEEKEND' ? 'Sunday Off' : day.status === 'LEAVE' ? 'Leave Approved' : day.status === 'ABSENT' ? 'No punch logged' : 'No logs yet'}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem', paddingTop: '0.35rem', borderTop: '1px dashed rgba(0,0,0,0.08)' }}>
                        <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 2 }}>
                          <MapPin size={10} /> {day.attRecord?.location ? 'GPS Location' : 'Details'}
                        </span>
                        <Eye size={12} color="#3b82f6" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
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
                    <td><LocationDisplay location={att.location} /></td>
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
          )}
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

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table" style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                  <th>SL NO</th>
                  <th>NAME OF EMPLOYEES</th>
                  <th>BASIC SALARY</th>
                  <th>OTHERS 1</th>
                  <th>OTHERS 2</th>
                  <th>OTHERS 3</th>
                  <th>OTHERS 4</th>
                  <th style={{ background: '#fef3c7', color: '#92400e' }}>TOTAL (GROSS)</th>
                  <th style={{ background: '#fee2e2', color: '#991b1b' }}>EPF SHARE 12%</th>
                  <th style={{ background: '#fee2e2', color: '#991b1b' }}>ESI SHARE 0.75%</th>
                  <th style={{ background: '#fee2e2', color: '#991b1b' }}>P TAX</th>
                  <th style={{ background: '#d1fae5', color: '#065f46', fontWeight: 800 }}>NET TAKE HOME SALARY</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredMonthlyReport.map((item, idx) => {
                  const basic = item.baseSalary || 0;
                  const o1 = item.others1 || 0;
                  const o2 = item.others2 || 0;
                  const o3 = item.others3 || 0;
                  const o4 = item.others4 || 0;
                  const totalAllow = item.allowances || (o1 + o2 + o3 + o4);
                  const gross = item.grossSalary || (basic + totalAllow);
                  const epf = item.epfShare || Math.round(basic * 0.12);
                  const esi = item.esiShare || Math.round(gross * 0.0075);
                  const pt = item.pTax !== undefined && item.pTax !== null ? item.pTax : 110;
                  const net = item.netSalary || (gross - epf - esi - pt);

                  return (
                    <tr key={item.userId}>
                      <td><strong>{idx + 1}</strong></td>
                      <td>
                        <strong>{item.userName}</strong>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.designation || 'Staff Member'}</div>
                      </td>
                      <td>₹{basic.toLocaleString()}</td>
                      <td>₹{o1.toLocaleString()}</td>
                      <td>₹{o2.toLocaleString()}</td>
                      <td>₹{o3.toLocaleString()}</td>
                      <td>₹{o4.toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: '#d97706', background: 'rgba(251, 191, 36, 0.08)' }}>₹{gross.toLocaleString()}</td>
                      <td style={{ color: '#dc2626' }}>₹{epf.toLocaleString()}</td>
                      <td style={{ color: '#dc2626' }}>₹{esi.toLocaleString()}</td>
                      <td style={{ color: '#dc2626' }}>₹{pt.toLocaleString()}</td>
                      <td style={{ fontWeight: 800, color: '#059669', background: 'rgba(16, 185, 129, 0.1)', fontSize: '0.92rem' }}>
                        ₹{net.toLocaleString()}
                      </td>
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
                            title="Set or Edit Full Salary Breakdown"
                          >
                            <Edit2 size={13} /> Edit Salary Fields
                          </button>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => {
                              setNewSalary({
                                userId: item.userId,
                                month: selectedMonth,
                                year: selectedYear,
                                baseSalary: basic.toString(),
                                overtimeHours: '0',
                                allowances: totalAllow.toString(),
                                deductions: (epf + esi + pt).toString()
                              });
                              setShowSalaryModal(true);
                            }}
                          >
                            <DollarSign size={13} /> Process Slip
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
          <div className="modal-content" style={{ maxWidth: 640 }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Generate Employee Salary Slip
            </h3>
            <form onSubmit={handleGenerateSalary} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select Employee</label>
                <select 
                  className="select-field"
                  value={newSalary.userId}
                  onChange={e => handleSelectSalaryUser(e.target.value)}
                  required
                >
                  <option value="">Select Employee</option>
                  {staffUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({formatUserRole(u.role)})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Base Salary (₹)</label>
                  <input 
                    type="number"
                    className="input-field" 
                    value={newSalary.baseSalary}
                    onChange={e => {
                      const val = e.target.value;
                      const num = Number(val) || 0;
                      const g = num + (Number(newSalary.others1)||0) + (Number(newSalary.others2)||0) + (Number(newSalary.others3)||0) + (Number(newSalary.others4)||0);
                      setNewSalary(prev => ({
                        ...prev,
                        baseSalary: val,
                        epfShare: Math.round(num * 0.12).toString(),
                        esiShare: Math.round(g * 0.0075).toString()
                      }));
                    }}
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

              {/* Allowances Breakdown */}
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--brand-teal)', marginBottom: '0.5rem' }}>ALLOWANCES BREAKDOWN (₹)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allowance 1 / HRA (₹)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={newSalary.others1} 
                      onChange={e => setNewSalary({ ...newSalary, others1: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allowance 2 / Special (₹)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={newSalary.others2} 
                      onChange={e => setNewSalary({ ...newSalary, others2: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allowance 3 / Conveyance (₹)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={newSalary.others3} 
                      onChange={e => setNewSalary({ ...newSalary, others3: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Allowance 4 / Medical (₹)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={newSalary.others4} 
                      onChange={e => setNewSalary({ ...newSalary, others4: e.target.value })} 
                    />
                  </div>
                </div>
              </div>

              {/* Statutory Deductions Breakdown */}
              <div style={{ background: 'rgba(239, 68, 68, 0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#ef4444', marginBottom: '0.5rem' }}>STATUTORY & OTHER DEDUCTIONS (₹)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>EPF Share 12% (₹)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={newSalary.epfShare} 
                      onChange={e => setNewSalary({ ...newSalary, epfShare: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ESI Share 0.75% (₹)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={newSalary.esiShare} 
                      onChange={e => setNewSalary({ ...newSalary, esiShare: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>P-Tax (₹)</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={newSalary.pTax} 
                      onChange={e => setNewSalary({ ...newSalary, pTax: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Late & Other Deductions (₹)</label>
                    <input 
                      type="number"
                      className="input-field" 
                      value={newSalary.deductions}
                      onChange={e => setNewSalary({ ...newSalary, deductions: e.target.value })}
                    />
                  </div>
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
          <div className="modal-content" style={{ border: '2px solid var(--brand-gold)', maxWidth: 680 }}>
            <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem', textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1e293b' }}>
                AKASH ENGINEERING - SALARY DETAILS - FOR V S DIGITECH TECHNOLOGY
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                KADARAT, NARENDRAPUR, KOLKATA 700150 | Mobile: 9831053297, 9062773542
              </div>
              <div style={{ marginTop: '0.5rem', fontWeight: 700, fontSize: '1rem', color: '#d97706' }}>
                OFFICIAL PAYSLIP - {selectedSalarySlip.month ? selectedSalarySlip.month.toUpperCase() : ''} {selectedSalarySlip.year}
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
                <h4 style={{ color: 'var(--brand-green)', fontSize: '0.9rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                  EARNINGS & ALLOWANCES
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>Basic Pay:</span>
                  <strong>₹{(selectedSalarySlip.baseSalary || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>Others Allowance 1:</span>
                  <strong>₹{(selectedSalarySlip.others1 || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>Others Allowance 2:</span>
                  <strong>₹{(selectedSalarySlip.others2 || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>Others Allowance 3:</span>
                  <strong>₹{(selectedSalarySlip.others3 || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>Others Allowance 4:</span>
                  <strong>₹{(selectedSalarySlip.others4 || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.4rem 0', borderTop: '1px solid #e2e8f0', color: '#b45309', fontWeight: 700 }}>
                  <span>TOTAL GROSS SALARY:</span>
                  <strong>₹{(selectedSalarySlip.grossSalary || ((selectedSalarySlip.baseSalary || 0) + (selectedSalarySlip.allowances || 0))).toLocaleString()}</strong>
                </div>
              </div>

              <div>
                <h4 style={{ color: 'var(--brand-red)', fontSize: '0.9rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                  DEDUCTIONS & STATUTORY
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>EPF Employee Share (12%):</span>
                  <strong style={{ color: '#dc2626' }}>₹{(selectedSalarySlip.pfDeduction || Math.round((selectedSalarySlip.baseSalary || 0) * 0.12)).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>ESI Employee Share (0.75%):</span>
                  <strong style={{ color: '#dc2626' }}>₹{(selectedSalarySlip.esiDeduction || Math.round((selectedSalarySlip.grossSalary || selectedSalarySlip.baseSalary || 0) * 0.0075)).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>P TAX:</span>
                  <strong style={{ color: '#dc2626' }}>₹{(selectedSalarySlip.pTaxDeduction !== undefined ? selectedSalarySlip.pTaxDeduction : 110).toLocaleString()}</strong>
                </div>
                {selectedSalarySlip.deductions > ((selectedSalarySlip.pfDeduction || 0) + (selectedSalarySlip.esiDeduction || 0) + (selectedSalarySlip.pTaxDeduction || 110)) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                    <span>Late & Other Deductions:</span>
                    <strong style={{ color: '#dc2626' }}>₹{(selectedSalarySlip.deductions - ((selectedSalarySlip.pfDeduction || 0) + (selectedSalarySlip.esiDeduction || 0) + (selectedSalarySlip.pTaxDeduction || 110))).toLocaleString()}</strong>
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>NET TAKE HOME SALARY:</div>
              <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--brand-green)' }}>
                ₹{(selectedSalarySlip.netSalary || 0).toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => window.print()}>
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

      {/* Modal 5: Set Employee Salary Breakdown Modal */}
      {showBasicSalaryModal && basicSalaryUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px', width: '95%' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '0.25rem' }}>
              Set Salary Details for Employee
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Configure monthly basic salary, allowance breakdown, and statutory deductions for <strong>{basicSalaryUser.userName || basicSalaryUser.name}</strong> ({basicSalaryUser.designation || 'Staff'}).
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
                      setSalaryInputs({
                        basicSalary: (selected.basicSalary || selected.baseSalary || 0).toString(),
                        others1: (selected.others1 || 0).toString(),
                        others2: (selected.others2 || 0).toString(),
                        others3: (selected.others3 || 0).toString(),
                        others4: (selected.others4 || 0).toString(),
                        pTax: (selected.pTax !== undefined && selected.pTax !== null ? selected.pTax : 110).toString()
                      });
                    }
                  }}
                >
                  {staffUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({formatUserRole(u.role)})</option>
                  ))}
                </select>
              </div>

              {/* Salary & Statutory Deductions Fields Inputs Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                    BASIC SALARY (₹)
                  </label>
                  <input 
                    type="number"
                    required
                    min="0"
                    className="input-field" 
                    value={salaryInputs.basicSalary}
                    onChange={e => {
                      const newBasic = e.target.value;
                      const b = Number(newBasic) || 0;
                      const o1 = Number(salaryInputs.others1) || 0;
                      const o2 = Number(salaryInputs.others2) || 0;
                      const o3 = Number(salaryInputs.others3) || 0;
                      const o4 = Number(salaryInputs.others4) || 0;
                      const gross = b + o1 + o2 + o3 + o4;
                      setSalaryInputs({ 
                        ...salaryInputs, 
                        basicSalary: newBasic,
                        epfShare: Math.round(b * 0.12).toString(),
                        esiShare: Math.round(gross * 0.0075).toString()
                      });
                    }}
                    placeholder="e.g. 7110"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                    OTHERS 1 (₹)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    className="input-field" 
                    value={salaryInputs.others1}
                    onChange={e => {
                      const newO1 = e.target.value;
                      const b = Number(salaryInputs.basicSalary) || 0;
                      const o1 = Number(newO1) || 0;
                      const o2 = Number(salaryInputs.others2) || 0;
                      const o3 = Number(salaryInputs.others3) || 0;
                      const o4 = Number(salaryInputs.others4) || 0;
                      const gross = b + o1 + o2 + o3 + o4;
                      setSalaryInputs({ 
                        ...salaryInputs, 
                        others1: newO1,
                        esiShare: Math.round(gross * 0.0075).toString()
                      });
                    }}
                    placeholder="e.g. 4890"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                    OTHERS 2 (₹)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    className="input-field" 
                    value={salaryInputs.others2}
                    onChange={e => {
                      const newO2 = e.target.value;
                      const b = Number(salaryInputs.basicSalary) || 0;
                      const o1 = Number(salaryInputs.others1) || 0;
                      const o2 = Number(newO2) || 0;
                      const o3 = Number(salaryInputs.others3) || 0;
                      const o4 = Number(salaryInputs.others4) || 0;
                      const gross = b + o1 + o2 + o3 + o4;
                      setSalaryInputs({ 
                        ...salaryInputs, 
                        others2: newO2,
                        esiShare: Math.round(gross * 0.0075).toString()
                      });
                    }}
                    placeholder="e.g. 2900"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                    OTHERS 3 (₹)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    className="input-field" 
                    value={salaryInputs.others3}
                    onChange={e => {
                      const newO3 = e.target.value;
                      const b = Number(salaryInputs.basicSalary) || 0;
                      const o1 = Number(salaryInputs.others1) || 0;
                      const o2 = Number(salaryInputs.others2) || 0;
                      const o3 = Number(newO3) || 0;
                      const o4 = Number(salaryInputs.others4) || 0;
                      const gross = b + o1 + o2 + o3 + o4;
                      setSalaryInputs({ 
                        ...salaryInputs, 
                        others3: newO3,
                        esiShare: Math.round(gross * 0.0075).toString()
                      });
                    }}
                    placeholder="e.g. 913"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>
                    OTHERS 4 (₹)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    className="input-field" 
                    value={salaryInputs.others4}
                    onChange={e => {
                      const newO4 = e.target.value;
                      const b = Number(salaryInputs.basicSalary) || 0;
                      const o1 = Number(salaryInputs.others1) || 0;
                      const o2 = Number(salaryInputs.others2) || 0;
                      const o3 = Number(salaryInputs.others3) || 0;
                      const o4 = Number(newO4) || 0;
                      const gross = b + o1 + o2 + o3 + o4;
                      setSalaryInputs({ 
                        ...salaryInputs, 
                        others4: newO4,
                        esiShare: Math.round(gross * 0.0075).toString()
                      });
                    }}
                    placeholder="e.g. 1300"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#dc2626', marginBottom: '0.25rem', display: 'block' }}>
                    EPF EMPLOYEE SHARE 12% (₹)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    className="input-field" 
                    style={{ borderColor: 'rgba(220, 38, 38, 0.4)' }}
                    value={salaryInputs.epfShare}
                    onChange={e => setSalaryInputs({ ...salaryInputs, epfShare: e.target.value })}
                    placeholder="e.g. 853"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#dc2626', marginBottom: '0.25rem', display: 'block' }}>
                    ESI EMPLOYEE SHARE 0.75% (₹)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    className="input-field" 
                    style={{ borderColor: 'rgba(220, 38, 38, 0.4)' }}
                    value={salaryInputs.esiShare}
                    onChange={e => setSalaryInputs({ ...salaryInputs, esiShare: e.target.value })}
                    placeholder="e.g. 90"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#dc2626', marginBottom: '0.25rem', display: 'block' }}>
                    P TAX DEDUCTION (₹)
                  </label>
                  <input 
                    type="number"
                    min="0"
                    className="input-field" 
                    value={salaryInputs.pTax}
                    onChange={e => setSalaryInputs({ ...salaryInputs, pTax: e.target.value })}
                    placeholder="e.g. 110"
                  />
                </div>
              </div>

              {/* Live Salary Calculations Box */}
              {(() => {
                const b = Number(salaryInputs.basicSalary) || 0;
                const o1 = Number(salaryInputs.others1) || 0;
                const o2 = Number(salaryInputs.others2) || 0;
                const o3 = Number(salaryInputs.others3) || 0;
                const o4 = Number(salaryInputs.others4) || 0;
                const totalAllow = o1 + o2 + o3 + o4;
                const gross = b + totalAllow;
                const epf = Number(salaryInputs.epfShare) || 0;
                const esi = Number(salaryInputs.esiShare) || 0;
                const pt = Number(salaryInputs.pTax) || 0;
                const net = gross - epf - esi - pt;

                return (
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 'var(--radius-md)', padding: '1rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.35rem' }}>
                      AUTOMATIC SALARY & STATUTORY BREAKDOWN SUMMARY
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.82rem' }}>
                      <div>Basic Pay: <strong>₹{b.toLocaleString()}</strong></div>
                      <div>Total Allowances (Others 1-4): <strong>₹{totalAllow.toLocaleString()}</strong></div>
                      <div style={{ color: '#b45309' }}>TOTAL (GROSS SALARY): <strong>₹{gross.toLocaleString()}</strong></div>
                      <div style={{ color: '#b91c1c' }}>EPF Employee Share (12%): <strong>₹{epf.toLocaleString()}</strong></div>
                      <div style={{ color: '#b91c1c' }}>ESI Employee Share (0.75%): <strong>₹{esi.toLocaleString()}</strong></div>
                      <div style={{ color: '#b91c1c' }}>P TAX: <strong>₹{pt.toLocaleString()}</strong></div>
                    </div>
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '2px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>NET TAKE HOME SALARY:</span>
                      <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#059669' }}>₹{net.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBasicSalaryModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#0d9488', borderColor: '#0d9488' }}>
                  Save Salary Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Day Attendance Details Modal */}
      {selectedCalendarDay && (
        <div className="modal-overlay" onClick={() => setSelectedCalendarDay(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  📅 Attendance Punch Details
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {selectedCalendarDay.dayName}, {selectedCalendarDay.dayNum} {selectedMonth} {selectedYear} ({selectedCalendarDay.dateStr})
                </div>
              </div>
              <button type="button" className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem', borderRadius: '50%' }} onClick={() => setSelectedCalendarDay(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Employee & Status Summary */}
            <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                  {selectedStaffId !== 'ALL' ? (selectedUserObj?.name || 'Selected Employee') : (selectedCalendarDay.attRecord?.userName || currentUser?.name || 'Employee')}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {selectedUserObj?.designation || 'Staff Member'}
                </div>
              </div>
              <span className={`badge ${
                selectedCalendarDay.status === 'PRESENT' ? 'badge-present' :
                selectedCalendarDay.status === 'LATE' ? 'badge-pending' :
                selectedCalendarDay.status === 'LEAVE' ? 'badge-info' :
                'badge-danger'
              }`} style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}>
                {selectedCalendarDay.status === 'PRESENT' && '✓ PRESENT'}
                {selectedCalendarDay.status === 'LATE' && '⏰ LATE ENTRY'}
                {selectedCalendarDay.status === 'LEAVE' && '🏖️ APPROVED LEAVE'}
                {selectedCalendarDay.status === 'ABSENT' && '❌ ABSENT / NOT PUNCHED'}
                {selectedCalendarDay.status === 'WEEKEND' && 'WEEKEND OFF'}
                {selectedCalendarDay.status === 'UPCOMING' && 'UPCOMING DATE'}
              </span>
            </div>

            {/* Punch Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <LogIn size={14} /> PUNCH IN DETAILS
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedCalendarDay.attRecord?.checkInTime || 'Not Punched'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem', display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
                  <MapPin size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span><LocationDisplay location={selectedCalendarDay.attRecord?.location} /></span>
                </div>
              </div>

              <div style={{ background: '#ffffff', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <LogOut size={14} /> PUNCH OUT DETAILS
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  {selectedCalendarDay.attRecord?.checkOutTime || (selectedCalendarDay.attRecord ? 'Active In Field' : 'Not Punched')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem', display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}>
                  <MapPin size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span><LocationDisplay location={selectedCalendarDay.attRecord?.location} /></span>
                </div>
              </div>
            </div>

            {/* Meta details */}
            <div style={{ background: '#f1f5f9', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8rem', color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>Punch Source: <strong>{selectedCalendarDay.attRecord?.method || 'WEB / GPS'}</strong></div>
              {!isEmployee && selectedCalendarDay.attRecord && (
                <button 
                  className="btn btn-secondary"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: '#2563eb', borderColor: '#2563eb' }}
                  onClick={() => {
                    const att = selectedCalendarDay.attRecord;
                    setEditingAtt(att);
                    setEditAttData({
                      checkInTime: att.checkInTime || '09:30 AM',
                      checkOutTime: att.checkOutTime || '06:30 PM',
                      status: att.status || 'PRESENT',
                      location: att.location || '',
                      method: att.method || 'WEB'
                    });
                    setSelectedCalendarDay(null);
                  }}
                >
                  <Edit2 size={13} /> Edit Attendance
                </button>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedCalendarDay(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
