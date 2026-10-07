import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Calendar, 
  DollarSign, 
  Users, 
  Building, 
  CheckCircle, 
  Clock, 
  X, 
  Sparkles, 
  Edit3, 
  Trash2, 
  Eye, 
  Filter, 
  Award,
  AlertCircle,
  Briefcase,
  UserCheck
} from 'lucide-react';
import { API_URL } from '../../config/api';

export default function EmployeeTraining({ data, currentRole = 'SUPERADMIN', currentUser = null, onRefresh = () => {} }) {
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Master Data States
  const [branches, setBranches] = useState(['Kolkata', 'Salt Lake Sector V', 'Howrah Sub-Office', 'Siliguri Regional Branch']);
  const [trainingTypes, setTrainingTypes] = useState(['Job Training', 'Onboarding Training', 'Technical Skills', 'Safety & Compliance', 'Leadership Development']);
  const [trainers, setTrainers] = useState(['Alok Naiya', 'M. Sen', 'Dr. R. K. Sharma']);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);

  // Inline Quick-Create Modals
  const [inlineModal, setInlineModal] = useState(null); // 'branch' | 'type' | 'trainer'
  const [inlineInputValue, setInlineInputValue] = useState('');

  // Form State for Create New Training
  const [formData, setFormData] = useState({
    title: '',
    branch: 'Kolkata',
    trainerOption: 'Internal', // Internal, External
    trainingType: 'Job Training',
    trainer: 'Alok Naiya',
    trainingCost: '',
    employeeSelection: 'ALL', // 'ALL' | 'DEPARTMENT' | 'SELECTED'
    targetDepartment: '',
    selectedEmployeeIds: ['ALL'],
    startDate: '',
    endDate: '',
    description: '',
    status: 'SCHEDULED'
  });

  const isAdmin = ['SUPERADMIN', 'MASTER_ADMIN', 'SUB_ADMIN'].includes(currentRole);

  const loadTrainingData = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams({
        role: currentRole || 'SUPERADMIN',
        ...(currentUser?.id ? { userId: currentUser.id } : {}),
        ...(currentUser?.email ? { userEmail: currentUser.email } : {})
      }).toString();

      const [trRes, masterRes, usersRes] = await Promise.all([
        fetch(API_URL(`/api/trainings?${queryParams}`)).then(r => r.json()),
        fetch(API_URL('/api/master-data')).then(r => r.json()),
        fetch(API_URL('/api/users')).then(r => r.json())
      ]);

      if (trRes.success) {
        setTrainings(trRes.data || []);
      }

      if (masterRes.success && masterRes.data) {
        if (masterRes.data.branches?.length) {
          setBranches(masterRes.data.branches.map(b => b.name));
        }
        if (masterRes.data.trainingTypes?.length) {
          setTrainingTypes(masterRes.data.trainingTypes.map(t => t.name));
        }
        if (masterRes.data.trainers?.length) {
          setTrainers(masterRes.data.trainers.map(t => t.name));
        }
        if (masterRes.data.departments?.length) {
          setDepartments(masterRes.data.departments.map(d => d.name));
        }
      }

      if (usersRes.success && usersRes.data) {
        setEmployees(usersRes.data.filter(u => u.role !== 'CLIENT'));
      }
    } catch (err) {
      console.error('Failed to load training data:', err);
      setError('Failed to fetch training details from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrainingData();
  }, [currentRole, currentUser?.id, currentUser?.email]);

  // AI Auto-Fill helper for training form
  const handleGenerateAI = () => {
    const aiTitles = [
      'Advanced Cloud Systems & Security Workshop',
      'Enterprise Network Infrastructure & Maintenance Training',
      'Safety, Compliance & Quality Standards Orientation',
      'Customer Support & Service Excellence Bootcamp',
      'Full Stack System Diagnostics & Field Protocol'
    ];
    const aiDescriptions = [
      'Comprehensive hands-on training module covering emergency protocols, hardware replacement SLA, and client satisfaction guidelines.',
      'In-depth technical session focusing on network optimization, modern security best practices, and enterprise system upgrades.',
      'Interactive workshop designed to boost team productivity, operational accuracy, and compliance reporting standards.'
    ];

    const randomTitle = aiTitles[Math.floor(Math.random() * aiTitles.length)];
    const randomDesc = aiDescriptions[Math.floor(Math.random() * aiDescriptions.length)];
    const randomCost = (Math.floor(Math.random() * 8) + 2) * 2500;

    setFormData(prev => ({
      ...prev,
      title: randomTitle,
      trainingCost: String(randomCost),
      description: randomDesc
    }));
  };

  // Form Field Change Handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Toggle Employee Selection in Modal
  const handleEmployeeToggle = (empId) => {
    setFormData(prev => {
      let current = [...prev.selectedEmployeeIds];
      if (empId === 'ALL') {
        return { ...prev, employeeSelection: 'ALL', selectedEmployeeIds: ['ALL'] };
      }
      current = current.filter(id => id !== 'ALL');
      if (current.includes(empId)) {
        current = current.filter(id => id !== empId);
      } else {
        current.push(empId);
      }
      if (current.length === 0) current = ['ALL'];
      return { 
        ...prev, 
        employeeSelection: current.includes('ALL') ? 'ALL' : 'SELECTED',
        selectedEmployeeIds: current 
      };
    });
  };

  // Handle Quick Inline Creation of Branch, Type, Trainer
  const handleInlineSave = async () => {
    if (!inlineInputValue.trim()) return;
    const val = inlineInputValue.trim();
    try {
      if (inlineModal === 'branch') {
        await fetch(API_URL('/api/branches'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: val })
        });
        setBranches(prev => Array.from(new Set([...prev, val])));
        setFormData(prev => ({ ...prev, branch: val }));
      } else if (inlineModal === 'type') {
        await fetch(API_URL('/api/training-types'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: val })
        });
        setTrainingTypes(prev => Array.from(new Set([...prev, val])));
        setFormData(prev => ({ ...prev, trainingType: val }));
      } else if (inlineModal === 'trainer') {
        await fetch(API_URL('/api/trainers'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: val, type: formData.trainerOption })
        });
        setTrainers(prev => Array.from(new Set([...prev, val])));
        setFormData(prev => ({ ...prev, trainer: val }));
      }
      setInlineInputValue('');
      setInlineModal(null);
    } catch (e) {
      console.error('Inline creation error:', e);
    }
  };

  // Submit Create New Training
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.trainingType || !formData.trainer || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields marked with *');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        title: formData.title || `${formData.trainingType} - ${formData.trainer}`,
        branch: formData.branch,
        trainerOption: formData.trainerOption,
        trainingType: formData.trainingType,
        trainer: formData.trainer,
        trainingCost: parseFloat(formData.trainingCost) || 0,
        employeeSelection: formData.employeeSelection,
        targetDepartment: formData.employeeSelection === 'DEPARTMENT' ? formData.targetDepartment : null,
        employeeIds: formData.selectedEmployeeIds.includes('ALL') ? [] : formData.selectedEmployeeIds,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
        status: formData.status,
        createdById: currentUser?.id
      };

      const res = await fetch(API_URL('/api/trainings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.success) {
        setSuccessMsg('🎉 New training program created and assigned successfully!');
        setShowCreateModal(false);
        setFormData({
          title: '',
          branch: branches[0] || 'Kolkata',
          trainerOption: 'Internal',
          trainingType: trainingTypes[0] || 'Job Training',
          trainer: trainers[0] || 'Alok Naiya',
          trainingCost: '',
          employeeSelection: 'ALL',
          targetDepartment: '',
          selectedEmployeeIds: ['ALL'],
          startDate: '',
          endDate: '',
          description: '',
          status: 'SCHEDULED'
        });
        loadTrainingData();
        onRefresh();
      } else {
        setError(result.message || 'Failed to create training program');
      }
    } catch (err) {
      setError(err.message || 'Server network error');
    } finally {
      setLoading(false);
    }
  };

  // Update Employee Attendance/Completion status in training
  const handleUpdateEmployeeStatus = async (trainingId, userId, status) => {
    try {
      const res = await fetch(API_URL(`/api/trainings/${trainingId}/employee-status`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status })
      });
      const result = await res.json();
      if (result.success) {
        setSuccessMsg('Status updated successfully');
        loadTrainingData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Training
  const handleDeleteTraining = async (id) => {
    if (!window.confirm('Are you sure you want to delete this training record?')) return;
    try {
      const res = await fetch(API_URL(`/api/trainings/${id}`), { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setSuccessMsg('Training record deleted');
        loadTrainingData();
        onRefresh();
      }
    } catch (e) {
      setError(e.message);
    }
  };

  // Filtering Logic
  const filteredTrainings = trainings.filter(t => {
    const matchesSearch = 
      (t.title && t.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.trainer && t.trainer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.trainingType && t.trainingType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.branch && t.branch.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesBranch = branchFilter === 'ALL' || t.branch === branchFilter;

    return matchesSearch && matchesStatus && matchesBranch;
  });

  // Analytics Stats
  const totalTrainingsCount = trainings.length;
  const inProgressCount = trainings.filter(t => t.status === 'IN_PROGRESS').length;
  const scheduledCount = trainings.filter(t => t.status === 'SCHEDULED').length;
  const completedCount = trainings.filter(t => t.status === 'COMPLETED').length;
  const totalCostSum = trainings.reduce((acc, t) => acc + (t.trainingCost || 0), 0);

  return (
    <div className="training-module-container" style={{ padding: '0.5rem 0' }}>
      
      {/* Alert Messages */}
      {error && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', borderRadius: '8px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <X size={16} style={{ cursor: 'pointer' }} onClick={() => setError('')} />
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '0.85rem 1.25rem', background: '#f0fdf4', borderLeft: '4px solid #22c55e', color: '#166534', borderRadius: '8px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
          <X size={16} style={{ cursor: 'pointer' }} onClick={() => setSuccessMsg('')} />
        </div>
      )}

      {/* Module Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--brand-primary, #0f172a)', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: 0 }}>
            <GraduationCap style={{ color: '#6366f1' }} size={28} />
            {isAdmin ? 'Employee Training & Upskilling' : 'My Assigned Training Sessions'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {isAdmin 
              ? 'Schedule, manage, and assign employee training programs across all branches & departments.' 
              : 'View your personal training sessions, schedule, trainer details, and completion progress.'}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: '#fff',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
            }}
          >
            <Plus size={18} />
            Create New Training
          </button>
        )}
      </div>

      {/* Stats Overview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1.15rem', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Trainings</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>{totalTrainingsCount}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.15rem', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Scheduled</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>{scheduledCount}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.15rem', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>In Progress</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ea580c' }}>{inProgressCount}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.15rem', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Budget / Cost</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb' }}>₹{totalCostSum.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by title, trainer, training type or branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            style={{ padding: '0.55rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', background: '#fff', cursor: 'pointer' }}
          >
            <option value="ALL">All Branches</option>
            {branches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.55rem 0.85rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', background: '#fff', cursor: 'pointer' }}
          >
            <option value="ALL">All Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Trainings Table */}
      <div className="glass-card" style={{ borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '0.85rem 1rem' }}>Training & Type</th>
                <th style={{ padding: '0.85rem 1rem' }}>Branch</th>
                <th style={{ padding: '0.85rem 1rem' }}>Trainer</th>
                <th style={{ padding: '0.85rem 1rem' }}>Assigned Employees</th>
                <th style={{ padding: '0.85rem 1rem' }}>Schedule Dates</th>
                <th style={{ padding: '0.85rem 1rem' }}>Cost</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                    Loading training records...
                  </td>
                </tr>
              ) : filteredTrainings.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                    <GraduationCap size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#475569' }}>No Training Sessions Found</div>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                      {isAdmin ? 'Click "Create New Training" to schedule a training program.' : 'No training sessions assigned to you at the moment.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTrainings.map(t => {
                  const assignedCount = t.assignedEmployees?.length || 0;
                  const startDateStr = t.startDate ? new Date(t.startDate).toLocaleDateString('en-GB') : '-';
                  const endDateStr = t.endDate ? new Date(t.endDate).toLocaleDateString('en-GB') : '-';

                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{t.title || `${t.trainingType}`}</div>
                        <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#4338ca', padding: '0.15rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.25rem' }}>
                          {t.trainingType}
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1rem', color: '#334155' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Building size={14} style={{ color: '#64748b' }} />
                          {t.branch || 'Kolkata'}
                        </div>
                      </td>

                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ fontWeight: 500, color: '#1e293b' }}>{t.trainer}</div>
                        <span style={{ fontSize: '0.725rem', color: '#64748b' }}>({t.trainerOption || 'Internal'})</span>
                      </td>

                      <td style={{ padding: '0.9rem 1rem' }}>
                        {t.employeeSelection === 'ALL' ? (
                          <span className="badge" style={{ background: '#f1f5f9', color: '#475569', padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                            👥 All Employees
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ display: 'flex', marginLeft: '-4px' }}>
                              {t.assignedEmployees?.slice(0, 3).map((emp, idx) => (
                                <div key={emp.id || idx} style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, border: '2px solid #fff', marginLeft: idx > 0 ? '-8px' : 0 }} title={emp.user?.name}>
                                  {emp.user?.name ? emp.user.name.charAt(0) : 'E'}
                                </div>
                              ))}
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>
                              {assignedCount} Assigned
                            </span>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.9rem 1rem', color: '#475569', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Calendar size={14} style={{ color: '#64748b' }} />
                          <span>{startDateStr} to {endDateStr}</span>
                        </div>
                      </td>

                      <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: '#0f172a' }}>
                        ₹{t.trainingCost ? t.trainingCost.toLocaleString('en-IN') : '0'}
                      </td>

                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          background: t.status === 'COMPLETED' ? '#dcfce7' : t.status === 'IN_PROGRESS' ? '#ffedd5' : t.status === 'CANCELLED' ? '#fee2e2' : '#e0e7ff',
                          color: t.status === 'COMPLETED' ? '#15803d' : t.status === 'IN_PROGRESS' ? '#c2410c' : t.status === 'CANCELLED' ? '#b91c1c' : '#4338ca'
                        }}>
                          ● {t.status || 'SCHEDULED'}
                        </span>
                      </td>

                      <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            onClick={() => { setSelectedTraining(t); setShowViewModal(true); }}
                            title="View Details"
                            style={{ background: '#f1f5f9', border: 'none', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', color: '#475569' }}
                          >
                            <Eye size={16} />
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteTraining(t.id)}
                              title="Delete Training"
                              style={{ background: '#fef2f2', border: 'none', padding: '0.4rem 0.6rem', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CREATE NEW TRAINING MODAL (MATCHING USER SCREENSHOT) */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
            position: 'relative'
          }}>
            
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              top: 0,
              background: '#fff',
              zIndex: 10
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                Create New Training
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  style={{
                    background: '#22c55e',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.45rem 0.9rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(34, 197, 94, 0.3)'
                  }}
                >
                  <Sparkles size={16} />
                  Generate with AI
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '0.25rem'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
              
              {/* Optional Training Title */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Training Title / Topic
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. Field Engineering Safety & Technical Training"
                  value={formData.title}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Branch Field */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Branch<span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    background: '#fff',
                    outline: 'none'
                  }}
                >
                  {branches.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <div style={{ marginTop: '0.3rem', fontSize: '0.775rem', color: '#64748b' }}>
                  Create branch here. <span onClick={() => { setInlineModal('branch'); setInlineInputValue(''); }} style={{ color: '#16a34a', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Create branch</span>
                </div>
              </div>

              {/* Grid 2 Columns: Trainer Option & Training Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Trainer Option<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    name="trainerOption"
                    value={formData.trainerOption}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      background: '#fff',
                      outline: 'none'
                    }}
                  >
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Training Type<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    name="trainingType"
                    value={formData.trainingType}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      background: '#fff',
                      outline: 'none'
                    }}
                  >
                    {trainingTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <div style={{ marginTop: '0.3rem', fontSize: '0.775rem', color: '#64748b' }}>
                    Create training type here. <span onClick={() => { setInlineModal('type'); setInlineInputValue(''); }} style={{ color: '#16a34a', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Create training type</span>
                  </div>
                </div>
              </div>

              {/* Grid 2 Columns: Trainer & Training Cost */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Trainer<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    name="trainer"
                    value={formData.trainer}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      background: '#fff',
                      outline: 'none'
                    }}
                  >
                    {trainers.map(tr => (
                      <option key={tr} value={tr}>{tr}</option>
                    ))}
                  </select>
                  <div style={{ marginTop: '0.3rem', fontSize: '0.775rem', color: '#64748b' }}>
                    Create trainer here. <span onClick={() => { setInlineModal('trainer'); setInlineInputValue(''); }} style={{ color: '#16a34a', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Create trainer</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Training Cost<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="trainingCost"
                    placeholder="Training Cost"
                    value={formData.trainingCost}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Employee Selection */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Employee<span style={{ color: '#ef4444' }}>*</span>
                </label>
                
                <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.75rem', maxHeight: '160px', overflowY: 'auto', background: '#fff' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0', fontWeight: 600, color: '#0f172a', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.employeeSelection === 'ALL'}
                      onChange={() => handleEmployeeToggle('ALL')}
                    />
                    <span>All Employee</span>
                  </label>

                  {employees.map(emp => (
                    <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.employeeSelection === 'ALL' || formData.selectedEmployeeIds.includes(emp.id)}
                        onChange={() => handleEmployeeToggle(emp.id)}
                      />
                      <span>{emp.name} {emp.department ? `(${emp.department})` : ''}</span>
                    </label>
                  ))}
                </div>

                <div style={{ marginTop: '0.3rem', fontSize: '0.775rem', color: '#64748b' }}>
                  Create employee here. <span style={{ color: '#16a34a', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Create employee</span>
                </div>
              </div>

              {/* Grid 2 Columns: Start Date & End Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Start Date<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    End Date<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Description / Objectives */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Training Description / Agenda
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Enter detailed goals, prerequisites, and training schedule..."
                  value={formData.description}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Modal Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '0.65rem 1.25rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    background: '#fff',
                    color: '#475569',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '0.65rem 1.5rem',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
                  }}
                >
                  {loading ? 'Saving...' : 'Save Training'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INLINE QUICK ADD MODAL (Branch / Type / Trainer) */}
      {/* ========================================================================= */}
      {inlineModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: '#0f172a' }}>
              Add New {inlineModal === 'branch' ? 'Branch' : inlineModal === 'type' ? 'Training Type' : 'Trainer'}
            </h4>
            <input
              type="text"
              placeholder={`Enter name...`}
              value={inlineInputValue}
              onChange={(e) => setInlineInputValue(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1.25rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setInlineModal(null)}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleInlineSave}
                style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 600 }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW TRAINING DETAILS MODAL */}
      {/* ========================================================================= */}
      {showViewModal && selectedTraining && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '1rem'
        }}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>{selectedTraining.title}</h3>
                <span style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600 }}>{selectedTraining.trainingType}</span>
              </div>
              <X size={20} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowViewModal(false)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              <div><strong>Branch:</strong> {selectedTraining.branch || 'Kolkata'}</div>
              <div><strong>Trainer:</strong> {selectedTraining.trainer} ({selectedTraining.trainerOption})</div>
              <div><strong>Start Date:</strong> {new Date(selectedTraining.startDate).toLocaleDateString('en-GB')}</div>
              <div><strong>End Date:</strong> {new Date(selectedTraining.endDate).toLocaleDateString('en-GB')}</div>
              <div><strong>Cost:</strong> ₹{selectedTraining.trainingCost?.toLocaleString('en-IN')}</div>
              <div><strong>Status:</strong> {selectedTraining.status}</div>
            </div>

            {selectedTraining.description && (
              <div style={{ marginBottom: '1.25rem', background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', fontSize: '0.85rem', color: '#334155' }}>
                <strong>Description / Agenda:</strong>
                <p style={{ margin: '0.35rem 0 0', lineHeight: 1.5 }}>{selectedTraining.description}</p>
              </div>
            )}

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
              Assigned Employees & Completion Status
            </h4>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              {selectedTraining.assignedEmployees && selectedTraining.assignedEmployees.length > 0 ? (
                selectedTraining.assignedEmployees.map((ae) => (
                  <div key={ae.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.85rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>{ae.user?.name || 'Employee'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ae.user?.designation || ae.user?.email}</div>
                    </div>
                    <select
                      value={ae.status || 'ASSIGNED'}
                      onChange={(e) => handleUpdateEmployeeStatus(selectedTraining.id, ae.userId, e.target.value)}
                      style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.75rem' }}
                    >
                      <option value="ASSIGNED">Assigned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="ABSENT">Absent</option>
                    </select>
                  </div>
                ))
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  All employees enrolled in this training.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                onClick={() => setShowViewModal(false)}
                style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
