import React from 'react';
import PageHeader from './common/PageHeader';
import { MapPin, Navigation, History, Bell } from 'lucide-react';

const LocationTracking = () => {
  return (
    <div style={{ padding: '1rem' }}>
      <PageHeader 
        title="Location Tracking for Service Personnel" 
        breadcrumbs={['Dashboard', 'Location Tracking']} 
      />
      
      <div className="row" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        
        {/* Mock Map Area */}
        <div style={{ flex: '1 1 60%', minWidth: '300px' }}>
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden', height: '600px', position: 'relative', backgroundColor: '#e2e8f0', backgroundImage: 'url("https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&q=80")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {/* Map Overlay to wash it out */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(2px)' }}></div>
            
            {/* Mock Map Pins */}
            <div style={{ position: 'absolute', top: '30%', left: '40%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ padding: '4px 8px', backgroundColor: 'var(--brand-primary)', color: 'white', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>Alok Naiya</div>
              <MapPin size={32} color="var(--brand-primary)" fill="white" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }} />
              <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--brand-primary)', borderRadius: '50%', opacity: 0.5, marginTop: '-8px', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
            </div>

            <div style={{ position: 'absolute', top: '60%', left: '20%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>Jayanta Basak (Geofence Alert)</div>
              <MapPin size={32} color="#ef4444" fill="white" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }} />
              <div style={{ width: '40px', height: '40px', border: '2px solid #ef4444', borderRadius: '50%', position: 'absolute', top: '24px', opacity: 0.5 }}></div>
            </div>

            <div style={{ position: 'absolute', top: '45%', left: '70%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ padding: '4px 8px', backgroundColor: '#10b981', color: 'white', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>BADAL NASKAR</div>
              <MapPin size={32} color="#10b981" fill="white" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }} />
            </div>

            {/* Controls */}
            <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-outline" style={{ backgroundColor: 'white', width: '40px', height: '40px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Navigation size={20} /></button>
            </div>
          </div>
        </div>

        {/* Sidebar Data */}
        <div style={{ flex: '1 1 35%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bell size={18} color="#ef4444" /> Geofencing Alerts</h3>
            <div style={{ padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px' }}>
              <div style={{ fontWeight: 'bold', color: '#b91c1c' }}>Alert: Route Deviation</div>
              <div style={{ fontSize: '0.85rem', color: '#dc2626', marginTop: '4px' }}>Jayanta Basak has deviated 2km from assigned route (TechCorp HVAC job).</div>
              <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '8px' }}>Just now</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><History size={18} /> Live Service Personnel</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: 'var(--brand-primary)', borderRadius: '50%' }}></div>
                <div>
                  <div style={{ fontWeight: 600 }}>Alok Naiya</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>En route to City Hospital (ETA: 15 mins)</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
                <div>
                  <div style={{ fontWeight: 600 }}>BADAL NASKAR</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>On Site: Sunrise Plaza</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ping {
          75%, 100% { transform: scale(2.5); opacity: 0; }
        }
      `}} />
    </div>
  );
};

export default LocationTracking;
