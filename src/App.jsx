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
  mockActivityLogs 
} from './mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentRole, setCurrentRole] = useState('MASTER_ADMIN'); // MASTER_ADMIN | SUB_ADMIN | FACILITY_MANAGER | SERVICE_PERSONNEL

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
    activityLogs: mockActivityLogs
  });

  const fetchData = async () => {
    try {
      const [
        uRes, mRes, matRes, attRes, lvRes, salRes, locRes, gfRes, pRes, qRes, invRes, purRes, vchRes, amcRes, logRes
      ] = await Promise.all([
        fetch('/api/users').then(r => r.json()).catch(() => null),
        fetch('/api/meetings').then(r => r.json()).catch(() => null),
        fetch('/api/material-requests').then(r => r.json()).catch(() => null),
        fetch('/api/attendance').then(r => r.json()).catch(() => null),
        fetch('/api/leaves').then(r => r.json()).catch(() => null),
        fetch('/api/payroll').then(r => r.json()).catch(() => null),
        fetch('/api/tracking/locations').then(r => r.json()).catch(() => null),
        fetch('/api/tracking/geofence-alerts').then(r => r.json()).catch(() => null),
        fetch('/api/inventory').then(r => r.json()).catch(() => null),
        fetch('/api/billing/quotations').then(r => r.json()).catch(() => null),
        fetch('/api/billing/invoices').then(r => r.json()).catch(() => null),
        fetch('/api/purchases').then(r => r.json()).catch(() => null),
        fetch('/api/vouchers').then(r => r.json()).catch(() => null),
        fetch('/api/amc').then(r => r.json()).catch(() => null),
        fetch('/api/activity-logs').then(r => r.json()).catch(() => null)
      ]);

      setCrmData(prev => ({
        users: uRes?.success ? uRes.data : prev.users,
        meetings: mRes?.success ? mRes.data : prev.meetings,
        materialRequests: matRes?.success ? matRes.data : prev.materialRequests,
        attendance: attRes?.success ? attRes.data : prev.attendance,
        leaves: lvRes?.success ? lvRes.data : prev.leaves,
        salaryRecords: salRes?.success ? salRes.data : prev.salaryRecords,
        locations: locRes?.success ? locRes.data : prev.locations,
        geofenceAlerts: gfRes?.success ? gfRes.data : prev.geofenceAlerts,
        products: pRes?.success ? pRes.data : prev.products,
        quotations: qRes?.success ? qRes.data : prev.quotations,
        invoices: invRes?.success ? invRes.data : prev.invoices,
        purchases: purRes?.success ? purRes.data : prev.purchases,
        vouchers: vchRes?.success ? vchRes.data : prev.vouchers,
        siteAMCs: amcRes?.success ? amcRes.data : prev.siteAMCs,
        activityLogs: logRes?.success ? logRes.data : prev.activityLogs,
        shifts: prev.shifts
      }));
    } catch (err) {
      console.log('Using local state sync');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'meetings', label: 'Service Meetings & Approvals', icon: Briefcase },
    { id: 'attendance', label: 'Attendance & Payroll', icon: UserCheck },
    { id: 'tracking', label: 'GPS Personnel Tracking', icon: MapPin },
    { id: 'inventory', label: 'Inventory (150+ Items)', icon: Package },
    { id: 'billing', label: 'Billing & Quotation Engine', icon: FileText },
    { id: 'purchases', label: 'Purchases & Vouchers', icon: ShoppingBag },
    { id: 'amc', label: 'Site AMC Compliance', icon: CheckSquare },
    { id: 'users', label: 'User Roles & Audit Log', icon: Users }
  ];

  return (
    <div className="app-container">
      
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-header">
          <div className="brand-logo">VS</div>
          <div>
            <div className="brand-title">VS DIGITECH</div>
            <div className="brand-sub">Enterprise CRM v1.0</div>
          </div>
        </div>

        <div className="nav-section-title">Core Operations</div>

        <nav className="nav-menu">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div 
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <div>📍 Kolkata 700030</div>
          <div>📞 115/1 Purba Sinthee Lane</div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        
        {/* Top Header Bar */}
        <header className="top-bar">
          <div className="page-heading">
            {navItems.find(n => n.id === activeTab)?.label}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            
            {/* Live Role Switcher */}
            <div className="role-selector-pill">
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Test Role:</span>
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
                alt="Rahul Sharma" 
                style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--brand-gold)' }} 
              />
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Rahul Sharma</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--brand-yellow)' }}>
                  {currentRole.replace('_', ' ')}
                </div>
              </div>
            </div>

          </div>
        </header>

        {/* Dynamic Body Content */}
        <main className="content-body">
          {activeTab === 'dashboard' && (
            <Dashboard data={crmData} currentRole={currentRole} onNavigate={setActiveTab} />
          )}

          {activeTab === 'meetings' && (
            <ServiceMeetings data={crmData} currentRole={currentRole} onRefresh={fetchData} />
          )}

          {activeTab === 'attendance' && (
            <AttendancePayroll data={crmData} currentRole={currentRole} onRefresh={fetchData} />
          )}

          {activeTab === 'tracking' && (
            <LocationTracking data={crmData} onRefresh={fetchData} />
          )}

          {activeTab === 'inventory' && (
            <InventoryManager data={crmData} currentRole={currentRole} onRefresh={fetchData} />
          )}

          {activeTab === 'billing' && (
            <BillingQuotations data={crmData} currentRole={currentRole} onRefresh={fetchData} />
          )}

          {activeTab === 'purchases' && (
            <PurchaseVouchers data={crmData} currentRole={currentRole} onRefresh={fetchData} />
          )}

          {activeTab === 'amc' && (
            <SiteAMCTracker data={crmData} currentRole={currentRole} onRefresh={fetchData} />
          )}

          {activeTab === 'users' && (
            <UserManagement data={crmData} currentRole={currentRole} onRefresh={fetchData} />
          )}
        </main>

      </div>

    </div>
  );
}
