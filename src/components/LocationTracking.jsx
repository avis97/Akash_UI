import React, { useState, useEffect, useCallback } from 'react';
import PageHeader from './common/PageHeader';
import { MapPin, Navigation, History, Bell, Plus, Phone, Search, CheckCircle, Trash2, AlertTriangle, Clock, Battery, UserCheck, Shield } from 'lucide-react';
import { parseCoordinates, reverseGeocode } from '../utils/locationUtils';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const formatTimestamp = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const LocationText = ({ location, batteryLevel, updatedAt }) => {
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
      📍 {addr} {batteryLevel !== undefined ? `(🔋 ${batteryLevel}%)` : ''} {updatedAt ? `• 🕒 ${formatTimeAgo(updatedAt)}` : ''}
    </div>
  );
};

const LocationTracking = ({ data = {}, currentRole = 'SUPERADMIN', onRefresh = () => { } }) => {
  const [locations, setLocations] = useState(data.locations || []);
  const [lastPositions, setLastPositions] = useState([]);
  const [alerts, setAlerts] = useState(data.geofenceAlerts || []);
  const [users, setUsers] = useState(data.users || []);

  const [selectedPhone, setSelectedPhone] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [phoneSearchResult, setPhoneSearchResult] = useState(null);
  const [phoneSearchError, setPhoneSearchError] = useState('');
  const [highlightedLocationId, setHighlightedLocationId] = useState(null);

  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'last_positions_list'

  // Deletion modal state
  const [deletingLoc, setDeletingLoc] = useState(null);

  const fetchTrackingData = useCallback(async () => {
    try {
      const [locRes, lastPosRes, alertRes, usrRes] = await Promise.allSettled([
        fetch('/api/tracking/locations').then(r => r.json()),
        fetch('/api/tracking/last-positions').then(r => r.json()),
        fetch('/api/tracking/geofence-alerts').then(r => r.json()),
        fetch('/api/users').then(r => r.json())
      ]);

      if (locRes.status === 'fulfilled' && locRes.value?.success) setLocations(locRes.value.data);
      if (lastPosRes.status === 'fulfilled' && lastPosRes.value?.success) setLastPositions(lastPosRes.value.data);
      if (alertRes.status === 'fulfilled' && alertRes.value?.success) setAlerts(alertRes.value.data);
      if (usrRes.status === 'fulfilled' && usrRes.value?.success) setUsers(usrRes.value.data);
    } catch (err) {
      console.error('Error fetching tracking data:', err);
    }
  }, []);

  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  // Auto fetch last location by phone number
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

        // Update list & last positions
        setLocations(prev => {
          const exists = prev.some(l => l.id === json.data.id);
          if (exists) {
            return prev.map(l => l.id === json.data.id ? json.data : l);
          }
          return [json.data, ...prev];
        });

        fetchTrackingData();
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

  // Extract users with phone numbers
  const userPhoneList = (users || []).filter(u => u.phone);

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <PageHeader
          title="Location Tracking & Personnel Last Position"
          breadcrumbs={['Dashboard', 'Location Tracking', 'Last Known Position']}
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${activeTab === 'map' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('map')}
          >
            <MapPin size={16} /> Live Map View
          </button>
          <button
            className={`btn ${activeTab === 'last_positions_list' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('last_positions_list')}
          >
            <UserCheck size={16} /> Last Positions Table ({lastPositions.length})
          </button>
          <button className="btn btn-primary" onClick={() => setShowPingModal(true)}>
            <Plus size={16} /> Log GPS Location Ping
          </button>
        </div>
      </div>

      {/* Auto Location Fetch & Last Position Lookup Box */}
      <div className="glass-card" style={{ padding: '1.25rem', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b' }}>
          <Phone size={18} color="var(--brand-primary)" /> Query Personnel Last Known Position by Phone / Employee
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: '1 1 280px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Select Active Personnel (Name & Phone)
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
              <option value="">-- Select Personnel ({userPhoneList.length} Phone Numbers Available) --</option>
              {userPhoneList.map(u => (
                <option key={u.id} value={u.phone}>
                  📱 {u.phone} — {u.name} ({u.role || u.designation})
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
              Or Enter Custom Mobile Number
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
              <Search size={16} /> {loadingPhone ? 'Locating...' : 'Get Last Position'}
            </button>
          </div>
        </div>

        {/* Search status / feedback banner */}
        {phoneSearchError && (
          <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '6px', fontSize: '0.85rem' }}>
            ⚠️ {phoneSearchError}
          </div>
        )}

        {/* Detailed Last Position Banner */}
        {phoneSearchResult && (
          <div style={{ marginTop: '0.85rem', padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                  <CheckCircle size={18} color="#16a34a" />
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#14532d' }}>
                    Last Known Position: {phoneSearchResult.user?.name || phoneSearchResult.data?.userName}
                  </span>
                  <span style={{ fontSize: '0.75rem', backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                    📱 {phoneSearchResult.user?.phone}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#166534', display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '6px' }}>
                  <span>📍 <strong>Address:</strong> {phoneSearchResult.data?.address}</span>
                  <span>🌐 <strong>Coords:</strong> {phoneSearchResult.data?.latitude?.toFixed(4)}, {phoneSearchResult.data?.longitude?.toFixed(4)}</span>
                  <span>🕒 <strong>Last Updated:</strong> {formatTimestamp(phoneSearchResult.data?.updatedAt)} ({formatTimeAgo(phoneSearchResult.data?.updatedAt)})</span>
                  <span>🔋 <strong>Battery:</strong> {phoneSearchResult.data?.batteryLevel}%</span>
                  {phoneSearchResult.data?.speed !== undefined && <span>🚗 <strong>Speed:</strong> {phoneSearchResult.data?.speed} km/h</span>}
                </div>
              </div>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => {
                  setActiveTab('map');
                  setHighlightedLocationId(phoneSearchResult.data?.id);
                }}
                style={{ backgroundColor: 'white', border: '1px solid #16a34a', color: '#15803d', fontWeight: 600 }}
              >
                Center Pin on Map
              </button>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'last_positions_list' ? (
        /* Detailed Table View of Last Positions */
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={20} color="var(--brand-primary)" /> Personnel Last Recorded Position Summary ({lastPositions.length})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '10px 12px' }}>Personnel Name & Role</th>
                  <th style={{ padding: '10px 12px' }}>Phone Number</th>
                  <th style={{ padding: '10px 12px' }}>Last Position Address</th>
                  <th style={{ padding: '10px 12px' }}>Coordinates</th>
                  <th style={{ padding: '10px 12px' }}>Last Updated Time</th>
                  <th style={{ padding: '10px 12px' }}>Battery & Speed</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lastPositions.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No location records stored yet. Use "Log GPS Location Ping" or search by phone to fetch live position.
                    </td>
                  </tr>
                ) : (
                  lastPositions.map(loc => {
                    const phone = loc.user?.phone || users.find(u => u.id === loc.userId || u.name === loc.userName)?.phone || 'N/A';
                    const role = loc.user?.role || loc.user?.designation || 'Service Personnel';
                    return (
                      <tr key={loc.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                          <div>{loc.userName || loc.user?.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{role}</div>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#0284c7', fontWeight: 500 }}>
                          📱 {phone}
                        </td>
                        <td style={{ padding: '10px 12px', maxWidth: '260px' }}>
                          📍 {loc.address}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                          {loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 500 }}>{formatTimeAgo(loc.updatedAt)}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatTimestamp(loc.updatedAt)}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div>🔋 {loc.batteryLevel}%</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>🚗 {loc.speed || 0} km/h</div>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <button
                            className="btn btn-sm btn-outline"
                            onClick={() => {
                              setActiveTab('map');
                              setHighlightedLocationId(loc.id);
                            }}
                            style={{ marginRight: '6px' }}
                          >
                            Locate
                          </button>
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                            onClick={() => setDeletingLoc(loc)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Map and Sidebar View */
        <div className="row" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>

          {/* Map Area */}
          <div style={{ flex: '1 1 60%', minWidth: '300px' }}>
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', height: '580px', position: 'relative', backgroundColor: '#e2e8f0', backgroundImage: 'url("https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&q=80")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              {/* Map Overlay */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.35)', backdropFilter: 'blur(2px)' }}></div>

              {/* Map Header Badge */}
              <div style={{ position: 'absolute', top: '15px', left: '15px', backgroundColor: 'rgba(15, 23, 42, 0.85)', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', zIndex: 5 }}>
                <MapPin size={14} color="#38bdf8" /> Interactive GPS Pins & Personnel Last Positions
              </div>

              {/* Dynamic Map Pins */}
              {locations.length === 0 ? (
                <div style={{ position: 'absolute', top: '45%', left: '35%', backgroundColor: 'rgba(15, 23, 42, 0.8)', color: 'white', padding: '1rem 1.5rem', borderRadius: '8px', fontWeight: 600 }}>
                  📍 Fetching Live GPS Pins & Last Positions...
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
                        padding: '6px 10px',
                        backgroundColor: isHighlighted ? '#ea580c' : (idx % 2 === 0 ? 'var(--brand-primary)' : '#10b981'),
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        marginBottom: '4px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                        textAlign: 'center',
                        maxWidth: '200px'
                      }}>
                        <div>{loc.userName || 'Service Tech'}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.9 }}>📱 {userPhone}</div>
                        <div style={{ fontSize: '0.62rem', backgroundColor: 'rgba(0,0,0,0.25)', padding: '1px 4px', borderRadius: '3px', marginTop: '2px' }}>
                          Last Pos: {formatTimeAgo(loc.updatedAt)}
                        </div>
                      </div>
                      <MapPin
                        size={isHighlighted ? 44 : 34}
                        color={isHighlighted ? '#ea580c' : (idx % 2 === 0 ? 'var(--brand-primary)' : '#10b981')}
                        fill="white"
                        style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))', transition: 'all 0.3s ease' }}
                      />
                      <div style={{
                        width: isHighlighted ? '20px' : '14px',
                        height: isHighlighted ? '20px' : '14px',
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

              {/* Map Action Controls */}
              <div style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  className="btn btn-outline"
                  onClick={fetchTrackingData}
                  title="Refresh GPS Data"
                  style={{ backgroundColor: 'white', width: '40px', height: '40px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
                >
                  <Navigation size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Data: Geofence & Tracked List */}
          <div style={{ flex: '1 1 35%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bell size={18} color="#ef4444" /> Geofencing Alerts ({alerts.length})
              </h3>
              {alerts.length === 0 ? (
                <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534', fontSize: '0.85rem' }}>
                  ✓ No active geofence violations detected.
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

            <div className="glass-card" style={{ padding: '1.25rem', flex: 1 }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={18} /> Tracked Personnel & Last Positions ({locations.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '320px', overflowY: 'auto' }}>
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
                          gap: '0.75rem',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                          border: isSelected ? '1.5px solid #3b82f6' : '1px solid var(--border-color)',
                          boxShadow: isSelected ? '0 2px 8px rgba(59,130,246,0.15)' : 'none',
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
                          <LocationText location={loc.address} batteryLevel={loc.batteryLevel} updatedAt={loc.updatedAt} />
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
      )}

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
