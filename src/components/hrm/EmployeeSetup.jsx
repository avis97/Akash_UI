import React from 'react';
import UserManagement from '../UserManagement';

const EmployeeSetup = ({ employees = [], onRefresh, currentRole = 'SUPERADMIN' }) => {
  return (
    <UserManagement 
      data={{ users: employees }} 
      currentRole={currentRole} 
      onRefresh={onRefresh} 
      initialTab="employees" 
    />
  );
};

export default EmployeeSetup;
