import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  QrCode, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search,
  Filter,
  Layers
} from 'lucide-react';

export default function InventoryManager({ data, currentRole, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showAddProdModal, setShowAddProdModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);

  // New Product Form
  const [newProd, setNewProd] = useState({
    name: '',
    category: 'Networking Equipment',
    brand: '',
    stockQuantity: 10,
    unit: 'Pcs',
    minStockAlert: 5,
    unitPrice: 5000
  });

  // Stock Tx Form
  const [stockTx, setStockTx] = useState({
    type: 'INFLOW',
    quantity: 5,
    referenceNo: 'PO-2026-REF'
  });

  const categories = ['ALL', ...new Set(data.products.map(p => p.category))];

  const filteredProducts = data.products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProd)
      });
      const json = await res.json();
      if (json.success) {
        setShowAddProdModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStockTxSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const res = await fetch('/api/inventory/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          type: stockTx.type,
          quantity: stockTx.quantity,
          referenceNo: stockTx.referenceNo
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowTxModal(false);
        onRefresh();
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner Actions & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, maxWidth: 450 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search style={{ position: 'absolute', left: 12, top: 11, width: 16, height: 16, color: 'var(--text-muted)' }} />
            <input 
              className="input-field" 
              style={{ paddingLeft: '2.3rem' }}
              placeholder="Search 150+ products by code or name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="select-field"
            style={{ width: 180 }}
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowScanModal(true)}>
            <QrCode style={{ width: 16, height: 16, color: 'var(--brand-yellow)' }} />
            Scan Barcode / QR Code
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddProdModal(true)}>
            <Plus style={{ width: 16, height: 16 }} />
            Add New Product Item
          </button>
        </div>
      </div>

      {/* Low Stock Alert Header Banner if items depleted */}
      {data.products.some(p => p.stockQuantity <= p.minStockAlert) && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <AlertTriangle style={{ color: 'var(--brand-red)', width: 22, height: 22 }} />
          <div>
            <strong style={{ color: 'var(--brand-red)' }}>Replenishment Needed: </strong>
            <span>
              {data.products.filter(p => p.stockQuantity <= p.minStockAlert).map(p => p.name).join(', ')} are below minimum safety stock thresholds!
            </span>
          </div>
        </div>
      )}

      {/* Main Inventory Product Catalog Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
            Centralized Stock Inventory Catalog ({filteredProducts.length} Line Items)
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Real-time Inflow/Outflow Stock Ledger
          </span>
        </div>

        <table className="custom-table">
          <thead>
            <tr>
              <th>Item Code</th>
              <th>Product Line Item & Brand</th>
              <th>Category</th>
              <th>Stock On Hand</th>
              <th>Unit Price</th>
              <th>Total Stock Value</th>
              <th>Stock Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => {
              const isLow = p.stockQuantity <= p.minStockAlert;
              return (
                <tr key={p.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-yellow)' }}>
                      {p.code}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Brand: {p.brand}</div>
                  </td>
                  <td><span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{p.category}</span></td>
                  <td>
                    <strong style={{ fontSize: '1rem', color: isLow ? 'var(--brand-red)' : 'var(--text-primary)' }}>
                      {p.stockQuantity} {p.unit}
                    </strong>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Min alert: {p.minStockAlert}</div>
                  </td>
                  <td>₹{p.unitPrice.toLocaleString()}</td>
                  <td><strong>₹{(p.stockQuantity * p.unitPrice).toLocaleString()}</strong></td>
                  <td>
                    {isLow ? (
                      <span className="badge badge-rejected">⚠ LOW STOCK</span>
                    ) : (
                      <span className="badge badge-approved">In Stock</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      onClick={() => {
                        setSelectedProduct(p);
                        setShowTxModal(true);
                      }}
                    >
                      Update Stock
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal 1: Add New Product */}
      {showAddProdModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Add Product Line Item to Central Inventory
            </h3>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Product Name</label>
                <input 
                  className="input-field" 
                  required
                  value={newProd.name}
                  onChange={e => setNewProd({ ...newProd, name: e.target.value })}
                  placeholder="e.g. Cisco 48-Port Core Switch"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category</label>
                  <select 
                    className="select-field"
                    value={newProd.category}
                    onChange={e => setNewProd({ ...newProd, category: e.target.value })}
                  >
                    <option value="Networking Equipment">Networking Equipment</option>
                    <option value="Security & Surveillance">Security & Surveillance</option>
                    <option value="Cables & Wiring">Cables & Wiring</option>
                    <option value="Power Systems">Power Systems</option>
                    <option value="Access Control">Access Control</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Brand / OEM</label>
                  <input 
                    className="input-field" 
                    required
                    value={newProd.brand}
                    onChange={e => setNewProd({ ...newProd, brand: e.target.value })}
                    placeholder="e.g. Hikvision / D-Link"
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Initial Qty</label>
                  <input 
                    type="number"
                    className="input-field" 
                    required
                    value={newProd.stockQuantity}
                    onChange={e => setNewProd({ ...newProd, stockQuantity: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Unit Price (₹)</label>
                  <input 
                    type="number"
                    className="input-field" 
                    required
                    value={newProd.unitPrice}
                    onChange={e => setNewProd({ ...newProd, unitPrice: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Min Alert Level</label>
                  <input 
                    type="number"
                    className="input-field" 
                    value={newProd.minStockAlert}
                    onChange={e => setNewProd({ ...newProd, minStockAlert: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddProdModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save to Inventory</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Inflow / Outflow Stock Transaction */}
      {showTxModal && selectedProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '0.35rem' }}>
              Stock Movement: {selectedProduct.name}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Current Quantity On Hand: <strong>{selectedProduct.stockQuantity} {selectedProduct.unit}</strong>
            </p>

            <form onSubmit={handleStockTxSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Transaction Type</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="txtype"
                      value="INFLOW"
                      checked={stockTx.type === 'INFLOW'}
                      onChange={e => setStockTx({ ...stockTx, type: e.target.value })}
                    />
                    <span style={{ color: 'var(--brand-green)', fontWeight: 700 }}>Inflow (+) Received</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="txtype"
                      value="OUTFLOW"
                      checked={stockTx.type === 'OUTFLOW'}
                      onChange={e => setStockTx({ ...stockTx, type: e.target.value })}
                    />
                    <span style={{ color: 'var(--brand-red)', fontWeight: 700 }}>Outflow (-) Dispatched</span>
                  </label>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quantity</label>
                <input 
                  type="number"
                  className="input-field"
                  required
                  min="1"
                  value={stockTx.quantity}
                  onChange={e => setStockTx({ ...stockTx, quantity: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reference PO / Invoice No</label>
                <input 
                  className="input-field"
                  required
                  value={stockTx.referenceNo}
                  onChange={e => setStockTx({ ...stockTx, referenceNo: e.target.value })}
                  placeholder="e.g. PO/2026/551 or Field Job Ref"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTxModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Process Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: QR / Barcode Scanner Simulator */}
      {showScanModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              Real-time Barcode & QR Code Scanner
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Simulates camera scanning of inventory tags for instant stock lookup and update.
            </p>

            <div style={{
              width: '100%',
              height: 220,
              background: '#000',
              borderRadius: 'var(--radius-md)',
              border: '2px dashed var(--brand-gold)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              marginBottom: '1.5rem'
            }}>
              <QrCode style={{ width: 64, height: 64, color: 'var(--brand-yellow)' }} className="animate-pulse" />
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Align barcode within scanner frame...
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowScanModal(false)}>Close Camera</button>
              <button className="btn btn-primary" onClick={() => {
                alert('Scanned QR-VS-NET-001: Hikvision 4MP IP Dome Camera identified!');
                setShowScanModal(false);
              }}>
                Simulate Scan Tag
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
