import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Plus, Edit2, Trash2, X, Loader, CheckCircle } from 'lucide-react';

export default function OfficeLocations({ currentUser, currentRole, onRefresh }) {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    radius: '100', // default radius in meters
  });

  // Smart Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [resolvedLabel, setResolvedLabel] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    fetchOffices();
    
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchOffices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hrm/offices');
      if(res.ok) {
        const json = await res.json();
        if (json.success) setOffices(json.data);
      } else {
        // Mock data for UI demonstration
        setOffices([
          { id: '1', name: 'Head Office', address: 'Tech Park, City Center', latitude: '22.5726', longitude: '88.3639', radius: 150 },
          { id: '2', name: 'Branch Office', address: 'Salt Lake Sector V', latitude: '22.5804', longitude: '88.4312', radius: 100 }
        ]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSearchChange = async (val) => {
    setSearchQuery(val);
    if (!val) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      // Using Nominatim API for address search
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}`);
      const data = await res.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (e) {
      console.error('Search failed', e);
    }
    setSearchLoading(false);
  };

  const handleSelectResult = (result) => {
    setFormData({
      ...formData,
      address: result.display_name,
      latitude: result.lat,
      longitude: result.lon
    });
    setResolvedLabel(result.display_name);
    setShowResults(false);
    setSearchQuery('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/hrm/offices/${editingId}` : '/api/hrm/offices';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if(res.ok) {
         fetchOffices();
         if(onRefresh) onRefresh();
      } else {
         // Mock update
         alert('Office saved successfully (Mocked)');
         if(editingId) {
             setOffices(offices.map(o => o.id === editingId ? { ...o, ...formData } : o));
         } else {
             setOffices([...offices, { ...formData, id: Date.now().toString() }]);
         }
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const openNew = () => {
    setFormData({ name: '', address: '', latitude: '', longitude: '', radius: '100' });
    setResolvedLabel('');
    setSearchQuery('');
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (office) => {
    setFormData(office);
    setResolvedLabel(office.address);
    setSearchQuery('');
    setEditingId(office.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete this office location?')) return;
    try {
      const res = await fetch(`/api/hrm/offices/${id}`, { method: 'DELETE' });
      if(res.ok) fetchOffices();
      else setOffices(offices.filter(o => o.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '1rem', background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Office Locations & Geofencing</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Manage office coordinates and clock-in radius.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> Add New Office
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {offices.map(office => (
          <div key={office.id} style={{ padding: '1.25rem', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <MapPin size={16} color="#3b82f6" /> {office.name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>{office.address}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => openEdit(office)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(office.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#475569' }}>
              <div style={{ background: '#e0e7ff', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
                <strong>Lat:</strong> {Number(office.latitude).toFixed(4)}
              </div>
              <div style={{ background: '#e0e7ff', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
                <strong>Lng:</strong> {Number(office.longitude).toFixed(4)}
              </div>
              <div style={{ background: '#dcfce3', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>
                <strong>Radius:</strong> {office.radius}m
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              {editingId ? 'Edit Office Location' : 'Add New Office Location'}
            </h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Office Name</label>
                <input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="e.g. Headquarters" />
              </div>

              <div ref={searchRef} style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Smart Search (Address / Plus Code)
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input type="text" className="input-field" style={{ paddingLeft: '2rem' }} placeholder="Type to search..." value={searchQuery} onChange={e => handleSearchChange(e.target.value)} onFocus={() => searchResults.length > 0 && setShowResults(true)} />
                  {searchLoading && <Loader size={16} className="animate-spin" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#3b82f6' }} />}
                  {searchQuery && !searchLoading && (
                    <X size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer' }} onClick={() => { setSearchQuery(''); setSearchResults([]); }} />
                  )}
                </div>

                {resolvedLabel && (
                  <div style={{ marginTop: '0.5rem', padding: '0.4rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', fontSize: '0.75rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={14} /> {resolvedLabel}
                  </div>
                )}

                {showResults && searchResults.length > 0 && (
                  <div style={{ position: 'absolute', zIndex: 10, width: '100%', marginTop: '0.25rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
                    {searchResults.map((res, i) => (
                      <div key={i} onClick={() => handleSelectResult(res)} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '0.8rem' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{res.name || res.display_name.split(',')[0]}</div>
                        <div style={{ color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.display_name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Latitude</label>
                  <input type="number" step="any" className="input-field" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Longitude</label>
                  <input type="number" step="any" className="input-field" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} required />
                </div>
              </div>

              {formData.latitude && formData.longitude && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Map Preview</label>
                  <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <iframe
                      title="Preview" width="100%" height="200" frameBorder="0"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(formData.longitude)-0.005},${Number(formData.latitude)-0.005},${Number(formData.longitude)+0.005},${Number(formData.latitude)+0.005}&layer=mapnik&marker=${formData.latitude},${formData.longitude}`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Clock-in Radius (meters)</label>
                <input type="number" className="input-field" value={formData.radius} onChange={e => setFormData({...formData, radius: e.target.value})} required />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Save Office</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
