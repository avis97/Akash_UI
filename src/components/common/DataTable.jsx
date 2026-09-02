import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const DataTable = ({ columns, data, onEdit, onDelete }) => {
  return (
    <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="glass-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.4)' }}>
              {columns.map((col, index) => (
                <th key={index} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-color)' }}>
                  {col.header}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-color)' }}>
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} className="table-row-hover">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {onEdit && (
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.4rem', borderRadius: '4px' }}
                          onClick={() => onEdit(row)}
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.4rem', borderRadius: '4px', color: '#dc2626', borderColor: '#fca5a5' }}
                          onClick={() => onDelete(row)}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No data available in table
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
