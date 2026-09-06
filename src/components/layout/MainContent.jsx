import React from 'react';
import Dashboard from '../Dashboard';
import ServiceMeetings from '../ServiceMeetings';
import AttendancePayroll from '../AttendancePayroll';
import LocationTracking from '../LocationTracking';
import InventoryManagement from '../InventoryManagement';
import EmployeeSetup from '../hrm/EmployeeSetup';
import BillingQuotations from '../BillingQuotations';
import PurchaseVouchers from '../PurchaseVouchers';
import SiteAMCTracker from '../SiteAMCTracker';
import UserManagement from '../UserManagement';

export default function MainContent({ 
  activeTab, 
  activeLabel, 
  crmData, 
  currentRole 
}) {
  return (
    <main className="content-body">
      {activeTab === 'dashboard' || activeTab.startsWith('dashboard_') ? (
        <Dashboard data={crmData} currentRole={currentRole} activeTab={activeTab} />
      ) : activeTab === 'service_meeting' ? (
        <ServiceMeetings meetings={crmData.serviceMeetings} role={currentRole} />
      ) : activeTab === 'material_request' ? (
        <ServiceMeetings meetings={crmData.serviceMeetings} role={currentRole} defaultTab="material-requests" />
      ) : activeTab === 'site_amc' ? (
        <SiteAMCTracker amcs={crmData.amcs} />
      ) : activeTab === 'location_tracking' ? (
        <LocationTracking />
      ) : activeTab === 'products_inventory' || activeTab === 'products_stock' ? (
        <InventoryManagement inventory={crmData.inventory} />
      ) : activeTab === 'hrm_sys_employee_setup' || activeTab === 'hrm_employee' ? (
        <EmployeeSetup employees={crmData.employees} />
      ) : activeTab === 'hrm_attendance' ? (
        <AttendancePayroll data={crmData} defaultTab="attendance" />
      ) : activeTab === 'hrm_payroll' ? (
        <AttendancePayroll data={crmData} defaultTab="payroll" />
      ) : activeTab === 'hrm_leave' ? (
        <AttendancePayroll data={crmData} defaultTab="leaves" />
      ) : activeTab === 'hrm_shift' ? (
        <AttendancePayroll data={crmData} defaultTab="shifts" />
      ) : activeTab === 'acc_billing' ? (
        <BillingQuotations quotations={crmData.quotations} invoices={crmData.invoices} />
      ) : activeTab === 'acc_invoices' ? (
        <BillingQuotations quotations={crmData.quotations} invoices={crmData.invoices} defaultTab="invoices" />
      ) : activeTab === 'acc_purchases' ? (
        <PurchaseVouchers purchases={crmData.purchases} vouchers={crmData.vouchers} />
      ) : activeTab === 'acc_vouchers' ? (
        <PurchaseVouchers purchases={crmData.purchases} vouchers={crmData.vouchers} defaultTab="vouchers" />
      ) : activeTab === 'user_accounts' || activeTab === 'user_activity_logs' || activeTab === 'user_management' ? (
        <UserManagement data={crmData} currentRole={currentRole} onRefresh={() => {}} />
      ) : (
        <div className="glass-card" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
            <div>
              <h2 style={{ color: 'var(--brand-primary)', margin: 0 }}>{activeLabel}</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>URL Endpoint: <code>{window.location.hash}</code></span>
            </div>
            <span className="badge badge-approved">⚡ Active UI Route</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            This system module is registered in the navigation router and fully accessible at URL <code>{window.location.hash}</code>.
          </p>
        </div>
      )}
    </main>
  );
}
