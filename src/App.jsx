import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  UserCheck, 
  MapPin, 
  Package, 
  FileText, 
  ShoppingBag, 
  CheckSquare, 
  Users, 
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  LogOut,
  Bell,
  Search
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import ServiceMeetings from './components/ServiceMeetings';
import AttendancePayroll from './components/AttendancePayroll';
import LocationTracking from './components/LocationTracking';
import InventoryManager from './components/InventoryManager';
import BillingQuotations from './components/BillingQuotations';
import PurchaseVouchers from './components/PurchaseVouchers';
import SiteAMCTracker from './components/SiteAMCTracker';
import UserManagement from './components/UserManagement';
import Login from './components/Login';
import EmployeeSetup from './components/hrm/EmployeeSetup';
import UniversalModule from './components/common/UniversalModule';
import InventoryManagement from './components/InventoryManagement';

import { 
  mockUsers, 
  mockMeetings, 
  mockMaterialRequests, 
  mockAttendance, 
  mockLeaves, 
  mockShifts, 
  mockSalaryRecords, 
  mockPersonnelLocations, 
  mockGeofenceAlerts, 
  mockProducts, 
  mockQuotations, 
  mockInvoices, 
  mockPurchases, 
  mockVouchers, 
  mockSiteAMCs, 
  mockActivityLogs,
  mockDashboardERP,
  mockEmployees,
  mockPayroll,
  mockLeads,
  mockDeals,
  mockProjects,
  mockTasks,
  mockBankAccounts,
  mockServiceMeetings,
  mockInventory,
  mockAMCs
} from './mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [openMenus, setOpenMenus] = useState({ dashboard: true });
  const [currentRole, setCurrentRole] = useState('MASTER_ADMIN'); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = ({ email, role }) => {
    setIsAuthenticated(true);
    setCurrentUser({ email });
    setCurrentRole('MASTER_ADMIN');
  };

  // Central CRM State
  const [crmData, setCrmData] = useState({
    users: mockUsers,
    meetings: mockMeetings,
    materialRequests: mockMaterialRequests,
    attendance: mockAttendance,
    leaves: mockLeaves,
    shifts: mockShifts,
    salaryRecords: mockSalaryRecords,
    locations: mockPersonnelLocations,
    geofenceAlerts: mockGeofenceAlerts,
    products: mockProducts,
    quotations: mockQuotations,
    invoices: mockInvoices,
    purchases: mockPurchases,
    vouchers: mockVouchers,
    siteAMCs: mockSiteAMCs,
    activityLogs: mockActivityLogs,
    erp: mockDashboardERP,
    employees: mockEmployees,
    payroll: mockPayroll,
    leads: mockLeads,
    deals: mockDeals,
    projects: mockProjects,
    tasks: mockTasks,
    bankAccounts: mockBankAccounts,
    serviceMeetings: mockServiceMeetings,
    inventory: mockInventory,
    purchases: mockPurchases,
    vouchers: mockVouchers,
    amcs: mockAMCs
  });

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'service_meeting', label: 'Service Meetings', icon: Briefcase },
    { id: 'hrm_attendance', label: 'Attendance Register', icon: UserCheck },
    { id: 'hrm_payroll', label: 'Salary Management', icon: FileText },
    { id: 'location_tracking', label: 'Location Tracking', icon: MapPin },
    { id: 'products_inventory', label: 'Inventory Management', icon: Package },
    { id: 'acc_billing', label: 'Billing & Quotation', icon: FileText },
    { id: 'acc_purchases', label: 'Purchase Entry', icon: ShoppingBag },
    { id: 'acc_vouchers', label: 'Voucher Entry', icon: CheckSquare },
    { id: 'site_amc', label: 'Site AMC Tracking', icon: ShieldAlert },
    { id: 'user_management', label: 'User Management', icon: Users }
  ];

  const toggleMenu = (id) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getActiveLabel = () => {
    for (const item of navItems) {
      if (item.id === activeTab) return item.label;
      if (item.subItems) {
        const sub = item.subItems.find(s => s.id === activeTab);
        if (sub) return `${item.label} / ${sub.label}`;
      }
    }
    return 'Dashboard';
  };

  const moduleConfigs = {
    hrm_payroll: {
      title: 'Salary Management',
      breadcrumbs: ['Dashboard', 'Salary Management'],
      data: crmData.payroll,
      columns: [
        { header: 'Employee ID', accessor: 'id' },
        { header: 'Employee', accessor: 'employee' },
        { header: 'Salary', accessor: 'salary' },
        { header: 'Month', accessor: 'month' },
        { header: 'Status', accessor: 'status' },
        { header: 'Date', accessor: 'date' }
      ]
    },
    acc_purchases: {
      title: 'Purchase Entry',
      breadcrumbs: ['Dashboard', 'Purchase Entry'],
      data: crmData.purchases,
      columns: [
        { header: 'PO Number', accessor: 'poNum' },
        { header: 'Vendor', accessor: 'vendor' },
        { header: 'Date', accessor: 'date' },
        { header: 'Total', accessor: 'total' },
        { header: 'GST', accessor: 'gst' },
        { header: 'Status', accessor: 'status' }
      ]
    },
    acc_vouchers: {
      title: 'Voucher Entry',
      breadcrumbs: ['Dashboard', 'Voucher Entry'],
      data: crmData.vouchers,
      columns: [
        { header: 'Voucher ID', accessor: 'voucherId' },
        { header: 'Type', accessor: 'type' },
        { header: 'Amount', accessor: 'amount' },
        { header: 'Date', accessor: 'date' },
        { header: 'Account', accessor: 'account' },
        { header: 'Status', accessor: 'status' }
      ]
    },
    site_amc: {
      title: 'Site AMC Tracking',
      breadcrumbs: ['Dashboard', 'Site AMC Tracking'],
      data: crmData.amcs,
      columns: [
        { header: 'Client', accessor: 'client' },
        { header: 'Equipment', accessor: 'equipment' },
        { header: 'Last Visit', accessor: 'lastVisit' },
        { header: 'Next Visit', accessor: 'nextVisit' },
        { header: 'Status', accessor: 'status' },
        { header: 'Assignee', accessor: 'assignee' }
      ]
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-header" style={{ flexDirection: 'column', alignItems: 'flex-start', paddingBottom: '1rem' }}>
          <img src="https://blanchedalmond-bat-253605.hostingersite.com//storage/uploads/logo/2-logo-dark.png" alt="Akash Engineering" style={{ width: '100%', maxHeight: '60px', objectFit: 'contain', padding: '0.25rem 0' }} />
        </div>

        <div className="nav-section-title">Main Navigation</div>

        <nav className="nav-menu">
          {navItems.map(item => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isOpen = openMenus[item.id];
            
            // Check if active tab is within this item's children or is this item itself
            const isChildActive = hasSubItems && item.subItems.some(sub => sub.id === activeTab);
            const isActive = activeTab === item.id || isChildActive;

            return (
              <div key={item.id} className="nav-group">
                <div 
                  className={`nav-item ${isActive && !hasSubItems ? 'active' : ''}`}
                  onClick={() => {
                    if (hasSubItems) {
                      toggleMenu(item.id);
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={18} style={{ color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)' }} />
                    <span style={{ fontWeight: isActive ? '600' : '500', color: isActive ? 'var(--brand-primary)' : 'var(--text-primary)' }}>{item.label}</span>
                  </div>
                  {hasSubItems && (
                    <div style={{ color: 'var(--text-secondary)' }}>
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} /> }
                    </div>
                  )}
                </div>
                
                {hasSubItems && isOpen && (
                  <div className="nav-submenu">
                    {item.subItems.map(sub => (
                      <div 
                        key={sub.id} 
                        className={`nav-subitem ${activeTab === sub.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(sub.id)}
                      >
                        {sub.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        
        {/* Top Header Bar */}
        <header className="top-bar">
          <div className="page-heading">
            {getActiveLabel()}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            
            {/* Live Role Switcher */}
            <div className="role-selector-pill">
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Role:</span>
              <select 
                className="select-field"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', width: 'auto' }}
                value={currentRole}
                onChange={e => setCurrentRole(e.target.value)}
              >
                <option value="MASTER_ADMIN">Master Admin</option>
                <option value="SUB_ADMIN">Sub Admin</option>
                <option value="FACILITY_MANAGER">Facility Manager</option>
                <option value="SERVICE_PERSONNEL">Service Personnel</option>
              </select>
            </div>

            {/* Current Active User Profile Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" 
                alt="Profile" 
                style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid var(--brand-primary)' }} 
              />
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{currentUser?.email || 'Admin'}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--brand-primary)' }}>
                  {currentRole.replace('_', ' ')}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button 
              className="btn btn-outline" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              onClick={() => setIsAuthenticated(false)}
            >
              <LogOut size={14} style={{ marginRight: '4px' }} /> Logout
            </button>

          </div>
        </header>

        {/* Dynamic Body Content */}
        <main className="content-body">
          {activeTab === 'dashboard' ? (
            <Dashboard data={crmData} currentRole={currentRole} activeTab={activeTab} />
          ) : activeTab === 'service_meeting' ? (
            <ServiceMeetings meetings={crmData.serviceMeetings} role={currentRole} />
          ) : activeTab === 'location_tracking' ? (
            <LocationTracking />
          ) : activeTab === 'products_inventory' ? (
            <InventoryManagement inventory={crmData.inventory} />
          ) : activeTab === 'hrm_attendance' ? (
            <EmployeeSetup employees={crmData.employees} />
          ) : moduleConfigs[activeTab] ? (
            <UniversalModule 
              title={moduleConfigs[activeTab].title}
              breadcrumbs={moduleConfigs[activeTab].breadcrumbs}
              columns={moduleConfigs[activeTab].columns}
              data={moduleConfigs[activeTab].data}
            />
          ) : (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <h2 style={{ color: 'var(--brand-primary)' }}>{getActiveLabel()}</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>
                This module is currently under development to match the new ERP structure.
              </p>
            </div>
          )}
        </main>

      </div>

    </div>
  );
}
