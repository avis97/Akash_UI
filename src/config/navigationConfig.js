import { 
  LayoutDashboard, 
  MessageSquare,
  PackageOpen,
  UserCheck, 
  DollarSign, 
  Navigation, 
  ShoppingCart, 
  FileText, 
  ShoppingBag, 
  CreditCard, 
  Building, 
  Users,
  FolderKanban
} from 'lucide-react';

export const allNavItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    url: '/dashboard',
    roles: ['SUPERADMIN', 'EMPLOYEE', 'CLIENT', 'USER', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER', 'SERVICE_PERSONNEL']
  },
  {
    id: 'service_meeting',
    label: 'Service Meetings',
    icon: MessageSquare,
    url: '/service-meetings',
    roles: ['SUPERADMIN', 'EMPLOYEE', 'CLIENT', 'USER', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER', 'SERVICE_PERSONNEL']
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: FolderKanban,
    url: '/projects',
    roles: ['SUPERADMIN', 'EMPLOYEE', 'CLIENT', 'USER', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER', 'SERVICE_PERSONNEL']
  },
  {
    id: 'material_request',
    label: 'Material Requests',
    icon: PackageOpen,
    url: '/material-requests',
    roles: ['SUPERADMIN', 'EMPLOYEE', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER', 'SERVICE_PERSONNEL']
  },
  {
    id: 'hrm_attendance',
    label: 'Attendance & Leave',
    icon: UserCheck,
    url: '/attendance-leave',
    roles: ['SUPERADMIN', 'EMPLOYEE', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER', 'SERVICE_PERSONNEL']
  },
  {
    id: 'hrm_payroll',
    label: 'Salary & Payroll',
    icon: DollarSign,
    url: '/salary-payroll',
    roles: ['SUPERADMIN', 'EMPLOYEE', 'SERVICE_PERSONNEL', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER']
  },
  {
    id: 'location_tracking',
    label: 'Location Tracking',
    icon: Navigation,
    url: '/location-tracking',
    roles: ['SUPERADMIN', 'EMPLOYEE', 'SERVICE_PERSONNEL', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER']
  },
  {
    id: 'products_inventory',
    label: 'Inventory Management',
    icon: ShoppingCart,
    url: '/inventory-management',
    roles: ['SUPERADMIN', 'EMPLOYEE', 'SERVICE_PERSONNEL', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER']
  },
  {
    id: 'acc_billing',
    label: 'Billing & Quotations',
    icon: FileText,
    url: '/billing-quotations',
    roles: ['SUPERADMIN', 'CLIENT', 'USER', 'EMPLOYEE', 'MASTER_ADMIN', 'SUB_ADMIN']
  },
  {
    id: 'acc_purchases',
    label: 'Purchase Entry',
    icon: ShoppingBag,
    url: '/purchase-entry',
    roles: ['SUPERADMIN', 'EMPLOYEE', 'SERVICE_PERSONNEL', 'MASTER_ADMIN', 'SUB_ADMIN']
  },
  {
    id: 'acc_vouchers',
    label: 'Voucher Entry',
    icon: CreditCard,
    url: '/voucher-entry',
    roles: ['SUPERADMIN', 'MASTER_ADMIN']
  },
  {
    id: 'site_amc',
    label: 'Site AMC Tracker',
    icon: Building,
    url: '/site-amc-tracker',
    roles: ['SUPERADMIN', 'EMPLOYEE', 'CLIENT', 'MASTER_ADMIN', 'SUB_ADMIN', 'FACILITY_MANAGER', 'SERVICE_PERSONNEL']
  },
  {
    id: 'user_management',
    label: 'User Management',
    icon: Users,
    url: '/user-management',
    roles: ['SUPERADMIN']
  }
];
