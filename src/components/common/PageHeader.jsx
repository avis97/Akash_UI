import React from 'react';
import { Plus, Download, Upload } from 'lucide-react';

const PageHeader = ({ title, breadcrumbs, onAdd, onExport, onImport }) => {
  return (
    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
      <div className="page-title">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-color)', marginBottom: '0.5rem' }}>{title}</h2>
        <div className="breadcrumbs" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {breadcrumbs.map((crumb, index) => (
            <span key={index}>
              {index > 0 && <span style={{ margin: '0 0.5rem' }}>/</span>}
              <span style={{ color: index === breadcrumbs.length - 1 ? 'var(--primary-color)' : 'inherit' }}>
                {crumb}
              </span>
            </span>
          ))}
        </div>
      </div>
      
      <div className="page-actions" style={{ display: 'flex', gap: '0.75rem' }}>
        {onImport && (
          <button className="btn btn-outline" onClick={onImport} title="Import">
            <Upload size={16} />
          </button>
        )}
        {onExport && (
          <button className="btn btn-outline" onClick={onExport} title="Export">
            <Download size={16} />
          </button>
        )}
        {onAdd && (
          <button className="btn btn-primary" onClick={onAdd} title="Create" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Create
          </button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
