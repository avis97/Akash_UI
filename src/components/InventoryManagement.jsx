import React from 'react';
import PageHeader from './common/PageHeader';
import DataTable from './common/DataTable';
import { AlertCircle, QrCode } from 'lucide-react';

const InventoryManagement = ({ inventory }) => {
  const columns = [
    { 
      header: 'SKU / Barcode', 
      accessor: 'sku',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{row.sku}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <QrCode size={12} /> {row.barcode}
          </div>
        </div>
      )
    },
    { header: 'Product Name', accessor: 'name' },
    { header: 'Category', accessor: 'category' },
    { 
      header: 'Current Stock', 
      accessor: 'stock',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{row.stock}</span>
          {row.stock <= row.minStock && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626', backgroundColor: '#fef2f2', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
              <AlertCircle size={12} /> Low Stock
            </span>
          )}
        </div>
      )
    },
    { header: 'Status', accessor: 'status' }
  ];

  return (
    <div style={{ padding: '1rem' }}>
      <PageHeader 
        title="Inventory Management" 
        breadcrumbs={['Dashboard', 'Inventory Management']} 
        onAdd={() => {}}
        onExport={() => {}}
        onImport={() => {}}
      />
      
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <QrCode size={18} /> Scan Barcode/QR
        </button>
      </div>

      <DataTable 
        columns={columns} 
        data={inventory || []} 
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </div>
  );
};

export default InventoryManagement;
