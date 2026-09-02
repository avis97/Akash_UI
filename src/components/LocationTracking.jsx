import React, { useState } from 'react';
import { 
  MapPin, 
  Navigation, 
  BatteryCharging, 
  AlertTriangle, 
  Clock, 
  ShieldAlert,
  Radio,
  User
} from 'lucide-react';

export default function LocationTracking({ data, onRefresh }) {
  const [selectedPersonnel, setSelectedPersonnel] = useState(data.locations[0] || null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner Overview */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--brand-green)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
            <Radio style={{ width: 28, height: 28 }} className="animate-pulse" />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700 }}>
              Live GPS Field Personnel Telemetry
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Real-time location monitoring, travel efficiency tracking, and geofencing breach detection.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-green)' }}>
              {data.locations.length} Active
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Field Devices Streaming</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--brand-yellow)' }}>
              {data.geofenceAlerts.length}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Geofence Alerts Today</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Personnel Cards + Map Simulator + Geofence Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        
        {/* Left Column: Personnel List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            Service Personnel On-Duty
          </div>

          {data.locations.map(loc => (
            <div 
              key={loc.id} 
              className="glass-card" 
              style={{
                cursor: 'pointer',
                borderColor: selectedPersonnel?.id === loc.id ? 'var(--brand-gold)' : 'var(--border-color)',
                background: selectedPersonnel?.id === loc.id ? 'rgba(234, 179, 8, 0.08)' : 'var(--bg-card)'
              }}
              onClick={() => setSelectedPersonnel(loc)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{loc.userName}</div>
                <span className={`badge ${loc.status === 'ACTIVE' ? 'badge-approved' : 'badge-pending'}`}>
                  {loc.status}
                </span>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
                {loc.designation}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                <MapPin style={{ width: 14, height: 14, color: 'var(--brand-yellow)' }} />
                <span>{loc.address}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <span>🔋 Battery: {loc.batteryLevel}%</span>
                <span>⏱ Speed: {loc.speed} km/h</span>
                <span>Updated: {loc.lastUpdated}</span>
              </div>
            </div>
          ))}

          {/* Geofence Breach Alert Box */}
          <div className="glass-card" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-red)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
              <ShieldAlert style={{ width: 18, height: 18 }} />
              Geofence Alerts & Deviation Logs
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {data.geofenceAlerts.map(alert => (
                <div key={alert.id} style={{ fontSize: '0.8rem', padding: '0.5rem', background: 'rgba(15,23,42,0.6)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--brand-yellow)', fontWeight: 600 }}>
                    <span>{alert.userName}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ marginTop: '0.2rem', color: 'var(--text-secondary)' }}>
                    {alert.message}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Live Map View Simulator */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', minHeight: 450, position: 'relative', overflow: 'hidden' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', zIndex: 5 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem' }}>
                Kolkata Operational Sector Live Radar
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Targeting: {selectedPersonnel ? selectedPersonnel.userName : 'All Field Techs'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="badge badge-approved">GPS Fixed</span>
              <span className="badge badge-scheduled">Geofence Enforced</span>
            </div>
          </div>

          {/* Interactive Simulated Map Canvas */}
          <div style={{
            flex: 1,
            background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)',
            borderRadius: 'var(--radius-md)',
            position: 'relative',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>

            {/* Grid overlay lines to simulate map coordinates */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }} />

            {/* Sector V Geofence Circle */}
            <div style={{
              position: 'absolute',
              width: 260,
              height: 260,
              borderRadius: '50%',
              border: '2px dashed var(--brand-gold)',
              background: 'rgba(234, 179, 8, 0.05)',
              display: 'flex',
              alignItems: 'top',
              justifyContent: 'center',
              paddingTop: '8px'
            }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--brand-yellow)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                Sector V Designated Zone
              </span>
            </div>

            {/* Sujan Pin */}
            <div style={{
              position: 'absolute',
              top: '42%',
              left: '48%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{
                background: 'var(--brand-gold)',
                color: '#000',
                padding: '0.35rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontWeight: 800,
                boxShadow: '0 0 15px var(--brand-gold)',
                whiteSpace: 'nowrap'
              }}>
                📍 Sujan Mukhopadhyay (TCS Site)
              </div>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--brand-yellow)', marginTop: 4 }} className="animate-ping" />
            </div>

            {/* Rajesh Pin */}
            <div style={{
              position: 'absolute',
              top: '65%',
              left: '32%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{
                background: 'var(--brand-cyan)',
                color: '#000',
                padding: '0.35rem 0.6rem',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontWeight: 800,
                boxShadow: '0 0 15px var(--brand-cyan)',
                whiteSpace: 'nowrap'
              }}>
                📍 Rajesh Kumar (Dumdum HO)
              </div>
            </div>

            {/* Map Legend Footer overlay */}
            <div style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              right: 12,
              background: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(8px)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.78rem'
            }}>
              <div>
                <strong>Active GPS Node:</strong> {selectedPersonnel ? selectedPersonnel.address : 'Sector V Kolkata'}
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                Lat: {selectedPersonnel?.latitude || 22.5726} N • Lng: {selectedPersonnel?.longitude || 88.4331} E
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
