import React from 'react';
import PageHeader from '../common/PageHeader';
import DataTable from '../common/DataTable';

const UniversalModule = ({ title, breadcrumbs, columns, data }) => {
  const handleAdd = () => {
    console.log(`Create new in ${title}`);
  };

  const handleImport = () => {
    console.log(`Import to ${title}`);
  };

  const handleExport = () => {
    console.log(`Export from ${title}`);
  };

  const handleEdit = (row) => {
    console.log(`Edit in ${title}:`, row);
  };

  const handleDelete = (row) => {
    console.log(`Delete in ${title}:`, row);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <PageHeader 
        title={title} 
        breadcrumbs={breadcrumbs} 
        onAdd={handleAdd}
        onExport={handleExport}
        onImport={handleImport}
      />
      
      <DataTable 
        columns={columns} 
        data={data || []} 
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default UniversalModule;
