import React from 'react';
import { Plus, Download, Upload } from 'lucide-react';

const PageHeader = ({ title, subtitle, breadcrumbs = [], onAdd, onExport, onImport }) => {
  return (
    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
      <div className="page-title">
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-color)', marginBottom: '0.15rem', letterSpacing: '-0.2px' }}>{title}</h2>
        {subtitle && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, marginBottom: '0.15rem' }}>{subtitle}</p>}
        {Array.isArray(breadcrumbs) && breadcrumbs.length > 0 && (
          <div className="breadcrumbs" style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            {breadcrumbs.map((crumb, index) => (
              <span key={index}>
                {index > 0 && <span style={{ margin: '0 0.35rem' }}>/</span>}
                <span style={{ color: index === breadcrumbs.length - 1 ? 'var(--primary-color)' : 'inherit', fontWeight: index === breadcrumbs.length - 1 ? 600 : 400 }}>
                  {crumb}
                </span>
              </span>
            ))}
          </div>
        )}
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
