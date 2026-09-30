import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from './common/PageHeader';
import { MapPin, Navigation, History, Bell, Plus, Phone, Search, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import { parseCoordinates, reverseGeocode } from '../utils/locationUtils';

const LocationText = ({ location, batteryLevel }) => {
  const [addr, setAddr] = useState(location);

  useEffect(() => {
    let active = true;
    const coords = parseCoordinates(location);
    if (coords) {
      reverseGeocode(coords.lat, coords.lng).then(res => {
        if (active && res) setAddr(res);
      });
    } else {
      setAddr(location);
    }
    return () => { active = false; };
  }, [location]);

  return (
    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
      📍 {addr} {batteryLevel !== undefined ? `(Battery: ${batteryLevel}%)` : ''}
    </div>
  );
};

const LocationTracking = ({ data = {}, currentRole = 'SUPERADMIN', onRefresh = () => { } }) => {
  const [locations, setLocations] = useState(data.locations || []);
  const [alerts, setAlerts] = useState(data.geofenceAlerts || []);
  const [users, setUsers] = useState(data.users || []);

  const [selectedPhone, setSelectedPhone] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [phoneSearchResult, setPhoneSearchResult] = useState(null);
  const [phoneSearchError, setPhoneSearchError] = useState('');
  const [highlightedLocationId, setHighlightedLocationId] = useState(null);

  // Deletion modal state
  const [deletingLoc, setDeletingLoc] = useState(null);

  const fetchTrackingData = useCallback(async () => {
    try {
      const [locRes, alertRes, usrRes] = await Promise.allSettled([
        fetch('/api/tracking/locations').then(r => r.json()),
        fetch('/api/tracking/geofence-alerts').then(r => r.json()),
        fetch('/api/users').then(r => r.json())
      ]);

      if (locRes.status === 'fulfilled' && locRes.value?.success) setLocations(locRes.value.data);
      if (alertRes.status === 'fulfilled' && alertRes.value?.success) setAlerts(alertRes.value.data);
      if (usrRes.status === 'fulfilled' && usrRes.value?.success) setUsers(usrRes.value.data);
    } catch (err) {
      console.error('Error fetching tracking data:', err);
    }
  }, []);

  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  // Auto fetch location by phone number
  const handleFetchLocationByPhone = async (phoneNumberToUse) => {
    const targetPhone = phoneNumberToUse || selectedPhone || customPhone;
    if (!targetPhone) {
      setPhoneSearchError('Please select or enter a phone number');
      return;
    }

    setLoadingPhone(true);
    setPhoneSearchError('');
    setPhoneSearchResult(null);

    try {
      const res = await fetch(`/api/tracking/location-by-phone?phone=${encodeURIComponent(targetPhone)}`);
      const json = await res.json();

      if (json.success && json.data) {
        setPhoneSearchResult(json);
        setHighlightedLocationId(json.data.id);

        // Add to locations list if not already present or update existing
        setLocations(prev => {
          const exists = prev.some(l => l.id === json.data.id);
          if (exists) {
            return prev.map(l => l.id === json.data.id ? json.data : l);
          }
          return [json.data, ...prev];
        });
      } else {
        setPhoneSearchError(json.message || 'No location found for this phone number.');
      }
    } catch (err) {
      console.error('Failed to fetch location by phone:', err);
      setPhoneSearchError('Server error while looking up phone number location.');
    } finally {
      setLoadingPhone(false);
    }
  };

  const [showPingModal, setShowPingModal] = useState(false);
  const [pingData, setPingData] = useState({
    userId: '',
    phone: '',
    address: '',
    latitude: '22.6273',
    longitude: '88.3812'
  });

  const handleSendPing = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tracking/update-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pingData)
      });
      const json = await res.json();
      if (json.success) {
        setShowPingModal(false);
        setPingData({ userId: '', phone: '', address: '', latitude: '22.6273', longitude: '88.3812' });
        fetchTrackingData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLocation = async () => {
    if (!deletingLoc) return;
    try {
      const res = await fetch(`/api/tracking/locations/${deletingLoc.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDeletingLoc(null);
        fetchTrackingData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Extract all available non-null phone numbers from users
  const userPhoneList = (users || []).filter(u => u.phone);

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <PageHeader
          title="Location Tracking for Service Personnel"
          breadcrumbs={['Dashboard', 'Location Tracking']}
        />
        <button className="btn btn-primary" onClick={() => setShowPingModal(true)}>
          <Plus size={16} /> Log GPS Location Ping
        </button>
      </div>

      {/* Auto Location Fetch by Phone Number Box */}
      <div className="glass-card" style={{ padding: '1.25rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}>
          <Phone size={18} color="var(--brand-primary)" /> Automatic Location Fetch by User Phone Number
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 250px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Select Phone Number from Active User List
            </label>
            <select
              className="select-field"
              value={selectedPhone}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedPhone(val);
                if (val) {
                  setCustomPhone('');
                  handleFetchLocationByPhone(val);
                }
              }}
              style={{ width: '100%', padding: '8px 12px' }}
            >
              <option value="">-- Select Phone Number from List ({userPhoneList.length} Available) --</option>
              {userPhoneList.map(u => (
                <option key={u.id} value={u.phone}>
                  📱 {u.phone} — {u.name} ({u.role || u.designation})
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Or Enter Custom Phone Number
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="+91 98333 45678"
              value={customPhone}
              onChange={(e) => {
                setCustomPhone(e.target.value);
                setSelectedPhone('');
              }}
              style={{ width: '100%', padding: '8px 12px' }}
            />
          </div>

          <div style={{ alignSelf: 'flex-end' }}>
            <button
              className="btn btn-primary"
              disabled={loadingPhone}
              onClick={() => handleFetchLocationByPhone()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '38px' }}
            >
              <Search size={16} /> {loadingPhone ? 'Fetching GPS...' : 'Fetch Live Location'}
            </button>
          </div>
        </div>

        {/* Search status / feedback banner */}
        {phoneSearchError && (
          <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '6px', fontSize: '0.85rem' }}>
            ⚠️ {phoneSearchError}
          </div>
        )}

        {phoneSearchResult && (
          <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={16} color="#16a34a" /> Location fetched for {phoneSearchResult.user?.name} ({phoneSearchResult.user?.phone})
              </strong>
              <div style={{ marginTop: '2px', color: '#166534' }}>
                📍 {phoneSearchResult.data?.address} | Lat: {phoneSearchResult.data?.latitude?.toFixed(4)}, Lng: {phoneSearchResult.data?.longitude?.toFixed(4)} | Battery: {phoneSearchResult.data?.batteryLevel}%
              </div>
            </div>
            <button
              className="btn btn-sm btn-outline"
              onClick={() => setHighlightedLocationId(phoneSearchResult.data?.id)}
              style={{ backgroundColor: 'white' }}
            >
              Center Pin on Map
            </button>
          </div>
        )}
      </div>

      <div className="row" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>

        {/* Map Area */}
        <div style={{ flex: '1 1 60%', minWidth: '300px' }}>
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden', height: '580px', position: 'relative', backgroundColor: '#e2e8f0', backgroundImage: 'url("https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&q=80")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {/* Map Overlay */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(2px)' }}></div>

            {/* Dynamic Map Pins */}
            {locations.length === 0 ? (
              <div style={{ position: 'absolute', top: '45%', left: '35%', backgroundColor: 'rgba(15, 23, 42, 0.8)', color: 'white', padding: '1rem 1.5rem', borderRadius: '8px', fontWeight: 600 }}>
                📍 Fetching Live GPS Pins from Database...
              </div>
            ) : (
              locations.map((loc, idx) => {
                const isHighlighted = loc.id === highlightedLocationId;
                const userPhone = loc.user?.phone || users.find(u => u.id === loc.userId || u.name === loc.userName)?.phone || 'No Phone';
                const topPos = isHighlighted ? '40%' : `${25 + (idx * 18) % 50}%`;
                const leftPos = isHighlighted ? '45%' : `${20 + (idx * 25) % 65}%`;

                return (
                  <div
                    key={loc.id || idx}
                    onClick={() => setHighlightedLocationId(loc.id)}
                    style={{
                      position: 'absolute',
                      top: topPos,
                      left: leftPos,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      zIndex: isHighlighted ? 10 : 2,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      padding: '4px 8px',
                      backgroundColor: isHighlighted ? '#ea580c' : (idx % 2 === 0 ? 'var(--brand-primary)' : '#10b981'),
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      marginBottom: '4px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      textAlign: 'center'
                    }}>
                      <div>{loc.userName || 'Service Tech'}</div>
                      <div style={{ fontSize: '0.65rem', opacity: 0.9 }}>📱 {userPhone}</div>
                    </div>
                    <MapPin
                      size={isHighlighted ? 42 : 32}
                      color={isHighlighted ? '#ea580c' : (idx % 2 === 0 ? 'var(--brand-primary)' : '#10b981')}
                      fill="white"
                      style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))', transition: 'all 0.3s ease' }}
                    />
                    <div style={{
                      width: isHighlighted ? '18px' : '12px',
                      height: isHighlighted ? '18px' : '12px',
                      backgroundColor: isHighlighted ? '#ea580c' : 'var(--brand-primary)',
                      borderRadius: '50%',
                      opacity: 0.6,
                      marginTop: '-8px',
                      animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
                    }}></div>
                  </div>
                );
              })
            )}

            {/* Controls */}
            <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn btn-outline" onClick={onRefresh} style={{ backgroundColor: 'white', width: '40px', height: '40px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Navigation size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Data */}
        <div style={{ flex: '1 1 35%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={18} color="#ef4444" /> Geofencing Alerts ({alerts.length})
            </h3>
            {alerts.length === 0 ? (
              <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '0.85rem' }}>
                ✓ No active geofence violations detected in system database.
              </div>
            ) : (
              alerts.map(al => (
                <div key={al.id} style={{ padding: '0.85rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 'bold', color: '#b91c1c' }}>{al.alertType || 'Alert'}</div>
                  <div style={{ fontSize: '0.85rem', color: '#dc2626', marginTop: '4px' }}>{al.message}</div>
                  <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '6px' }}>{new Date(al.timestamp).toLocaleTimeString()}</div>
                </div>
              ))
            )}
          </div>

          <div className="glass-card" style={{ padding: '1.5rem', flex: 1 }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} /> Tracked Personnel & Phone Numbers ({locations.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '280px', overflowY: 'auto' }}>
              {locations.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No location pings stored yet in database.</p>
              ) : (
                locations.map(loc => {
                  const phone = loc.user?.phone || users.find(u => u.id === loc.userId || u.name === loc.userName)?.phone || 'Not Registered';
                  const isSelected = loc.id === highlightedLocationId;

                  return (
                    <div
                      key={loc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                        border: isSelected ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div
                        onClick={() => setHighlightedLocationId(loc.id)}
                        style={{ width: '12px', height: '12px', backgroundColor: isSelected ? '#2563eb' : '#10b981', borderRadius: '50%', flexShrink: 0, cursor: 'pointer' }}
                      ></div>
                      <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setHighlightedLocationId(loc.id)}>
                        <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{loc.userName || 'Field Staff'}</span>
                          <span style={{ fontSize: '0.75rem', color: '#0284c7', backgroundColor: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>
                            📱 {phone}
                          </span>
                        </div>
                        <LocationText location={loc.address} batteryLevel={loc.batteryLevel} />
                      </div>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                        title="Delete Location Ping"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingLoc(loc);
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Modal: Log GPS Ping */}
      {showPingModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Update Personnel GPS Location (Database POST)
            </h3>
            <form onSubmit={handleSendPing} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select Personnel (Name & Phone)</label>
                <select
                  className="select-field"
                  value={pingData.userId}
                  onChange={e => {
                    const u = users.find(usr => usr.id === e.target.value);
                    setPingData({
                      ...pingData,
                      userId: e.target.value,
                      phone: u?.phone || ''
                    });
                  }}
                >
                  <option value="">Select Personnel</option>
                  {(users || []).map(u => (
                    <option key={u.id} value={u.id}>{u.name} — 📱 {u.phone || 'No Phone'} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current Site Location / Address</label>
                <input
                  className="input-field"
                  required
                  placeholder="e.g. Salt Lake Sector V Office, Kolkata"
                  value={pingData.address}
                  onChange={e => setPingData({ ...pingData, address: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Latitude</label>
                  <input
                    className="input-field"
                    value={pingData.latitude}
                    onChange={e => setPingData({ ...pingData, latitude: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Longitude</label>
                  <input
                    className="input-field"
                    value={pingData.longitude}
                    onChange={e => setPingData({ ...pingData, longitude: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPingModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Post Location Ping</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Location Ping Confirmation Modal */}
      {deletingLoc && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f87171' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0 }}>
                Confirm Location Ping Deletion
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete GPS location ping for <strong>{deletingLoc.userName}</strong> at {deletingLoc.address}?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingLoc(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleDeleteLocation}>
                Delete Location Ping
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes ping {
          75%, 100% { transform: scale(2.5); opacity: 0; }
        }
      `}} />
    </div>
  );
};

export default LocationTracking;
