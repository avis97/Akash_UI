import React from 'react';
import PageHeader from '../common/PageHeader';
import DataTable from '../common/DataTable';

const EmployeeSetup = ({ employees }) => {
  const columns = [
    { 
      header: 'Employee ID', 
      accessor: 'id',
      render: (row) => (
        <a href="#" className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', color: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' }}>
          {row.id}
        </a>
      )
    },
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Branch', accessor: 'branch' },
    { header: 'Department', accessor: 'department' },
    { header: 'Designation', accessor: 'designation' },
    { header: 'Date Of Joining', accessor: 'dateOfJoining' },
    { header: 'Last Login', accessor: 'lastLogin' }
  ];

  const breadcrumbs = ['Dashboard', 'Employee'];

  const handleAdd = () => {
    console.log("Create new employee");
  };

  const handleImport = () => {
    console.log("Import employees");
  };

  const handleExport = () => {
    console.log("Export employees");
  };

  const handleEdit = (employee) => {
    console.log("Edit employee:", employee);
  };

  const handleDelete = (employee) => {
    console.log("Delete employee:", employee);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <PageHeader 
        title="Manage Employee" 
        breadcrumbs={breadcrumbs} 
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
      />
      
      <DataTable 
        columns={columns} 
        data={employees || []} 
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default EmployeeSetup;
