import React, { useState, useRef } from 'react';
import { Download, Printer, User, Shield, Briefcase, MapPin } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function IDCardGenerator({ users = [] }) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const cardRef = useRef(null);
  
  const staffUsers = users.filter(u => u.role !== 'CLIENT' && u.role !== 'USER');
  const employee = staffUsers.find(u => u.id === selectedUserId);

  const handleDownload = async () => {
    if (!cardRef.current || !employee) return;
    
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', [85.6, 53.98]); // Standard ID card size CR80 (2.125" x 3.375")
      pdf.addImage(imgData, 'PNG', 0, 0, 53.98, 85.6);
      pdf.save(`ID_Card_${employee.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
      alert('Failed to generate PDF. Make sure all images have CORS enabled if external.');
    }
  };

  const handlePrint = () => {
    if (!employee) return;
    window.print();
  };

  return (
    <div style={{ padding: '1.5rem', background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', minHeight: '500px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.5rem 0' }}>ID Card Generator</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Select an employee to generate and print their digital ID Card.</p>
        </div>
        
        <div style={{ width: '300px' }}>
          <select 
            className="select-field"
            value={selectedUserId} 
            onChange={e => setSelectedUserId(e.target.value)}
          >
            <option value="">-- Select Employee --</option>
            {staffUsers.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.employeeId || 'No ID'})</option>
            ))}
          </select>
        </div>
      </div>

      {employee ? (
        <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Card Preview Container */}
          <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1', display: 'flex', justifyContent: 'center' }}>
            
            {/* Actual ID Card (CR80 Portrait Dimensions scaled up for preview) */}
            <div 
              ref={cardRef} 
              className="id-card-print-target"
              style={{ 
                width: '240px', 
                height: '380px', 
                background: '#ffffff', 
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {/* Header / Brand */}
              <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '1rem', textAlign: 'center', color: '#fff' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.5px' }}>AKASH</h3>
                <span style={{ fontSize: '0.6rem', fontWeight: 500, letterSpacing: '1px', opacity: 0.9 }}>ENGINEERING</span>
              </div>

              {/* Photo & Identity */}
              <div style={{ flex: 1, padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ 
                  width: '90px', 
                  height: '90px', 
                  borderRadius: '50%', 
                  background: '#f1f5f9', 
                  border: '3px solid #10b981',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  overflow: 'hidden'
                }}>
                  {employee.avatar ? (
                    <img src={employee.avatar} alt={employee.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={40} color="#94a3b8" />
                  )}
                </div>

                <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', textAlign: 'center' }}>
                  {employee.name}
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, marginBottom: '1rem' }}>
                  {employee.designation || 'Staff Member'}
                </span>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.7rem', color: '#475569' }}>
                    <Shield size={12} color="#94a3b8" />
                    <strong>ID:</strong> {employee.employeeId || 'EMP-XXXX'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.7rem', color: '#475569' }}>
                    <Briefcase size={12} color="#94a3b8" />
                    <strong>Dept:</strong> {employee.department || 'General'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.7rem', color: '#475569' }}>
                    <MapPin size={12} color="#94a3b8" />
                    <strong>Base:</strong> {employee.assignedOfficeName || employee.branch || 'Headquarters'}
                  </div>
                </div>
              </div>

              {/* Footer Bar */}
              <div style={{ background: '#0f172a', padding: '0.75rem', textAlign: 'center', color: '#fff', fontSize: '0.6rem' }}>
                <div style={{ opacity: 0.8 }}>If found, please return to:</div>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>Akash Engineering HQ</div>
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '200px' }}>
            <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#065f46' }}>Ready to Print</h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#047857' }}>Card is formatted for standard CR80 ID Card dimensions (2.125" x 3.375").</p>
            </div>

            <button className="btn btn-primary" onClick={handleDownload} style={{ display: 'flex', justifyContent: 'center' }}>
              <Download size={16} /> Download PDF
            </button>
            <button className="btn btn-secondary" onClick={handlePrint} style={{ display: 'flex', justifyContent: 'center' }}>
              <Printer size={16} /> Print Direct
            </button>
            
            {/* Hidden Print Styles */}
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                body * { visibility: hidden; }
                .id-card-print-target, .id-card-print-target * { visibility: visible; }
                .id-card-print-target { 
                  position: absolute; 
                  left: 0; 
                  top: 0; 
                  box-shadow: none !important;
                  border: 1px solid #ccc;
                  -webkit-print-color-adjust: exact; 
                  print-color-adjust: exact;
                }
              }
            `}} />
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}>
          <User size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p>Please select an employee from the dropdown to generate their ID card.</p>
        </div>
      )}
    </div>
  );
}
