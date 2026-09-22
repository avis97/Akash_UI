import React, { useState, useEffect } from 'react';
import { User, Briefcase, Phone, Droplet } from 'lucide-react';

export default function EmployeeIDCard({ employeeId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIDCard = async () => {
      try {
        const res = await fetch(`/api/employee/${employeeId}/idcard`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (employeeId) fetchIDCard();
  }, [employeeId]);

  if (loading) return <div>Loading ID Card...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!data) return null;

  return (
    <div style={{
      width: '320px',
      margin: '0 auto',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      border: '2px solid var(--brand-gold, #d4af37)',
      borderRadius: '12px',
      overflow: 'hidden',
      color: '#fff',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center', padding: '15px 10px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--brand-yellow, #ffd700)', fontWeight: 800 }}>{data.company}</h2>
        <p style={{ margin: '5px 0 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>{data.address}</p>
      </div>
      
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{
          width: '100px', height: '100px', margin: '0 auto 15px', borderRadius: '50%',
          border: '3px solid var(--brand-gold, #d4af37)', overflow: 'hidden', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {data.avatarUrl ? (
            <img src={data.avatarUrl} alt={data.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={50} color="#94a3b8" />
          )}
        </div>
        
        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.3rem', fontWeight: 700 }}>{data.name}</h3>
        <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 500 }}>{data.designation}</p>
        
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px', textAlign: 'left', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Briefcase size={14} color="#94a3b8" />
            <span><span style={{ color: '#94a3b8' }}>EMP ID:</span> <strong>{data.employeeId}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Droplet size={14} color="#ef4444" />
            <span><span style={{ color: '#94a3b8' }}>Blood Group:</span> <strong>{data.bloodGroup}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Phone size={14} color="#10b981" />
            <span><span style={{ color: '#94a3b8' }}>Emergency:</span> <strong>{data.emergencyContact}</strong></span>
          </div>
        </div>
      </div>
      
      <div style={{ textAlign: 'center', padding: '10px', background: 'var(--brand-gold, #d4af37)', color: '#000', fontWeight: 700, fontSize: '0.85rem' }}>
        EMPLOYEE IDENTITY CARD
      </div>
    </div>
  );
}
