import React from 'react';
import Dashboard from '../Dashboard';
import ServiceMeetings from '../ServiceMeetings';
import ProjectManagement from '../ProjectManagement';
import AttendancePayroll from '../AttendancePayroll';
import LocationTracking from '../LocationTracking';
import InventoryManager from '../InventoryManager';
import EmployeeSetup from '../hrm/EmployeeSetup';
import BillingQuotations from '../BillingQuotations';
import PurchaseVouchers from '../PurchaseVouchers';
import SiteAMCTracker from '../SiteAMCTracker';
import UserManagement from '../UserManagement';

export default function MainContent({
  activeTab,
  activeLabel,
  crmData,
  currentRole,
  currentUser,
  onRefresh = () => { }
}) {
  return (
    <main className="content-body">
      {activeTab === 'dashboard' || activeTab.startsWith('dashboard_') ? (
        <Dashboard data={crmData} currentRole={currentRole} currentUser={currentUser} activeTab={activeTab} />
      ) : activeTab === 'projects' || activeTab === 'project' ? (
        <ProjectManagement data={crmData} currentRole={currentRole} currentUser={currentUser} onRefresh={onRefresh} />
      ) : activeTab === 'service_meeting' ? (
        <ServiceMeetings
          meetings={crmData.serviceMeetings}
          materialRequests={crmData.materialRequests}
          role={currentRole}
          currentUser={currentUser}
          onRefresh={onRefresh}
          users={crmData.users}
          projects={crmData.projects}
        />
      ) : activeTab === 'material_request' ? (
        <ServiceMeetings
          meetings={crmData.serviceMeetings}
          materialRequests={crmData.materialRequests}
          role={currentRole}
          currentUser={currentUser}
          onRefresh={onRefresh}
          users={crmData.users}
          projects={crmData.projects}
        />
      ) : activeTab === 'site_amc' || activeTab === 'site_amc_tracker' ? (
        <SiteAMCTracker data={crmData} currentRole={currentRole} currentUser={currentUser} onRefresh={onRefresh} />
      ) : activeTab === 'location_tracking' ? (
        <LocationTracking data={crmData} currentRole={currentRole} currentUser={currentUser} onRefresh={onRefresh} />
      ) : activeTab === 'products_inventory' || activeTab === 'products_stock' || activeTab === 'products' ? (
        <InventoryManager data={crmData} currentRole={currentRole} currentUser={currentUser} onRefresh={onRefresh} />
      ) : activeTab === 'hrm_sys_employee_setup' || activeTab === 'hrm_employee' || activeTab === 'employee' ? (
        <UserManagement data={crmData} currentRole={currentRole} currentUser={currentUser} onRefresh={onRefresh} initialTab="employees" />
      ) : activeTab === 'hrm_attendance' ? (
        <AttendancePayroll data={crmData} currentRole={currentRole} currentUser={currentUser} onRefresh={onRefresh} defaultTab="attendance" />
      ) : activeTab === 'hrm_payroll' ? (
        <AttendancePayroll data={crmData} currentRole={currentRole} currentUser={currentUser} onRefresh={onRefresh} defaultTab="payroll" />
      ) : activeTab === 'hrm_leave' ? (
        <AttendancePayroll data={crmData} currentRole={currentRole} currentUser={currentUser} onRefresh={onRefresh} defaultTab="leaves" />
      ) : activeTab === 'hrm_shift' ? (
        <AttendancePayroll data={crmData} currentRole={currentRole} currentUser={currentUser} onRefresh={onRefresh} defaultTab="shifts" />
      ) : activeTab === 'acc_billing' || activeTab === 'billing' ? (
        <BillingQuotations data={crmData} currentRole={currentRole} currentUser={currentUser} onRefresh={onRefresh} />
      ) : activeTab === 'acc_invoices' ? (
        <BillingQuotations data={crmData} currentRole={currentRole} currentUser={currentUser} onRefresh={onRefresh} defaultTab="invoices" />
      ) : activeTab === 'acc_purchases' || activeTab === 'purchases' ? (
        <PurchaseVouchers data={crmData} currentRole={currentRole} currentUser={currentUser} onRefresh={onRefresh} />
      ) : activeTab === 'acc_vouchers' || activeTab === 'vouchers' ? (
        <PurchaseVouchers data={crmData} currentRole={currentRole} currentUser={currentUser} onRefresh={onRefresh} defaultTab="vouchers" />
      ) : activeTab === 'user_accounts' || activeTab === 'user_activity_logs' || activeTab === 'user_management' ? (
        <UserManagement data={crmData} currentRole={currentRole} currentUser={currentUser} onRefresh={onRefresh} />
      ) : (
        <div className="glass-card" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
            <div>
              <h2 style={{ color: 'var(--brand-primary)', margin: 0 }}>{activeLabel}</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>URL Endpoint: <code>{window.location.pathname}</code></span>
            </div>
            <span className="badge badge-approved">⚡ Active System Route</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            This enterprise module is registered in the routing table and active at URL path <code>{window.location.pathname}</code>.
          </p>
        </div>
      )}
    </main>
  );
}

