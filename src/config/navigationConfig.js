import { 
  LayoutDashboard, 
  User,
  Box,
  Layers,
  Share2,
  Users, 
  ShoppingCart,
  MessageSquare,
  Headphones,
  FileCode,
  Settings
} from 'lucide-react';

export const allNavItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    url: '#/dashboard',
    roles: ['SUPERADMIN', 'USER', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER', 'SERVICE_PERSONNEL'],
    subItems: [
      {
        id: 'dashboard_accounting',
        label: 'Accounting',
        url: '#/dashboard/accounting',
        subItems: [
          { id: 'acc_overview', label: 'Overview', url: '#/accounting/overview' },
          {
            id: 'acc_reports',
            label: 'Reports',
            url: '#/accounting/reports',
            subItems: [
              { id: 'acc_report_account_statement', label: 'Account Statement', url: '#/accounting/reports/account-statement' },
              { id: 'acc_report_invoice_summary', label: 'Invoice Summary', url: '#/accounting/reports/invoice-summary' },
              { id: 'acc_report_sales_report', label: 'Sales Report', url: '#/accounting/reports/sales-report' },
              { id: 'acc_report_receivables', label: 'Receivables', url: '#/accounting/reports/receivables' },
              { id: 'acc_report_payables', label: 'Payables', url: '#/accounting/reports/payables' },
              { id: 'acc_report_bill_summary', label: 'Bill Summary', url: '#/accounting/reports/bill-summary' },
              { id: 'acc_report_product_stock', label: 'Product Stock / Inventory', url: '#/accounting/reports/product-stock' },
              { id: 'acc_report_cash_flow', label: 'Cash Flow', url: '#/accounting/reports/cash-flow' },
              { id: 'acc_report_transaction', label: 'Transaction', url: '#/accounting/reports/transaction' },
              { id: 'acc_report_income_summary', label: 'Income Summary', url: '#/accounting/reports/income-summary' },
              { id: 'acc_report_expense_summary', label: 'Expense Summary', url: '#/accounting/reports/expense-summary' },
              { id: 'acc_report_income_vs_expense', label: 'Income VS Expense', url: '#/accounting/reports/income-vs-expense' },
              { id: 'acc_report_tax_summary', label: 'Tax Summary', url: '#/accounting/reports/tax-summary' }
            ]
          }
        ]
      },
      {
        id: 'dashboard_hrm',
        label: 'HRM',
        url: '#/dashboard/hrm',
        subItems: [
          { id: 'hrm_overview', label: 'Overview', url: '#/hrm/overview' },
          {
            id: 'hrm_reports',
            label: 'Reports',
            url: '#/hrm/reports',
            subItems: [
              { id: 'hrm_report_payroll', label: 'Payroll', url: '#/hrm/reports/payroll' },
              { id: 'hrm_report_leave', label: 'Leave', url: '#/hrm/reports/leave' },
              { id: 'hrm_report_attendance', label: 'Monthly Attendance', url: '#/hrm/reports/monthly-attendance' }
            ]
          }
        ]
      },
      {
        id: 'dashboard_crm',
        label: 'CRM',
        url: '#/dashboard/crm',
        subItems: [
          { id: 'crm_overview', label: 'Overview', url: '#/crm/overview' },
          {
            id: 'crm_reports',
            label: 'Reports',
            url: '#/crm/reports',
            subItems: [
              { id: 'crm_report_lead', label: 'Lead', url: '#/crm/reports/lead' },
              { id: 'crm_report_deal', label: 'Deal', url: '#/crm/reports/deal' }
            ]
          }
        ]
      },
      { id: 'dashboard_project', label: 'Project', url: '#/dashboard/project' }
    ]
  },
  {
    id: 'hrm_system',
    label: 'HRM System',
    icon: User,
    url: '#/hrm',
    roles: ['SUPERADMIN', 'USER', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER', 'SERVICE_PERSONNEL'],
    subItems: [
      { id: 'hrm_sys_employee_setup', label: 'Employee Setup', url: '#/hrm/employee-setup' },
      { 
        id: 'hrm_sys_payroll_setup', 
        label: 'Payroll Setup', 
        url: '#/hrm/payroll-setup',
        subItems: [
          { id: 'hrm_payroll_salary', label: 'Salary Structure', url: '#/hrm/payroll-setup/salary' },
          { id: 'hrm_payroll_allowance', label: 'Allowances & Deductions', url: '#/hrm/payroll-setup/allowance' }
        ] 
      },
      { 
        id: 'hrm_sys_leave_setup', 
        label: 'Leave Management Setup', 
        url: '#/hrm/leave-setup',
        subItems: [
          { id: 'hrm_leave_types', label: 'Leave Types', url: '#/hrm/leave-setup/types' },
          { id: 'hrm_leave_policy', label: 'Leave Policy', url: '#/hrm/leave-setup/policy' }
        ] 
      },
      { 
        id: 'hrm_sys_performance_setup', 
        label: 'Performance Setup', 
        url: '#/hrm/performance-setup',
        subItems: [
          { id: 'hrm_perf_indicators', label: 'Indicator Setup', url: '#/hrm/performance-setup/indicators' },
          { id: 'hrm_perf_appraisals', label: 'Appraisal Setup', url: '#/hrm/performance-setup/appraisals' }
        ] 
      },
      { 
        id: 'hrm_sys_training_setup', 
        label: 'Training Setup', 
        url: '#/hrm/training-setup',
        subItems: [
          { id: 'hrm_train_list', label: 'Training List', url: '#/hrm/training-setup/list' },
          { id: 'hrm_train_trainer', label: 'Trainer Setup', url: '#/hrm/training-setup/trainer' }
        ] 
      },
      { 
        id: 'hrm_sys_hr_admin_setup', 
        label: 'HR Admin Setup', 
        url: '#/hrm/hr-admin-setup',
        subItems: [
          { id: 'hrm_admin_awards', label: 'Award Setup', url: '#/hrm/hr-admin-setup/awards' },
          { id: 'hrm_admin_transfers', label: 'Transfer Setup', url: '#/hrm/hr-admin-setup/transfers' },
          { id: 'hrm_admin_resignation', label: 'Resignation Setup', url: '#/hrm/hr-admin-setup/resignation' }
        ] 
      },
      { id: 'hrm_sys_event_setup', label: 'Event Setup', url: '#/hrm/event-setup' },
      { id: 'hrm_sys_meeting', label: 'Meeting', url: '#/hrm/meeting' },
      { id: 'hrm_sys_asset_setup', label: 'Employees Asset Setup', url: '#/hrm/employees-asset-setup' },
      { id: 'hrm_sys_document_setup', label: 'Document Setup', url: '#/hrm/document-setup' },
      { id: 'hrm_sys_company_policy', label: 'Company policy', url: '#/hrm/company-policy' },
      { id: 'hrm_sys_hrm_system_setup', label: 'HRM System Setup', url: '#/hrm/hrm-system-setup' }
    ]
  },
  {
    id: 'accounting_system',
    label: 'Accounting System',
    icon: Box,
    url: '#/accounting',
    roles: ['SUPERADMIN', 'USER', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER', 'SERVICE_PERSONNEL'],
    subItems: [
      {
        id: 'acc_banking',
        label: 'Banking',
        url: '#/accounting/banking',
        subItems: [
          { id: 'acc_bank_accounts', label: 'Account & Transfer', url: '#/accounting/banking/accounts' }
        ]
      },
      {
        id: 'acc_sales',
        label: 'Sales',
        url: '#/accounting/sales',
        subItems: [
          { id: 'acc_invoices', label: 'Invoices & Quotations', url: '#/accounting/sales/invoices' },
          { id: 'acc_revenue', label: 'Revenue & Payments', url: '#/accounting/sales/revenue' }
        ]
      },
      {
        id: 'acc_purchases',
        label: 'Purchases',
        url: '#/accounting/purchases',
        subItems: [
          { id: 'acc_purchase_orders', label: 'Bills & Purchase Orders', url: '#/accounting/purchases/bills' },
          { id: 'acc_vendors', label: 'Vendors & Debit Notes', url: '#/accounting/purchases/vendors' }
        ]
      },
      {
        id: 'acc_double_entry',
        label: 'Double Entry',
        url: '#/accounting/double-entry',
        subItems: [
          { id: 'acc_journal_entry', label: 'Journal Entry', url: '#/accounting/double-entry/journal' },
          { id: 'acc_chart_of_accounts', label: 'Chart of Accounts', url: '#/accounting/double-entry/chart' }
        ]
      },
      { id: 'acc_budget_planner', label: 'Budget Planner', url: '#/accounting/budget-planner' },
      { id: 'acc_financial_goal', label: 'Financial Goal', url: '#/accounting/financial-goal' },
      { id: 'acc_setup', label: 'Accounting Setup', url: '#/accounting/setup' },
      { id: 'acc_print_settings', label: 'Print Settings', url: '#/accounting/print-settings' }
    ]
  },
  {
    id: 'crm_system',
    label: 'CRM System',
    icon: Layers,
    url: '#/crm',
    roles: ['SUPERADMIN', 'USER', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER', 'SERVICE_PERSONNEL'],
    subItems: [
      { id: 'crm_leads', label: 'Leads', url: '#/crm/leads' },
      { id: 'crm_deals', label: 'Deals', url: '#/crm/deals' },
      { id: 'crm_form_builder', label: 'Form Builder', url: '#/crm/form-builder' },
      { id: 'crm_contract', label: 'Contract', url: '#/crm/contract' },
      { id: 'crm_system_setup', label: 'CRM System Setup', url: '#/crm/system-setup' }
    ]
  },
  {
    id: 'project_system',
    label: 'Project System',
    icon: Share2,
    url: '#/project',
    roles: ['SUPERADMIN', 'USER', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER', 'SERVICE_PERSONNEL'],
    subItems: [
      { id: 'project_projects', label: 'Projects', url: '#/project/projects' },
      { id: 'project_tasks', label: 'Tasks', url: '#/project/tasks' },
      { id: 'project_task_calendar', label: 'Task Calendar', url: '#/project/task-calendar' },
      { id: 'project_report', label: 'Project Report', url: '#/project/report' },
      {
        id: 'project_system_setup',
        label: 'Project System Setup',
        url: '#/project/system-setup',
        subItems: [
          { id: 'project_task_stages', label: 'Project Task Stages', url: '#/project/system-setup/task-stages' },
          { id: 'project_bug_status', label: 'Bug Status', url: '#/project/system-setup/bug-status' }
        ]
      }
    ]
  },
  {
    id: 'user_management',
    label: 'User Management',
    icon: Users,
    url: '#/user-management',
    roles: ['SUPERADMIN', 'USER', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER', 'SERVICE_PERSONNEL'],
    subItems: [
      { id: 'user_accounts', label: 'User Accounts & Roles', url: '#/user-management/accounts' },
      { id: 'user_activity_logs', label: 'Full Audit Activity Logs', url: '#/user-management/activity-logs' }
    ]
  },
  {
    id: 'products_system',
    label: 'Products System',
    icon: ShoppingCart,
    url: '#/products',
    roles: ['SUPERADMIN', 'USER', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER', 'SERVICE_PERSONNEL'],
    subItems: [
      { id: 'products_inventory', label: 'Inventory Management', url: '#/products/inventory' },
      { id: 'products_stock', label: 'Stock Transactions', url: '#/products/stock' }
    ]
  },
  {
    id: 'service_meeting',
    label: 'Service Meeting',
    icon: MessageSquare,
    url: '#/service-meeting',
    roles: ['SUPERADMIN', 'USER', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER', 'SERVICE_PERSONNEL']
  },
  {
    id: 'material_request',
    label: 'Material Request',
    icon: Headphones,
    url: '#/material-request',
    roles: ['SUPERADMIN', 'USER', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER', 'SERVICE_PERSONNEL']
  },
  {
    id: 'notification_template',
    label: 'Notification Template',
    icon: FileCode,
    url: '#/notification-template',
    roles: ['SUPERADMIN', 'USER', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER', 'SERVICE_PERSONNEL']
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    url: '#/settings',
    roles: ['SUPERADMIN', 'USER', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER', 'SERVICE_PERSONNEL'],
    subItems: [
      { id: 'settings_system', label: 'System Settings', url: '#/settings/system' },
      { id: 'settings_security', label: 'Security & MFA', url: '#/settings/security' }
    ]
  }
];
