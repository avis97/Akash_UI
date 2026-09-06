import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MainContent from './components/layout/MainContent';
import { allNavItems } from './config/navigationConfig';

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
  const [openMenus, setOpenMenus] = useState({ dashboard: true, hrm_system: true });
  const [currentRole, setCurrentRole] = useState('SUPERADMIN'); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Central CRM State
  const [crmData] = useState({
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
    amcs: mockAMCs
  });

  // Sync state with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/dashboard';
      
      const findItemByUrl = (items, ancestors = []) => {
        for (const item of items) {
          if (item.url === hash) {
            ancestors.forEach(id => {
              setOpenMenus(prev => ({ ...prev, [id]: true }));
            });
            return item;
          }
          if (item.subItems) {
            const found = findItemByUrl(item.subItems, [...ancestors, item.id]);
            if (found) {
              setOpenMenus(prev => ({ ...prev, [item.id]: true }));
              return found;
            }
          }
        }
        return null;
      };

      const matched = findItemByUrl(allNavItems);
      if (matched) {
        setActiveTab(matched.id);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run on mount

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Check stored session on mount
  useEffect(() => {
    const storedUserStr = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedToken && storedUserStr) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        setCurrentUser(storedUser);
        setCurrentRole(storedUser.role || 'SUPERADMIN');
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLogin = (data) => {
    const user = data.user || { email: data.email, role: data.role || 'SUPERADMIN', name: 'User' };
    setIsAuthenticated(true);
    setCurrentUser(user);
    setCurrentRole(user.role || 'SUPERADMIN');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const navItems = allNavItems.filter(item => !item.roles || item.roles.includes(currentRole));

  const navigateTo = (url, id) => {
    window.location.hash = url;
    setActiveTab(id);
  };

  const toggleMenu = (id) => {
    setOpenMenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getActiveLabel = () => {
    const searchNav = (items) => {
      for (const item of items) {
        if (item.id === activeTab) return item.label;
        if (item.subItems) {
          const res = searchNav(item.subItems);
          if (res) return `${item.label} / ${res}`;
        }
      }
      return null;
    };
    return searchNav(allNavItems) || 'Dashboard';
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <Sidebar 
        navItems={navItems}
        activeTab={activeTab}
        openMenus={openMenus}
        onToggleMenu={toggleMenu}
        onNavigate={navigateTo}
      />

      <div className="main-wrapper">
        <Header 
          activeLabel={getActiveLabel()}
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <MainContent 
          activeTab={activeTab}
          activeLabel={getActiveLabel()}
          crmData={crmData}
          currentRole={currentRole}
        />
      </div>
    </div>
  );
}
