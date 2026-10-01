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
  ChevronDown,
  Settings
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
        .catch(() => { })
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

  // Filter staffUsers to exclude CLIENT role users
  const staffUsers = (users || []).filter(u => u.role !== 'CLIENT');

  // Scoped lists based on role and selected employee
  const selectedUserObj = staffUsers.find(u => u.id === selectedStaffId || u.name?.toLowerCase() === selectedStaffId?.toLowerCase());
  const selectedStaffName = selectedUserObj ? selectedUserObj.name : (selectedStaffId !== 'ALL' ? selectedStaffId : null);

  const isDateInSelectedMonthYear = (dateInput) => {
    if (!selectedMonth || selectedMonth === 'ALL' || !selectedYear) return true;
    if (!dateInput) return true;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return true;
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const localMonth = monthNames[d.getMonth()];
    const utcMonth = monthNames[d.getUTCMonth()];
    const localYear = String(d.getFullYear());
    const utcYear = String(d.getUTCFullYear());

    const matchesMonth = localMonth.toLowerCase() === selectedMonth.toLowerCase() || utcMonth.toLowerCase() === selectedMonth.toLowerCase();
    const matchesYear = localYear === String(selectedYear) || utcYear === String(selectedYear);
    return matchesMonth && matchesYear;
  };

  const displayedAttendance = isEmployee
    ? attendance.filter(a => {
      const matchesSearch = !searchQuery || a.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || a.location?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch && isDateInSelectedMonthYear(a.date);
    })
    : attendance.filter(a => {
      const matchesSearch = !searchQuery || a.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || a.location?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStaff = selectedStaffId === 'ALL' || a.userId === selectedStaffId || (selectedUserObj && a.userName?.toLowerCase().includes(selectedUserObj.name?.toLowerCase())) || (selectedStaffName && a.userName?.toLowerCase().includes(selectedStaffName.toLowerCase()));
      return matchesSearch && matchesStaff && isDateInSelectedMonthYear(a.date);
    });

  const displayedLeaves = isEmployee
    ? leaves.filter(l => {
      const matchesSearch = !searchQuery || l.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || l.reason?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMonthYear = selectedMonth === 'ALL' || l.status === 'PENDING' || isDateInSelectedMonthYear(l.startDate) || isDateInSelectedMonthYear(l.endDate) || isDateInSelectedMonthYear(l.createdAt);
      return matchesSearch && matchesMonthYear;
    })
    : leaves.filter(l => {
      const matchesSearch = !searchQuery || l.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || l.reason?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStaff = selectedStaffId === 'ALL' || l.userId === selectedStaffId || (selectedUserObj && (l.userId === selectedUserObj.id || l.userName?.toLowerCase().includes(selectedUserObj.name?.toLowerCase()))) || (selectedStaffName && l.userName?.toLowerCase().includes(selectedStaffName.toLowerCase()));
      const matchesMonthYear = selectedMonth === 'ALL' || l.status === 'PENDING' || isDateInSelectedMonthYear(l.startDate) || isDateInSelectedMonthYear(l.endDate) || isDateInSelectedMonthYear(l.createdAt);
      return matchesSearch && matchesStaff && matchesMonthYear;
    });



  const displayedSalaryRecords = isEmployee
    ? salaryRecords.filter(s => {
      const matchesSearch = !searchQuery || s.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || s.month?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesMonth = !selectedMonth || selectedMonth === 'ALL' || s.month?.toLowerCase() === selectedMonth.toLowerCase();
      const matchesYear = !selectedYear || String(s.year) === String(selectedYear);
      return matchesSearch && matchesMonth && matchesYear;
    })
    : salaryRecords.filter(s => {
      const matchesSearch = !searchQuery || s.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || s.month?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStaff = selectedStaffId === 'ALL' || s.userId === selectedStaffId || (selectedUserObj && s.userName?.toLowerCase().includes(selectedUserObj.name?.toLowerCase())) || (selectedStaffName && s.userName?.toLowerCase().includes(selectedStaffName.toLowerCase()));
      const matchesMonth = !selectedMonth || selectedMonth === 'ALL' || s.month?.toLowerCase() === selectedMonth.toLowerCase();
      const matchesYear = !selectedYear || String(s.year) === String(selectedYear);
      return matchesSearch && matchesStaff && matchesMonth && matchesYear;
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
      const params = new URLSearchParams();
      if (isEmployee && (activeUser?.id || activeUser?.name)) {
        if (activeUser?.id) params.append('userId', activeUser.id);
        if (activeUser?.name) params.append('userName', activeUser.name);
      }
      if (selectedMonth) params.append('month', selectedMonth);
      if (selectedYear) params.append('year', String(selectedYear));

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const [attRes, lveRes, payRes, usrRes] = await Promise.allSettled([
        fetch(`/api/attendance${queryString}`).then(r => r.json()),
        fetch('/api/leaves').then(r => r.json()),
        fetch(`/api/payroll${queryString}`).then(r => r.json()),
        fetch('/api/users').then(r => r.json())
      ]);

      if (attRes.status === 'fulfilled' && attRes.value?.success) setAttendance(attRes.value.data);
      if (lveRes.status === 'fulfilled' && lveRes.value?.success) setLeaves(lveRes.value.data);
      if (payRes.status === 'fulfilled' && payRes.value?.success) setSalaryRecords(payRes.value.data);
      if (usrRes.status === 'fulfilled' && usrRes.value?.success) setUsers(usrRes.value.data);
    } catch (err) {
      console.error('Error fetching attendance data:', err);
    }
  }, [isEmployee, activeUser?.id, activeUser?.name, selectedMonth, selectedYear]);

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

  // Super Admin Payroll Configuration State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [payrollConfig, setPayrollConfig] = useState({
    annualLeaveQuota: 14,
    epfPercent: 12,
    esiPercent: 0.75,
    bonusPercent: 8.33,
    workDaysInMonth: 30,
    workHoursInDay: 8,
    pTaxTier1Amount: 0,
    pTaxTier2Amount: 110,
    pTaxTier3Amount: 130,
    pTaxTier4Amount: 200
  });

  const fetchPayrollConfig = async () => {
    try {
      const res = await fetch('/api/payroll/config');
      const json = await res.json();
      if (json.success && json.data) {
        setPayrollConfig(json.data);
      }
    } catch (err) {
      console.error('Error fetching payroll config:', err);
    }
  };

  const handleSavePayrollConfig = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/payroll/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payrollConfig)
      });
      const json = await res.json();
      if (json.success) {
        setShowConfigModal(false);
        toast.success('Payroll settings saved successfully!');
      } else {
        toast.error(json.message || 'Failed to save settings');
      }
    } catch (err) {
      toast.error('Error saving payroll configuration');
    }
  };

  // Salary Slip POST state
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [newSalary, setNewSalary] = useState({
    userId: '',
    month: selectedMonth,
    year: selectedYear,
    baseSalary: '30000',
    others1: '0',
    others2: '0',
    others3: '0',
    others4: '0',
    overtimeDays: '0',
    overtimeHours: '0',
    absentDays: '0',
    prevLeaveBalance: '14',
    prevLoanDue: '0',
    furtherLoanTaken: '0',
    advanceDeductedMode: 'custom', // 'full' | '1000' | '2000' | 'custom'
    advanceDeducted: '0',
    epfShare: '',
    esiShare: '',
    pTax: '',
    bonusEnabled: false
  });

  // Edit Salary Form state
  const [editSalData, setEditSalData] = useState({
    month: selectedMonth,
    year: selectedYear,
    baseSalary: 30000,
    overtimeHours: 0,
    allowances: 0,
    deductions: 0,
    status: 'PROCESSED'
  });

  // Real-time payroll preview calculation hook following AKASH ENGINEERING rules (a to v)
  const calcPayrollPreview = useMemo(() => {
    const basic = Number(newSalary.baseSalary) || 0;
    const o1 = Number(newSalary.others1) || 0;
    const o2 = Number(newSalary.others2) || 0;
    const o3 = Number(newSalary.others3) || 0;
    const o4 = Number(newSalary.others4) || 0;
    const grossBase = basic + o1 + o2 + o3 + o4;

    const workDays = payrollConfig.workDaysInMonth || 30;
    const workHours = payrollConfig.workHoursInDay || 8;

    // Rule (a): Daily rate = (basic + 4 others) / 30
    const dailyRate = grossBase / workDays;

    // Rule (b): Hourly OT rate = (basic + 4 others) / 30 / 8, rounded to step of 5 (30, 35, 40...)
    let rawHourlyOtRate = dailyRate / workHours;
    let hourlyOtRate = rawHourlyOtRate > 0 ? Math.round(rawHourlyOtRate / 5) * 5 : 0;

    const otHrs = Number(newSalary.overtimeHours) || 0;
    const otPay = otHrs * hourlyOtRate;

    const otDays = Number(newSalary.overtimeDays) || 0;
    const absDays = Number(newSalary.absentDays) || 0;
    const presentDays = Math.max(0, 30 - absDays);

    // Rule (c): Offset Overtime Days & Absent Days against each other
    let netOtDays = 0;
    let netAbsDays = 0;
    if (otDays >= absDays) {
      netOtDays = otDays - absDays;
      netAbsDays = 0;
    } else {
      netAbsDays = absDays - otDays;
      netOtDays = 0;
    }
    const otDaysPay = netOtDays * dailyRate;

    // Rule (d), (e), (p), (q), (r): Leave tracking
    const prevLeave = Number(newSalary.prevLeaveBalance !== undefined && newSalary.prevLeaveBalance !== '' ? newSalary.prevLeaveBalance : (payrollConfig.annualLeaveQuota || 14));
    const currMonthLeaveAbsent = netAbsDays;

    let leaveDeducted = 0;
    let currLeave = 0;
    if (currMonthLeaveAbsent > prevLeave) {
      leaveDeducted = currMonthLeaveAbsent - prevLeave;
      currLeave = 0;
    } else {
      leaveDeducted = 0;
      currLeave = prevLeave - currMonthLeaveAbsent;
    }
    const absentDeductionPay = leaveDeducted * dailyRate;
    const paidDays = Math.max(0, 30 - leaveDeducted);
    const presentDayBaseSalary = Math.round(paidDays * dailyRate);
    const totalOtAmount = Math.round(otDaysPay + otPay);

    // Rule (f), (g), (h), (i): Loan & Advance tracking
    const prevLoan = Number(newSalary.prevLoanDue) || 0;
    const furtherLoan = Number(newSalary.furtherLoanTaken) || 0;
    const totalLoan = prevLoan + furtherLoan;

    let advDeducted = 0;
    if (newSalary.advanceDeductedMode === 'full') {
      advDeducted = totalLoan;
    } else if (newSalary.advanceDeductedMode === '1000') {
      advDeducted = Math.min(1000, totalLoan);
    } else if (newSalary.advanceDeductedMode === '2000') {
      advDeducted = Math.min(2000, totalLoan);
    } else {
      advDeducted = Number(newSalary.advanceDeducted) || 0;
    }
    const remLoan = Math.max(0, totalLoan - advDeducted);

    // Rule (j): EPF = basic * 12%
    const epf = newSalary.epfShare !== '' && newSalary.epfShare !== null && newSalary.epfShare !== undefined
      ? Number(newSalary.epfShare)
      : Math.round(basic * (payrollConfig.epfPercent || 12) / 100);

    // Rule (k): ESI = grossBase * 0.75%
    const esi = newSalary.esiShare !== '' && newSalary.esiShare !== null && newSalary.esiShare !== undefined
      ? Number(newSalary.esiShare)
      : Math.round(grossBase * (payrollConfig.esiPercent || 0.75) / 100);

    // Rule (l): Professional Tax
    let ptax = 0;
    if (newSalary.pTax !== '' && newSalary.pTax !== null && newSalary.pTax !== undefined) {
      ptax = Number(newSalary.pTax);
    } else {
      if (grossBase > 25000) ptax = payrollConfig.pTaxTier4Amount || 200;
      else if (grossBase > 15000) ptax = payrollConfig.pTaxTier3Amount || 130;
      else if (grossBase > 10000) ptax = payrollConfig.pTaxTier2Amount || 110;
      else ptax = payrollConfig.pTaxTier1Amount || 0;
    }

    // Rule (t): Bonus @ 8.33% on basic
    const bonus = newSalary.bonusEnabled ? Math.round(basic * (payrollConfig.bonusPercent || 8.33) / 100) : 0;

    const totalGross = grossBase + otDaysPay + otPay + bonus;
    const totalDeductions = absentDeductionPay + advDeducted + epf + esi + ptax;
    const netSalary = Math.round(totalGross - totalDeductions);

    return {
      grossBase,
      dailyRate,
      hourlyOtRate,
      otPay,
      netOtDays,
      netAbsDays,
      otDaysPay,
      presentDays,
      paidDays,
      presentDayBaseSalary,
      totalOtAmount,
      prevLeave,
      currMonthLeaveAbsent,
      leaveDeducted,
      currLeave,
      absentDeductionPay,
      prevLoan,
      furtherLoan,
      totalLoan,
      advDeducted,
      remLoan,
      epf,
      esi,
      ptax,
      bonus,
      totalGross,
      totalDeductions,
      netSalary
    };
  }, [newSalary, payrollConfig]);

  const handleSelectSalaryUser = async (userId, targetMonth = newSalary?.month || selectedMonth, targetYear = newSalary?.year || selectedYear) => {
    if (!userId) {
      setNewSalary(prev => ({ ...prev, userId: '', month: targetMonth, year: targetYear }));
      return;
    }
    const selectedUser = (users || []).find(u => u.id === userId);
    if (!selectedUser) {
      setNewSalary(prev => ({ ...prev, userId, month: targetMonth, year: targetYear }));
      return;
    }

    const basic = selectedUser.basicSalary || selectedUser.baseSalary || selectedUser.salary || 30000;
    const o1 = selectedUser.others1 || 0;
    const o2 = selectedUser.others2 || 0;
    const o3 = selectedUser.others3 || 0;
    const o4 = selectedUser.others4 || 0;
    const gross = basic + o1 + o2 + o3 + o4;

    let prevLeaveBalance = '14';
    let prevLoanDue = '0';
    let autoOtHours = '0';
    let autoOtDays = '0';
    let autoAbsentDays = '0';

    try {
      const res = await fetch(`/api/payroll/previous-month-data?userId=${userId}&month=${encodeURIComponent(targetMonth)}&year=${encodeURIComponent(targetYear)}`);
      const json = await res.json();
      if (json.success) {
        prevLeaveBalance = (json.prevLeaveBalance !== undefined ? json.prevLeaveBalance : 14).toString();
        prevLoanDue = (json.prevLoanDue !== undefined ? json.prevLoanDue : 0).toString();
        if (json.autoOtHours !== undefined) autoOtHours = json.autoOtHours.toString();
        if (json.autoOtDays !== undefined) autoOtDays = json.autoOtDays.toString();
        if (json.autoAbsentDays !== undefined) autoAbsentDays = json.autoAbsentDays.toString();
      }
    } catch (e) {
      console.error(e);
    }

    setNewSalary(prev => ({
      ...prev,
      userId,
      month: targetMonth,
      year: targetYear,
      baseSalary: basic.toString(),
      others1: o1.toString(),
      others2: o2.toString(),
      others3: o3.toString(),
      others4: o4.toString(),
      overtimeDays: autoOtDays,
      overtimeHours: autoOtHours,
      absentDays: autoAbsentDays,
      prevLeaveBalance,
      prevLoanDue,
      furtherLoanTaken: '0',
      advanceDeductedMode: 'custom',
      advanceDeducted: '0',
      epfShare: (selectedUser.epfShare !== undefined && selectedUser.epfShare !== null && selectedUser.epfShare > 0 ? selectedUser.epfShare : Math.round(basic * 0.12)).toString(),
      esiShare: (selectedUser.esiShare !== undefined && selectedUser.esiShare !== null && selectedUser.esiShare > 0 ? selectedUser.esiShare : Math.round(gross * 0.0075)).toString(),
      pTax: (selectedUser.pTax !== undefined && selectedUser.pTax !== null ? selectedUser.pTax : '').toString(),
      bonusEnabled: false
    }));
  };

  const handleGenerateSalary = async (e) => {
    e.preventDefault();
    if (!newSalary.userId) {
      toast.error('Please select an employee first');
      return;
    }
    try {
      const selectedUser = (users || []).find(u => u.id === newSalary.userId);
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSalary,
          month: selectedMonth,
          year: Number(selectedYear),
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
                  <option value="ALL">📅 All Months</option>
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



      {/* TAB 3: Leave Management & Approvals */}
      {activeTab === 'leaves' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                {isEmployee ? 'My Leave Applications & Approval Status' : 'Employee Leave Requests & Approval Workflow'}
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0 0' }}>
                Track leave quotas, approved leaves, and salary deduction rules.
              </p>
            </div>
            <button
              className="btn btn-primary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              onClick={() => setShowLeaveModal(true)}
            >
              <Plus size={15} /> Apply Leave Request
            </button>
          </div>

          {/* Leave Quota & Remaining Balance Summary Card */}
          <div style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '0.85rem', marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div style={{ background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Annual Paid Leave Quota</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {payrollConfig.annualLeaveQuota || 14} Days
              </div>
            </div>
            <div style={{ background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Approved Leaves Used</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
                {displayedLeaves.filter(l => l.status === 'APPROVED').length} Days
              </div>
            </div>
            <div style={{ background: '#f0fdf4', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Remaining Paid Leave Balance</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
                {Math.max(0, (payrollConfig.annualLeaveQuota || 14) - displayedLeaves.filter(l => l.status === 'APPROVED').length)} Days
              </div>
            </div>
          </div>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.76rem', color: '#166534', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={16} />
            <span>
              <strong>Salary Protection Rule:</strong> Approved leave requests covered under the paid leave balance do <strong>NOT</strong> deduct salary. Salary is only deducted if absences exceed remaining paid leave.
            </span>
          </div>

          {displayedLeaves.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px border-dashed #cbd5e1', color: '#64748b' }}>
              <Calendar size={36} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#334155' }}>No Leave Requests Found</div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                {selectedMonth === 'ALL'
                  ? 'No leave requests recorded for the selected staff member.'
                  : `No leave requests recorded for ${selectedMonth} ${selectedYear}. Select "All Months" to view all requests.`}
              </p>
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* TAB 4: Salary Management & Salary Slips */}
      {activeTab === 'payroll' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
                {isEmployee ? 'My Digital Salary Slips' : 'AKASH ENGINEERING – Payroll & Salary Management'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Calculates daily rates, OT hours/days, leave balance carryover, loan recovery, statutory EPF/ESI/PTAX & annual bonus.
              </p>
            </div>
            {!isEmployee && (
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  onClick={() => setShowSalaryModal(true)}
                >
                  <Plus size={15} /> Process Salary Slip
                </button>
                {activeUser?.role === 'SUPERADMIN' && (
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    onClick={() => {
                      fetchPayrollConfig();
                      setShowConfigModal(true);
                    }}
                  >
                    <Settings size={15} /> Settings (Super Admin)
                  </button>
                )}
              </div>
            )}
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th>Daily Rate & Base</th>
                <th>Overtime (Days / Hrs)</th>
                <th>Absents & Leaves</th>
                <th>Deductions</th>
                <th>Net Take Home</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedSalaryRecords.map(sal => {
                const b = sal.baseSalary || 0;
                const o1 = sal.others1 || 0;
                const o2 = sal.others2 || 0;
                const o3 = sal.others3 || 0;
                const o4 = sal.others4 || 0;
                const grossBase = b + o1 + o2 + o3 + o4;
                const dRate = sal.dailyRate || (grossBase / 30);
                const netOtDays = sal.netOvertimeDays || 0;
                const otHrs = sal.overtimeHours || 0;
                const netAbsDays = sal.netAbsentDays || 0;
                const leaveDed = sal.leaveDeducted || 0;
                const totDed = sal.deductions || 0;

                return (
                  <tr key={sal.id}>
                    <td>
                      <strong>{sal.userName}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sal.designation || 'Staff'}</div>
                    </td>
                    <td>{sal.month} {sal.year}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>₹{grossBase.toLocaleString()}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>₹{dRate.toFixed(2)}/day</div>
                    </td>
                    <td>
                      <div>{netOtDays > 0 ? `${netOtDays} OT Days` : '0 OT Days'}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{otHrs > 0 ? `${otHrs} OT Hrs` : '0 OT Hrs'}</div>
                    </td>
                    <td>
                      <div style={{ color: netAbsDays > 0 ? '#dc2626' : 'inherit' }}>{netAbsDays} Absents</div>
                      <div style={{ fontSize: '0.72rem', color: '#b91c1c' }}>{leaveDed > 0 ? `${leaveDed} Days Ded` : '0 Ded'}</div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: '#dc2626', fontWeight: 600 }}>
                      -₹{totDed.toLocaleString()}
                    </td>
                    <td><strong style={{ color: '#16a34a', fontSize: '0.98rem', fontFamily: 'monospace' }}>₹{(sal.netSalary || 0).toLocaleString()}</strong></td>
                    <td>
                      <span className="badge badge-approved">{sal.status || 'PROCESSED'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setSelectedSalarySlip(sal)} title="View Payslip">
                          <FileText style={{ width: 14, height: 14, color: 'var(--brand-yellow)' }} />
                        </button>
                        {!isEmployee && (
                          <>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', color: '#2563eb', borderColor: 'rgba(37, 99, 235, 0.3)' }}
                              title="Edit Salary Slip"
                              onClick={() => {
                                handleSelectSalaryUser(sal.userId);
                                setNewSalary({
                                  userId: sal.userId,
                                  month: sal.month || selectedMonth,
                                  year: (sal.year || selectedYear).toString(),
                                  baseSalary: (sal.baseSalary || 30000).toString(),
                                  others1: (sal.others1 || 0).toString(),
                                  others2: (sal.others2 || 0).toString(),
                                  others3: (sal.others3 || 0).toString(),
                                  others4: (sal.others4 || 0).toString(),
                                  overtimeDays: (sal.overtimeDays || 0).toString(),
                                  overtimeHours: (sal.overtimeHours || 0).toString(),
                                  absentDays: (sal.absentDays || 0).toString(),
                                  prevLeaveBalance: (sal.prevLeaveBalance !== undefined ? sal.prevLeaveBalance : 14).toString(),
                                  prevLoanDue: (sal.prevLoanDue || 0).toString(),
                                  furtherLoanTaken: (sal.furtherLoanTaken || 0).toString(),
                                  advanceDeductedMode: sal.advanceDeductedMode || 'custom',
                                  advanceDeducted: (sal.advanceDeducted || 0).toString(),
                                  epfShare: (sal.pfDeduction || 0).toString(),
                                  esiShare: (sal.esiDeduction || 0).toString(),
                                  pTax: (sal.pTaxDeduction || 0).toString(),
                                  bonusEnabled: Boolean(sal.bonusEnabled)
                                });
                                setShowSalaryModal(true);
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
                );
              })}
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

      {/* Modal 2: Process Salary Slip Modal (Rules a to v) */}
      {showSalaryModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="modal-content" style={{ maxWidth: 780, width: '96%', maxHeight: '92vh', overflowY: 'auto', background: '#ffffff', color: '#0f172a', borderRadius: '16px', padding: '1.5rem', border: '1px solid #cbd5e1' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  AKASH ENGINEERING – Process Employee Salary Slip
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  VS DIGITECH TECHNOLOGY Payroll Engine & Calculation Calculator
                </div>
              </div>
              <button onClick={() => setShowSalaryModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGenerateSalary} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Employee & Month Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Select Staff Member *</label>
                  <select
                    className="select-field"
                    style={{ width: '100%', background: '#ffffff' }}
                    value={newSalary.userId}
                    onChange={e => handleSelectSalaryUser(e.target.value)}
                    required
                  >
                    <option value="">Choose Employee</option>
                    {staffUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({formatUserRole(u.role)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Month</label>
                  <select
                    className="select-field"
                    style={{ width: '100%', background: '#ffffff' }}
                    value={newSalary.month}
                    onChange={e => {
                      const selectedM = e.target.value;
                      if (newSalary.userId) {
                        handleSelectSalaryUser(newSalary.userId, selectedM, newSalary.year);
                      } else {
                        setNewSalary(prev => ({ ...prev, month: selectedM }));
                      }
                    }}
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>Year</label>
                  <input
                    type="number"
                    className="input-field"
                    style={{ background: '#ffffff' }}
                    value={newSalary.year}
                    onChange={e => {
                      const selectedY = e.target.value;
                      if (newSalary.userId) {
                        handleSelectSalaryUser(newSalary.userId, newSalary.month, selectedY);
                      } else {
                        setNewSalary(prev => ({ ...prev, year: selectedY }));
                      }
                    }}
                  />
                </div>
              </div>

              {/* Section 1: Basic & Allowances Breakdown (Rules a & b) */}
              <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>
                    1. Basic Pay & 4 Other Allowances (Monthly Base)
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                    Daily Rate: ₹{calcPayrollPreview.dailyRate.toFixed(2)} / day
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>BASIC PAY (₹)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={newSalary.baseSalary}
                      onChange={e => setNewSalary({ ...newSalary, baseSalary: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>OTHERS 1 (₹)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={newSalary.others1}
                      onChange={e => setNewSalary({ ...newSalary, others1: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>OTHERS 2 (₹)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={newSalary.others2}
                      onChange={e => setNewSalary({ ...newSalary, others2: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>OTHERS 3 (₹)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={newSalary.others3}
                      onChange={e => setNewSalary({ ...newSalary, others3: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>OTHERS 4 (₹)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={newSalary.others4}
                      onChange={e => setNewSalary({ ...newSalary, others4: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Overtime & Absence Log (Rules b & c) */}
              <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>
                    2. Overtime & Absent Days Adjustment (Monthly Log)
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, background: '#fef3c7', color: '#b45309', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                    OT Hourly Rate: ₹{calcPayrollPreview.hourlyOtRate.toFixed(2)} / hr (Step Rounded)
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>OVERTIME DAYS (Nos)</label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      value={newSalary.overtimeDays}
                      onChange={e => setNewSalary({ ...newSalary, overtimeDays: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>OVERTIME HOURS (Clock &lt;9am / &gt;8pm)</label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      value={newSalary.overtimeHours}
                      onChange={e => setNewSalary({ ...newSalary, overtimeHours: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>ABSENT DAYS (Nos)</label>
                    <input
                      type="number"
                      min="0"
                      className="input-field"
                      value={newSalary.absentDays}
                      onChange={e => setNewSalary({ ...newSalary, absentDays: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#15803d' }}>PRESENT DAYS (Out of 30)</label>
                    <input
                      type="number"
                      disabled
                      readOnly
                      className="input-field"
                      style={{ background: '#f0fdf4', color: '#15803d', fontWeight: 800 }}
                      value={calcPayrollPreview.presentDays}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '0.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.45rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', color: '#166534', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Present Day Base Pay: <strong>₹{calcPayrollPreview.presentDayBaseSalary.toLocaleString()}</strong> ({calcPayrollPreview.paidDays} Paid Days @ ₹{calcPayrollPreview.dailyRate.toFixed(2)}/day)</span>
                  <span>OT Addition: <strong>+₹{calcPayrollPreview.totalOtAmount.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Section 3: Leave Balance & Deduction Tracking (Rules d, e, p, q, r, o) */}
              <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                  3. Paid Leave Quota & Leave Deduction Tracking
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>LAST MONTH LEAVE BAL</label>
                    <input
                      type="number"
                      className="input-field"
                      value={newSalary.prevLeaveBalance}
                      onChange={e => setNewSalary({ ...newSalary, prevLeaveBalance: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>CURR MONTH ABSENT</label>
                    <input
                      type="number"
                      disabled
                      className="input-field"
                      style={{ background: '#f1f5f9', color: '#0f172a' }}
                      value={calcPayrollPreview.currMonthLeaveAbsent}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b91c1c' }}>LEAVE DEDUCTED</label>
                    <input
                      type="number"
                      disabled
                      className="input-field"
                      style={{ background: '#fef2f2', color: '#b91c1c', fontWeight: 800 }}
                      value={calcPayrollPreview.leaveDeducted}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#15803d' }}>CURR MONTH REM LEAVE</label>
                    <input
                      type="number"
                      disabled
                      className="input-field"
                      style={{ background: '#f0fdf4', color: '#15803d', fontWeight: 800 }}
                      value={calcPayrollPreview.currLeave}
                    />
                  </div>
                </div>

                {calcPayrollPreview.leaveDeducted > 0 && (
                  <div style={{ marginTop: '0.4rem', fontSize: '0.74rem', color: '#b91c1c', fontWeight: 700 }}>
                    ⚠️ {calcPayrollPreview.leaveDeducted} Excess Absent day(s) deducted from salary: -₹{calcPayrollPreview.absentDeductionPay.toFixed(2)}
                  </div>
                )}
              </div>

              {/* Section 4: Loan / Advance Recovery (Rules f, g, h, i) */}
              <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4338ca', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
                  4. Loan & Advance Recovery
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>PREV LOAN DUE</label>
                    <input
                      type="number"
                      className="input-field"
                      value={newSalary.prevLoanDue}
                      onChange={e => setNewSalary({ ...newSalary, prevLoanDue: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>FURTHER LOAN</label>
                    <input
                      type="number"
                      className="input-field"
                      value={newSalary.furtherLoanTaken}
                      onChange={e => setNewSalary({ ...newSalary, furtherLoanTaken: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>TOTAL LOAN</label>
                    <input
                      type="number"
                      disabled
                      className="input-field"
                      style={{ background: '#f1f5f9' }}
                      value={calcPayrollPreview.totalLoan}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>DEDUCT MODE</label>
                    <select
                      className="select-field"
                      value={newSalary.advanceDeductedMode}
                      onChange={e => setNewSalary({ ...newSalary, advanceDeductedMode: e.target.value })}
                    >
                      <option value="custom">Custom</option>
                      <option value="full">Full Deduction</option>
                      <option value="1000">@ ₹1000.00</option>
                      <option value="2000">@ ₹2000.00</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569' }}>ADVANCE DEDUCTED</label>
                    <input
                      type="number"
                      disabled={newSalary.advanceDeductedMode !== 'custom'}
                      className="input-field"
                      value={newSalary.advanceDeductedMode === 'custom' ? newSalary.advanceDeducted : calcPayrollPreview.advDeducted}
                      onChange={e => setNewSalary({ ...newSalary, advanceDeducted: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#4338ca', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Remaining Loan Carried Forward To Next Month:</span>
                  <strong>₹{calcPayrollPreview.remLoan.toLocaleString()}</strong>
                </div>
              </div>

              {/* Section 5: Statutory Deductions & Bonus (Rules j, k, l, t) */}
              <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>
                    5. Statutory Deductions & Annual Bonus Option
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, color: '#16a34a' }}>
                    <input
                      type="checkbox"
                      checked={newSalary.bonusEnabled}
                      onChange={e => setNewSalary({ ...newSalary, bonusEnabled: e.target.checked })}
                    />
                    Enable Annual Bonus @ 8.33% (₹{calcPayrollPreview.bonus})
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>EPF 12% (₹)</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder={`Default: ₹${calcPayrollPreview.epf}`}
                      value={newSalary.epfShare}
                      onChange={e => setNewSalary({ ...newSalary, epfShare: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>ESI 0.75% (₹)</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder={`Default: ₹${calcPayrollPreview.esi}`}
                      value={newSalary.esiShare}
                      onChange={e => setNewSalary({ ...newSalary, esiShare: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>P-TAX (₹)</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder={`Default: ₹${calcPayrollPreview.ptax}`}
                      value={newSalary.pTax}
                      onChange={e => setNewSalary({ ...newSalary, pTax: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: NET TAKE HOME SALARY (Rule n: NON-EDITABLE) */}
              <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '1rem 1.25rem', borderRadius: '12px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#f8fafc' }}>
                    NET TAKE HOME SALARY (RULE N: STRICTLY NON-EDITABLE)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    Present Day Pay (₹{calcPayrollPreview.presentDayBaseSalary.toLocaleString()}) + OT (₹{calcPayrollPreview.totalOtAmount.toLocaleString()}) - Deductions (₹{calcPayrollPreview.totalDeductions.toLocaleString()})
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="text"
                    disabled={true}
                    readOnly={true}
                    value={`₹ ${calcPayrollPreview.netSalary.toLocaleString()}`}
                    style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1.5px solid #22c55e', color: '#4ade80', fontSize: '1.4rem', fontWeight: 800, textAlign: 'right', padding: '0.4rem 0.85rem', borderRadius: '8px', width: '200px', cursor: 'not-allowed', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSalaryModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#16a34a', borderColor: '#16a34a', padding: '0.6rem 1.5rem', fontWeight: 700 }}>
                  Generate & Save Payslip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Digital Salary Slip Preview (Rules a to v) */}
      {selectedSalarySlip && (
        <div className="modal-overlay" onClick={() => setSelectedSalarySlip(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1.5rem' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', color: '#0f172a', borderRadius: '18px', width: '100%', maxWidth: '720px', maxHeight: '92vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', border: '1px solid #cbd5e1' }}>
            
            {/* Payslip Header Banner */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '50%', pointerEvents: 'none' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                    AKASH ENGINEERING
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginTop: '2px' }}>
                    VS DIGITECH TECHNOLOGY
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span>📍 KADARAT, NARENDRAPUR, KOLKATA 700150</span>
                    <span>•</span>
                    <span>📞 9831053297 / 9062773542</span>
                  </div>
                </div>
                <button onClick={() => setSelectedSalarySlip(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '1rem', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24' }}>
                <span>📜 OFFICIAL SALARY SLIP</span>
                <span>•</span>
                <span>{selectedSalarySlip.month ? selectedSalarySlip.month.toUpperCase() : ''} {selectedSalarySlip.year}</span>
              </div>
            </div>

            {/* Employee Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', fontSize: '0.82rem', marginBottom: '1.25rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Employee Name</span>
                <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{selectedSalarySlip.userName}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Daily Calculation Rate</span>
                <strong style={{ color: '#0369a1', fontSize: '0.88rem' }}>₹{(selectedSalarySlip.dailyRate || 0).toFixed(2)} / day</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Payment Status</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '0.15rem 0.5rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.75rem' }}>
                  <Check size={12} color="#16a34a" /> {selectedSalarySlip.status || 'PROCESSED'}
                </span>
              </div>
            </div>

            {/* Earnings vs Deductions Table */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              
              {/* Earnings Card */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem' }}>
                <div style={{ borderBottom: '2px solid #10b981', paddingBottom: '0.4rem', marginBottom: '0.65rem' }}>
                  <h4 style={{ margin: 0, color: '#065f46', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    Earnings & Allowances
                  </h4>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Basic Pay</span>
                    <strong style={{ fontFamily: 'monospace' }}>₹{(selectedSalarySlip.baseSalary || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Others 1</span>
                    <strong style={{ fontFamily: 'monospace' }}>₹{(selectedSalarySlip.others1 || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Others 2</span>
                    <strong style={{ fontFamily: 'monospace' }}>₹{(selectedSalarySlip.others2 || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Others 3</span>
                    <strong style={{ fontFamily: 'monospace' }}>₹{(selectedSalarySlip.others3 || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>Others 4</span>
                    <strong style={{ fontFamily: 'monospace' }}>₹{(selectedSalarySlip.others4 || 0).toLocaleString()}</strong>
                  </div>
                  {(selectedSalarySlip.overtimeDaysPay || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369a1' }}>
                      <span>Overtime Days ({selectedSalarySlip.netOvertimeDays} days)</span>
                      <strong style={{ fontFamily: 'monospace' }}>₹{(selectedSalarySlip.overtimeDaysPay || 0).toLocaleString()}</strong>
                    </div>
                  )}
                  {(selectedSalarySlip.overtimePay || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0369a1' }}>
                      <span>Overtime Hours ({selectedSalarySlip.overtimeHours} hrs)</span>
                      <strong style={{ fontFamily: 'monospace' }}>₹{(selectedSalarySlip.overtimePay || 0).toLocaleString()}</strong>
                    </div>
                  )}
                  {selectedSalarySlip.bonusEnabled && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d' }}>
                      <span>Annual Bonus @ 8.33%</span>
                      <strong style={{ fontFamily: 'monospace' }}>₹{(selectedSalarySlip.bonusAmount || 0).toLocaleString()}</strong>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.65rem', paddingTop: '0.4rem', borderTop: '1px solid #cbd5e1', color: '#065f46', fontWeight: 800, fontSize: '0.82rem', background: '#ecfdf5', padding: '0.4rem 0.5rem', borderRadius: '6px' }}>
                  <span>TOTAL GROSS:</span>
                  <span style={{ fontFamily: 'monospace' }}>₹{(selectedSalarySlip.grossSalary || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Deductions Card */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem' }}>
                <div style={{ borderBottom: '2px solid #ef4444', paddingBottom: '0.4rem', marginBottom: '0.65rem' }}>
                  <h4 style={{ margin: 0, color: '#991b1b', fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase' }}>
                    Deductions & Statutory
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                  {(selectedSalarySlip.absentDeductionPay || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c' }}>
                      <span>Absent Deduction ({selectedSalarySlip.leaveDeducted} days)</span>
                      <strong style={{ fontFamily: 'monospace' }}>₹{(selectedSalarySlip.absentDeductionPay || 0).toLocaleString()}</strong>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>EPF Share (12%)</span>
                    <strong style={{ color: '#dc2626', fontFamily: 'monospace' }}>₹{(selectedSalarySlip.pfDeduction || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>ESI Share (0.75%)</span>
                    <strong style={{ color: '#dc2626', fontFamily: 'monospace' }}>₹{(selectedSalarySlip.esiDeduction || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#475569' }}>P-TAX</span>
                    <strong style={{ color: '#dc2626', fontFamily: 'monospace' }}>₹{(selectedSalarySlip.pTaxDeduction || 0).toLocaleString()}</strong>
                  </div>
                  {(selectedSalarySlip.advanceDeducted || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4338ca' }}>
                      <span>Advance / Loan Recovery</span>
                      <strong style={{ color: '#4338ca', fontFamily: 'monospace' }}>₹{(selectedSalarySlip.advanceDeducted || 0).toLocaleString()}</strong>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.65rem', paddingTop: '0.4rem', borderTop: '1px solid #cbd5e1', color: '#991b1b', fontWeight: 800, fontSize: '0.82rem', background: '#fef2f2', padding: '0.4rem 0.5rem', borderRadius: '6px' }}>
                  <span>TOTAL DEDUCTIONS:</span>
                  <span style={{ fontFamily: 'monospace' }}>-₹{(selectedSalarySlip.deductions || 0).toLocaleString()}</span>
                </div>
              </div>

            </div>

            {/* Leave Balance & Loan Recovery Tracking Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                <div style={{ fontWeight: 800, color: '#15803d', marginBottom: '0.4rem' }}>LEAVE BALANCE TRACKING</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Prev Month Balance:</span> <strong>{selectedSalarySlip.prevLeaveBalance || 14} days</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Curr Month Absents:</span> <strong>{selectedSalarySlip.currMonthLeaveAbsent || 0} days</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', color: '#b91c1c' }}>
                  <span>Deducted from Salary:</span> <strong>{selectedSalarySlip.leaveDeducted || 0} days</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '3px', fontWeight: 800, color: '#15803d' }}>
                  <span>End of Month Balance:</span> <strong>{selectedSalarySlip.currLeaveBalance || 0} days</strong>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                <div style={{ fontWeight: 800, color: '#4338ca', marginBottom: '0.4rem' }}>LOAN / ADVANCE TRACKING</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Prev Loan Due:</span> <strong>₹{(selectedSalarySlip.prevLoanDue || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Further Loan Taken:</span> <strong>₹{(selectedSalarySlip.furtherLoanTaken || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', color: '#4338ca' }}>
                  <span>Advance Deducted:</span> <strong>-₹{(selectedSalarySlip.advanceDeducted || 0).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '3px', fontWeight: 800, color: '#4338ca' }}>
                  <span>Remaining Loan Due:</span> <strong>₹{(selectedSalarySlip.remLoanDue || 0).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            {/* Net Take Home Hero Box (RULE N: NON-EDITABLE) */}
            <div style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', border: '1.5px solid #a7f3d0', padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 6px rgba(16, 185, 129, 0.08)' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#065f46', letterSpacing: '0.02em' }}>
                  NET TAKE HOME SALARY (NON-EDITABLE)
                </div>
                <div style={{ fontSize: '0.72rem', color: '#047857' }}>Net amount credited to employee bank account</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.6rem', color: '#047857', fontFamily: 'monospace' }}>
                ₹{(selectedSalarySlip.netSalary || 0).toLocaleString()}
              </div>
            </div>

            {/* Modal Actions - NO Download button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedSalarySlip(null)}
                style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '0.6rem 1.75rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}
              >
                Close Payslip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Payroll Settings Modal (Rule v) */}
      {showConfigModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1rem' }}>
          <div className="modal-content" style={{ maxWidth: 580, width: '95%', background: '#ffffff', color: '#0f172a', borderRadius: '16px', padding: '1.5rem', border: '1px solid #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  Super Admin Payroll Configuration
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Configure global calculation parameters & statutory deduction rates</div>
              </div>
              <button onClick={() => setShowConfigModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePayrollConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Annual Paid Leave Quota</label>
                  <input
                    type="number"
                    className="input-field"
                    value={payrollConfig.annualLeaveQuota}
                    onChange={e => setPayrollConfig({ ...payrollConfig, annualLeaveQuota: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>EPF Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={payrollConfig.epfPercent}
                    onChange={e => setPayrollConfig({ ...payrollConfig, epfPercent: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>ESI Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={payrollConfig.esiPercent}
                    onChange={e => setPayrollConfig({ ...payrollConfig, esiPercent: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Annual Bonus (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={payrollConfig.bonusPercent}
                    onChange={e => setPayrollConfig({ ...payrollConfig, bonusPercent: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', marginBottom: '0.5rem' }}>Professional Tax Tier Amounts (₹)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b' }}>₹10k–₹15k Tier</label>
                    <input
                      type="number"
                      className="input-field"
                      value={payrollConfig.pTaxTier2Amount}
                      onChange={e => setPayrollConfig({ ...payrollConfig, pTaxTier2Amount: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b' }}>₹15k–₹25k Tier</label>
                    <input
                      type="number"
                      className="input-field"
                      value={payrollConfig.pTaxTier3Amount}
                      onChange={e => setPayrollConfig({ ...payrollConfig, pTaxTier3Amount: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#64748b' }}>&gt; ₹25k Tier</label>
                    <input
                      type="number"
                      className="input-field"
                      value={payrollConfig.pTaxTier4Amount}
                      onChange={e => setPayrollConfig({ ...payrollConfig, pTaxTier4Amount: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowConfigModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Settings</button>
              </div>
            </form>
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
              <span className={`badge ${selectedCalendarDay.status === 'PRESENT' ? 'badge-present' :
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
