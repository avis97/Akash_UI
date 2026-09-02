import React, { useState } from 'react';
import PageHeader from './common/PageHeader';
import { Calendar, CheckCircle, Clock, PackageOpen, AlertTriangle } from 'lucide-react';

const ServiceMeetings = ({ meetings, role }) => {
  const [activeTab, setActiveTab] = useState('meetings');

  return (
    <div style={{ padding: '1rem' }}>
      <PageHeader 
        title="Service Meetings & Tracking" 
        breadcrumbs={['Dashboard', 'Service Meetings']} 
        onAdd={() => {}}
      />

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <button 
          className={`btn ${activeTab === 'meetings' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('meetings')}
        >
          Meeting Cards
        </button>
        <button 
          className={`btn ${activeTab === 'materials' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('materials')}
        >
          Material Requests {role === 'MASTER_ADMIN' && <span style={{ marginLeft: '8px', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.75rem' }}>2</span>}
        </button>
      </div>

      {activeTab === 'meetings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {meetings?.map(meeting => (
            <div key={meeting.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--brand-primary)' }}>{meeting.id}</span>
                <span style={{ 
                  padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600,
                  backgroundColor: meeting.status === 'Completed' ? '#dcfce7' : meeting.status === 'In Progress' ? '#fef9c3' : '#e0e7ff',
                  color: meeting.status === 'Completed' ? '#166534' : meeting.status === 'In Progress' ? '#854d0e' : '#3730a3'
                }}>
                  {meeting.status}
                </span>
              </div>
              
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{meeting.client}</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <Calendar size={16} /> {meeting.date}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 600 }}>Assignee:</span> {meeting.assignee}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>View Details</button>
                <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Update Status</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><PackageOpen size={20} /> Material Request Workflow</h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(0,0,0,0.02)', textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '1rem' }}>Request ID</th>
                <th style={{ padding: '1rem' }}>Meeting Ref</th>
                <th style={{ padding: '1rem' }}>Requested By</th>
                <th style={{ padding: '1rem' }}>Materials</th>
                <th style={{ padding: '1rem' }}>Admin Approval</th>
                <th style={{ padding: '1rem' }}>Facility Manager</th>
                <th style={{ padding: '1rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', fontWeight: 600 }}>REQ-042</td>
                <td style={{ padding: '1rem', color: 'var(--brand-primary)' }}>MTG-002</td>
                <td style={{ padding: '1rem' }}>Alok Naiya</td>
                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>1x Compressor Unit<br/>20m Copper Wire</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#eab308', fontWeight: 600 }}><Clock size={16} /> Pending</span>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>Waiting Admin</td>
                <td style={{ padding: '1rem' }}>
                  {role === 'MASTER_ADMIN' ? (
                    <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Approve</button>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>No Action</span>
                  )}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', fontWeight: 600 }}>REQ-041</td>
                <td style={{ padding: '1rem', color: 'var(--brand-primary)' }}>MTG-001</td>
                <td style={{ padding: '1rem' }}>BADAL NASKAR</td>
                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>3x Fire Extinguishers</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 600 }}><CheckCircle size={16} /> Approved</span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#eab308', fontWeight: 600 }}><AlertTriangle size={16} /> Pending</span>
                </td>
                <td style={{ padding: '1rem' }}>
                  {role === 'FACILITY_MANAGER' ? (
                    <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Initiate Work</button>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>No Action</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

export default ServiceMeetings;
