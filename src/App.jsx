import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import MainContent from './components/layout/MainContent';
import { allNavItems } from './config/navigationConfig';
import { API_URL } from './config/api';


function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [openMenus, setOpenMenus] = useState({ dashboard: true, hrm_system: true });
  const [currentRole, setCurrentRole] = useState('SUPERADMIN'); 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Central Dynamic CRM State synced 100% with Backend API & Database
  const [crmData, setCrmData] = useState({
    users: [],
    meetings: [],
    materialRequests: [],
    attendance: [],
    leaves: [],
    shifts: [],
    salaryRecords: [],
    locations: [],
    geofenceAlerts: [],
    products: [],
    quotations: [],
    invoices: [],
    purchases: [],
    vouchers: [],
    siteAMCs: [],
    activityLogs: [],
    erp: null,
    employees: [],
    payroll: [],
    leads: [],
    deals: [],
    projects: [],
    tasks: [],
    bankAccounts: [],
    serviceMeetings: [],
    inventory: [],
    amcs: []
  });

  // Fetch Live Data from Backend API
  const fetchLiveData = useCallback(async () => {
    try {
      const [
        usersRes, meetingsRes, matReqRes, attRes, leavesRes, shiftsRes,
        salRes, locRes, geoRes, prodRes, quotRes, invRes, purRes, vchRes, amcRes, logsRes, projRes
      ] = await Promise.allSettled([
        fetch(API_URL('/api/users'), {
          headers: {
            ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {}),
            'X-User-Role': currentRole
          }
        }).then(r => r.json()),
        fetch(API_URL('/api/meetings')).then(r => r.json()),
        fetch(API_URL('/api/material-requests')).then(r => r.json()),
        fetch(API_URL('/api/attendance')).then(r => r.json()),
        fetch(API_URL('/api/leaves')).then(r => r.json()),
        fetch(API_URL('/api/shifts')).then(r => r.json()),
        fetch(API_URL('/api/payroll')).then(r => r.json()),
        fetch(API_URL('/api/tracking/locations')).then(r => r.json()),
        fetch(API_URL('/api/tracking/geofence-alerts')).then(r => r.json()),
        fetch(API_URL('/api/inventory')).then(r => r.json()),
        fetch(API_URL('/api/billing/quotations')).then(r => r.json()),
        fetch(API_URL('/api/billing/invoices')).then(r => r.json()),
        fetch(API_URL('/api/purchases')).then(r => r.json()),
        fetch(API_URL('/api/vouchers')).then(r => r.json()),
        fetch(API_URL('/api/amc')).then(r => r.json()),
        fetch(API_URL('/api/activity-logs')).then(r => r.json()),
        fetch(API_URL('/api/projects')).then(r => r.json())
      ]);

      setCrmData(prev => ({
        ...prev,
        users: usersRes.status === 'fulfilled' && usersRes.value?.success ? usersRes.value.data : prev.users,
        meetings: meetingsRes.status === 'fulfilled' && meetingsRes.value?.success ? meetingsRes.value.data : prev.meetings,
        serviceMeetings: meetingsRes.status === 'fulfilled' && meetingsRes.value?.success ? meetingsRes.value.data : prev.serviceMeetings,
        materialRequests: matReqRes.status === 'fulfilled' && matReqRes.value?.success ? matReqRes.value.data : prev.materialRequests,
        attendance: attRes.status === 'fulfilled' && attRes.value?.success ? attRes.value.data : prev.attendance,
        leaves: leavesRes.status === 'fulfilled' && leavesRes.value?.success ? leavesRes.value.data : prev.leaves,
        shifts: shiftsRes.status === 'fulfilled' && shiftsRes.value?.success ? shiftsRes.value.data : prev.shifts,
        salaryRecords: salRes.status === 'fulfilled' && salRes.value?.success ? salRes.value.data : prev.salaryRecords,
        locations: locRes.status === 'fulfilled' && locRes.value?.success ? locRes.value.data : prev.locations,
        geofenceAlerts: geoRes.status === 'fulfilled' && geoRes.value?.success ? geoRes.value.data : prev.geofenceAlerts,
        products: prodRes.status === 'fulfilled' && prodRes.value?.success ? prodRes.value.data : prev.products,
        inventory: prodRes.status === 'fulfilled' && prodRes.value?.success ? prodRes.value.data : prev.inventory,
        quotations: quotRes.status === 'fulfilled' && quotRes.value?.success ? quotRes.value.data : prev.quotations,
        invoices: invRes.status === 'fulfilled' && invRes.value?.success ? invRes.value.data : prev.invoices,
        purchases: purRes.status === 'fulfilled' && purRes.value?.success ? purRes.value.data : prev.purchases,
        vouchers: vchRes.status === 'fulfilled' && vchRes.value?.success ? vchRes.value.data : prev.vouchers,
        siteAMCs: amcRes.status === 'fulfilled' && amcRes.value?.success ? amcRes.value.data : prev.siteAMCs,
        amcs: amcRes.status === 'fulfilled' && amcRes.value?.success ? amcRes.value.data : prev.amcs,
        activityLogs: logsRes.status === 'fulfilled' && logsRes.value?.success ? logsRes.value.data : prev.activityLogs,
        projects: projRes.status === 'fulfilled' && projRes.value?.success ? projRes.value.data : prev.projects
      }));
    } catch (e) {
      console.warn('API sync fallback active:', e);
    }
  }, []);

  // Sync state with current URL pathname
  useEffect(() => {
    const path = location.pathname;
    
    // Default route redirect
    if (path === '/' || path === '') {
      navigate('/dashboard', { replace: true });
      return;
    }

    const findItemByUrl = (items, ancestors = []) => {
      for (const item of items) {
        if (item.url === path || (item.url && path.startsWith(item.url) && item.url !== '/')) {
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
    } else {
      // Map custom URL path directly to activeTab
      if (path.includes('service-meeting')) setActiveTab('service_meeting');
      else if (path.includes('material-request')) setActiveTab('material_request');
      else if (path.includes('site-amc')) setActiveTab('site_amc');
      else if (path.includes('location')) setActiveTab('location_tracking');
      else if (path.includes('inventory') || path.includes('products')) setActiveTab('products_inventory');
      else if (path.includes('attendance')) setActiveTab('hrm_attendance');
      else if (path.includes('payroll')) setActiveTab('hrm_payroll');
      else if (path.includes('leave')) setActiveTab('hrm_leave');
      else if (path.includes('billing') || path.includes('invoices')) setActiveTab('acc_billing');
      else if (path.includes('purchases')) setActiveTab('acc_purchases');
      else if (path.includes('vouchers')) setActiveTab('acc_vouchers');
      else if (path.includes('user')) setActiveTab('user_management');
      else setActiveTab('dashboard');
    }
  }, [location.pathname, navigate]);

  // Check stored session on mount & fetch live API data
  useEffect(() => {
    const storedUserStr = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedToken && storedToken.length > 2000) {
      // Purge token created with uncompressed avatar payload
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setCurrentUser(null);
    } else if (storedToken && storedUserStr) {
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
    fetchLiveData();
  }, [fetchLiveData]);

  const handleLogin = (data) => {
    const user = data.user || { email: data.email, role: data.role || 'SUPERADMIN', name: 'User' };
    setIsAuthenticated(true);
    setCurrentUser(user);
    setCurrentRole(user.role || 'SUPERADMIN');
    fetchLiveData();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
    if (updatedUser.role) {
      setCurrentRole(updatedUser.role);
    }
  };

  const normalizedRole = (currentRole || '').toUpperCase();
  const navItems = allNavItems.filter(item => !item.roles || item.roles.includes(normalizedRole));

  const navigateTo = (url, id) => {
    navigate(url);
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
          onUserUpdate={handleUserUpdate}
        />

        <MainContent 
          activeTab={activeTab}
          activeLabel={getActiveLabel()}
          crmData={crmData}
          currentRole={currentRole}
          currentUser={currentUser}
          onRefresh={fetchLiveData}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}

