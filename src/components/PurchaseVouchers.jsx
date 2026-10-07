import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  CreditCard,
  Plus,
  CheckCircle,
  FileCheck,
  DollarSign,
  Tag,
  Edit2,
  Trash2,
  AlertTriangle,
  Users,
  FileText,
  Eye,
  X,
  Search,
  Building,
  Phone,
  Hash,
  MapPin,
  Calendar,
  Clock,
  Printer
} from 'lucide-react';

export default function PurchaseVouchers({ data = {}, currentRole, onRefresh, defaultTab }) {
  // Tabs: 'vendors' | 'bills' | 'purchases' | 'vouchers'
  const [activeTab, setActiveTab] = useState(defaultTab || 'vendors');
  const [searchTerm, setSearchTerm] = useState('');

  // Local state for live synced data
  const [vendors, setVendors] = useState(data.vendors || []);
  const [bills, setBills] = useState(data.bills || []);
  const [purchases, setPurchases] = useState(data.purchases || []);
  const [vouchers, setVouchers] = useState(data.vouchers || []);

  // Modal States - Vendors
  const [showCreateVendorModal, setShowCreateVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [viewingVendor, setViewingVendor] = useState(null);
  const [deletingVendor, setDeletingVendor] = useState(null);

  // Modal States - Bills
  const [showCreateBillModal, setShowCreateBillModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [viewingBill, setViewingBill] = useState(null);
  const [deletingBill, setDeletingBill] = useState(null);

  // Modal State - Create Product on-the-fly
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [productFormData, setProductFormData] = useState({
    name: '',
    code: '',
    category: 'Networking Equipment',
    brand: 'General',
    stockQuantity: 1,
    unit: 'Pcs',
    purchasePrice: 0,
    salePrice: 0
  });

  // Modal States - Purchases & Vouchers
  const [showPurModal, setShowPurModal] = useState(false);
  const [showVchModal, setShowVchModal] = useState(false);
  const [editingPur, setEditingPur] = useState(null);
  const [deletingPur, setDeletingPur] = useState(null);
  const [editingVch, setEditingVch] = useState(null);
  const [deletingVch, setDeletingVch] = useState(null);

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  // Sync props to state if props update
  useEffect(() => {
    if (data.vendors) setVendors(data.vendors);
    if (data.bills) setBills(data.bills);
    if (data.purchases) setPurchases(data.purchases);
    if (data.vouchers) setVouchers(data.vouchers);
  }, [data]);

  // Fetch all module data from API
  const fetchAllData = useCallback(async () => {
    try {
      const [venRes, billRes, purRes, vchRes] = await Promise.allSettled([
        fetch('/api/vendors').then(r => r.json()),
        fetch('/api/bills').then(r => r.json()),
        fetch('/api/purchases').then(r => r.json()),
        fetch('/api/vouchers').then(r => r.json())
      ]);

      if (venRes.status === 'fulfilled' && venRes.value?.success) setVendors(venRes.value.data);
      if (billRes.status === 'fulfilled' && billRes.value?.success) setBills(billRes.value.data);
      if (purRes.status === 'fulfilled' && purRes.value?.success) setPurchases(purRes.value.data);
      if (vchRes.status === 'fulfilled' && vchRes.value?.success) setVouchers(vchRes.value.data);
    } catch (err) {
      console.error('Error fetching purchase & vendor data:', err);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ---------------------------------------------------------------------------
  // VENDOR FORM STATES
  // ---------------------------------------------------------------------------
  const initialVendorState = {
    name: '',
    contact: '',
    email: '',
    taxNumber: '',
    balance: '',
    billingName: '',
    billingPhone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    shippingName: '',
    shippingPhone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingCountry: '',
    shippingZipCode: ''
  };

  const [vendorFormData, setVendorFormData] = useState(initialVendorState);

  const handleOpenCreateVendor = () => {
    setVendorFormData(initialVendorState);
    setShowCreateVendorModal(true);
  };

  const handleOpenEditVendor = (vendor) => {
    setEditingVendor(vendor);
    setVendorFormData({
      name: vendor.name || '',
      contact: vendor.contact || '',
      email: vendor.email || '',
      taxNumber: vendor.taxNumber || '',
      balance: vendor.balance !== undefined && vendor.balance !== null ? vendor.balance : '',
      billingName: vendor.billingName || vendor.name || '',
      billingPhone: vendor.billingPhone || vendor.contact || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      country: vendor.country || '',
      zipCode: vendor.zipCode || '',
      shippingName: vendor.shippingName || '',
      shippingPhone: vendor.shippingPhone || '',
      shippingAddress: vendor.shippingAddress || '',
      shippingCity: vendor.shippingCity || '',
      shippingState: vendor.shippingState || '',
      shippingCountry: vendor.shippingCountry || '',
      shippingZipCode: vendor.shippingZipCode || ''
    });
  };

  const handleSaveVendor = async (e) => {
    e.preventDefault();
    try {
      const url = editingVendor ? `/api/vendors/${editingVendor.id}` : '/api/vendors';
      const method = editingVendor ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorFormData)
      });
      const json = await res.json();
      if (json.success) {
        setShowCreateVendorModal(false);
        setEditingVendor(null);
        setVendorFormData(initialVendorState);
        fetchAllData();
        if (onRefresh) onRefresh();
      } else {
        alert(json.message || 'Error saving vendor');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save vendor');
    }
  };

  const handleDeleteVendor = async () => {
    if (!deletingVendor) return;
    try {
      const res = await fetch(`/api/vendors/${deletingVendor.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDeletingVendor(null);
        fetchAllData();
        if (onRefresh) onRefresh();
      } else {
        alert(json.message || 'Error deleting vendor');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete vendor');
    }
  };

  // ---------------------------------------------------------------------------
  // BILL FORM STATES
  // ---------------------------------------------------------------------------
  const initialBillState = {
    vendorId: '',
    vendorName: '',
    vendorGst: '',
    invoiceNo: '',
    category: 'Networking Equipment',
    totalAmount: 0,
    gstAmount: 0,
    paidAmount: 0,
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    status: 'UNPAID',
    items: [{ item: 'Item 1', qty: 1, rate: 0, amount: 0 }],
    notes: ''
  };

  const [billFormData, setBillFormData] = useState(initialBillState);

  const handleOpenCreateBill = (preselectVendor = null) => {
    if (preselectVendor) {
      setBillFormData({
        ...initialBillState,
        vendorId: preselectVendor.id,
        vendorName: preselectVendor.name,
        vendorGst: preselectVendor.taxNumber || ''
      });
    } else if (vendors.length > 0) {
      const firstV = vendors[0];
      setBillFormData({
        ...initialBillState,
        vendorId: firstV.id,
        vendorName: firstV.name,
        vendorGst: firstV.taxNumber || ''
      });
    } else {
      setBillFormData(initialBillState);
    }
    setShowCreateBillModal(true);
  };

  const handleVendorSelectInBill = (vendorId) => {
    const selected = vendors.find(v => v.id === vendorId);
    if (selected) {
      setBillFormData(prev => ({
        ...prev,
        vendorId: selected.id,
        vendorName: selected.name,
        vendorGst: selected.taxNumber || ''
      }));
    } else {
      setBillFormData(prev => ({ ...prev, vendorId: '', vendorName: '' }));
    }
  };

  const handleBillItemChange = (index, field, value) => {
    const updatedItems = [...billFormData.items];
    updatedItems[index][field] = value;

    if (field === 'qty' || field === 'rate') {
      const q = Number(updatedItems[index].qty) || 0;
      const r = Number(updatedItems[index].rate) || 0;
      updatedItems[index].amount = q * r;
    }

    const newSubtotal = updatedItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const newGst = Math.round(newSubtotal * 0.18);
    const newTotal = newSubtotal + newGst;

    setBillFormData(prev => ({
      ...prev,
      items: updatedItems,
      totalAmount: newTotal,
      gstAmount: newGst
    }));
  };

  const handleAddBillItem = () => {
    setBillFormData(prev => ({
      ...prev,
      items: [...prev.items, { item: `Item ${prev.items.length + 1}`, qty: 1, rate: 0, amount: 0 }]
    }));
  };

  const handleRemoveBillItem = (index) => {
    if (billFormData.items.length === 1) return;
    const updatedItems = billFormData.items.filter((_, i) => i !== index);
    const newSubtotal = updatedItems.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const newGst = Math.round(newSubtotal * 0.18);
    const newTotal = newSubtotal + newGst;

    setBillFormData(prev => ({
      ...prev,
      items: updatedItems,
      totalAmount: newTotal,
      gstAmount: newGst
    }));
  };

  const handleOpenCreateProduct = () => {
    const autoCode = `PRD-${Math.floor(1000 + Math.random() * 9000)}`;
    setProductFormData({
      name: '',
      code: autoCode,
      category: billFormData.category || 'Networking Equipment',
      brand: billFormData.vendorName || 'General',
      stockQuantity: 1,
      unit: 'Pcs',
      purchasePrice: 0,
      salePrice: 0
    });
    setShowCreateProductModal(true);
  };

  const handleSaveNewProduct = async (e) => {
    e.preventDefault();
    if (!productFormData.name) {
      alert('Product Name is required');
      return;
    }
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productFormData.name,
          code: productFormData.code || `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
          category: productFormData.category || 'Networking Equipment',
          brand: productFormData.brand || 'General',
          stockQuantity: Number(productFormData.stockQuantity) || 1,
          unit: productFormData.unit || 'Pcs',
          purchasePrice: Number(productFormData.purchasePrice) || 0,
          salePrice: Number(productFormData.salePrice) || 0,
          unitPrice: Number(productFormData.salePrice) || Number(productFormData.purchasePrice) || 0
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        const newProd = json.data;
        setShowCreateProductModal(false);
        fetchAllData();

        // Automatically select/add this new product to current Bill line items!
        const qty = Number(newProd.stockQuantity) || 1;
        const rate = Number(newProd.purchasePrice) || Number(newProd.unitPrice) || 0;
        const newItem = {
          productId: newProd.id,
          code: newProd.code,
          item: newProd.name,
          qty,
          rate,
          amount: qty * rate
        };

        setBillFormData(prev => {
          const updated = [...prev.items];
          // If first row is empty, replace it; otherwise push new row
          if (updated.length === 1 && !updated[0].item && !updated[0].productId) {
            updated[0] = newItem;
          } else {
            updated.push(newItem);
          }
          const sub = updated.reduce((a, c) => a + (Number(c.amount) || 0), 0);
          const gst = Math.round(sub * 0.18);
          return { ...prev, items: updated, totalAmount: sub + gst, gstAmount: gst };
        });

        if (onRefresh) onRefresh();
      } else {
        alert(json.message || 'Error creating new product');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save new product to inventory');
    }
  };

  const handleOpenEditBill = (bill) => {
    setEditingBill(bill);
    let parsedItems = [];
    try {
      parsedItems = bill.itemsJson ? JSON.parse(bill.itemsJson) : [];
    } catch (e) {
      parsedItems = [];
    }
    if (parsedItems.length === 0) {
      parsedItems = [{ item: 'General Equipment Purchase', qty: 1, rate: bill.totalAmount, amount: bill.totalAmount }];
    }

    setBillFormData({
      vendorId: bill.vendorId || '',
      vendorName: bill.vendorName || '',
      vendorGst: bill.vendorGst || '',
      invoiceNo: bill.invoiceNo || '',
      category: bill.category || 'Networking Equipment',
      totalAmount: bill.totalAmount || 0,
      gstAmount: bill.gstAmount || 0,
      paidAmount: bill.paidAmount || 0,
      dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : '',
      status: bill.status || 'UNPAID',
      items: parsedItems,
      notes: bill.notes || ''
    });
  };

  const handleSaveBill = async (e) => {
    e.preventDefault();
    try {
      const url = editingBill ? `/api/bills/${editingBill.id}` : '/api/bills';
      const method = editingBill ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billFormData)
      });
      const json = await res.json();
      if (json.success) {
        setShowCreateBillModal(false);
        setEditingBill(null);
        setBillFormData(initialBillState);
        fetchAllData();
        if (onRefresh) onRefresh();
      } else {
        alert(json.message || 'Error saving bill');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save purchase bill');
    }
  };

  const handleDeleteBill = async () => {
    if (!deletingBill) return;
    try {
      const res = await fetch(`/api/bills/${deletingBill.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDeletingBill(null);
        fetchAllData();
        if (onRefresh) onRefresh();
      } else {
        alert(json.message || 'Error deleting bill');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete bill');
    }
  };

  // ---------------------------------------------------------------------------
  // EXISTING PURCHASE ENTRY & VOUCHER HANDLERS
  // ---------------------------------------------------------------------------
  const [newPur, setNewPur] = useState({
    vendorName: '',
    vendorGst: '19AABCC1234F1ZB',
    invoiceNo: '',
    category: 'Networking Equipment',
    totalAmount: 85000
  });

  const [editPurData, setEditPurData] = useState({
    vendorName: '',
    vendorGst: '',
    invoiceNo: '',
    category: 'Networking Equipment',
    totalAmount: 85000,
    status: 'APPROVED'
  });

  const [newVch, setNewVch] = useState({
    type: 'PAYMENT',
    amount: 25000,
    accountHead: 'Vendor Settlement',
    narration: 'Payment voucher for incoming stock'
  });

  const [editVchData, setEditVchData] = useState({
    type: 'PAYMENT',
    amount: 25000,
    accountHead: '',
    narration: '',
    status: 'APPROVED'
  });

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPur)
      });
      const json = await res.json();
      if (json.success) {
        setShowPurModal(false);
        setNewPur({ vendorName: '', vendorGst: '19AABCC1234F1ZB', invoiceNo: '', category: 'Networking Equipment', totalAmount: 85000 });
        fetchAllData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditPurchase = async (e) => {
    e.preventDefault();
    if (!editingPur) return;
    try {
      const res = await fetch(`/api/purchases/${editingPur.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editPurData)
      });
      const json = await res.json();
      if (json.success) {
        setEditingPur(null);
        fetchAllData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePurchase = async () => {
    if (!deletingPur) return;
    try {
      const res = await fetch(`/api/purchases/${deletingPur.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDeletingPur(null);
        fetchAllData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVch)
      });
      const json = await res.json();
      if (json.success) {
        setShowVchModal(false);
        setNewVch({ type: 'PAYMENT', amount: 25000, accountHead: 'Vendor Settlement', narration: 'Payment voucher for incoming stock' });
        fetchAllData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditVoucher = async (e) => {
    e.preventDefault();
    if (!editingVch) return;
    try {
      const res = await fetch(`/api/vouchers/${editingVch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editVchData)
      });
      const json = await res.json();
      if (json.success) {
        setEditingVch(null);
        fetchAllData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVoucher = async () => {
    if (!deletingVch) return;
    try {
      const res = await fetch(`/api/vouchers/${deletingVch.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDeletingVch(null);
        fetchAllData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered lists by search term
  const filteredVendors = vendors.filter(v => 
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.contact?.includes(searchTerm) ||
    v.taxNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBills = bills.filter(b =>
    b.billNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Quick summary calculations
  const totalVendorBalance = vendors.reduce((acc, v) => acc + (Number(v.balance) || 0), 0);
  const totalBilledAmount = bills.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0);
  const totalUnpaidBills = bills.filter(b => b.status === 'UNPAID' || b.status === 'PARTIAL')
    .reduce((acc, b) => acc + (Number(b.balanceAmount) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Metric Cards Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Vendors</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>{vendors.length}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vendor Balances</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f59e0b' }}>₹{totalVendorBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Purchase Bills</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>{bills.length}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pending Due</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ef4444' }}>₹{totalUnpaidBills.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>

      {/* Sub-nav & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', background: '#f1f5f9', padding: '0.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            className={`btn ${activeTab === 'vendors' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('vendors')}
          >
            <Users style={{ width: 16, height: 16 }} />
            Vendors ({vendors.length})
          </button>
          <button
            className={`btn ${activeTab === 'bills' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('bills')}
          >
            <FileText style={{ width: 16, height: 16 }} />
            Bills ({bills.length})
          </button>
          <button
            className={`btn ${activeTab === 'purchases' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('purchases')}
          >
            <ShoppingBag style={{ width: 16, height: 16 }} />
            Purchase Orders ({purchases.length})
          </button>
          <button
            className={`btn ${activeTab === 'vouchers' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('vouchers')}
          >
            <CreditCard style={{ width: 16, height: 16 }} />
            Vouchers ({vouchers.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.2rem', width: '220px', height: '38px', fontSize: '0.85rem' }}
            />
          </div>

          {activeTab === 'vendors' && (
            <button className="btn btn-primary" onClick={handleOpenCreateVendor}>
              <Plus style={{ width: 16, height: 16 }} />
              Create Vendor
            </button>
          )}

          {activeTab === 'bills' && (
            <button className="btn btn-primary" onClick={() => handleOpenCreateBill()}>
              <Plus style={{ width: 16, height: 16 }} />
              Generate Purchase Bill
            </button>
          )}

          {activeTab === 'purchases' && (
            <button className="btn btn-primary" onClick={() => setShowPurModal(true)}>
              <Plus style={{ width: 16, height: 16 }} />
              Log Purchase Order
            </button>
          )}

          {activeTab === 'vouchers' && (
            <button className="btn btn-primary" onClick={() => setShowVchModal(true)}>
              <Plus style={{ width: 16, height: 16 }} />
              Create New Voucher
            </button>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1: VENDORS MANAGEMENT LIST & ACTIONS */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'vendors' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} style={{ color: 'var(--brand-primary)' }} />
              Vendor Directory & Financial Ledger
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Showing {filteredVendors.length} of {vendors.length} vendors
            </span>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Contact</th>
                <th>Tax Number</th>
                <th>Balance (₹)</th>
                <th>Billing Location</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No vendors found. Click <strong>"Create Vendor"</strong> to add a new supplier.
                  </td>
                </tr>
              ) : (
                filteredVendors.map(vendor => (
                  <tr key={vendor.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                          {vendor.name ? vendor.name.charAt(0).toUpperCase() : 'V'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{vendor.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {vendor.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{vendor.contact}</div>
                      {vendor.billingPhone && vendor.billingPhone !== vendor.contact && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Alt: {vendor.billingPhone}</div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-approved" style={{ fontSize: '0.75rem' }}>
                        {vendor.taxNumber || 'No GSTIN'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: (Number(vendor.balance) || 0) > 0 ? '#ef4444' : '#22c55e', fontSize: '0.95rem' }}>
                        ₹{(Number(vendor.balance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {vendor.city ? `${vendor.city}, ${vendor.state || ''}` : vendor.address || 'Kolkata, WB'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="View Vendor Profile & Bills"
                          onClick={() => setViewingVendor(vendor)}
                          style={{ padding: '0.4rem', background: '#e0f2fe', color: '#0284c7', border: 'none' }}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Edit Vendor"
                          onClick={() => handleOpenEditVendor(vendor)}
                          style={{ padding: '0.4rem', background: '#fef3c7', color: '#d97706', border: 'none' }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Delete Vendor"
                          onClick={() => setDeletingVendor(vendor)}
                          style={{ padding: '0.4rem', background: '#fee2e2', color: '#ef4444', border: 'none' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2: PURCHASE BILLS LIST & ACTIONS */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'bills' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} style={{ color: '#06b6d4' }} />
              Vendor Purchase Bills & GST Tax Invoices
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Showing {filteredBills.length} of {bills.length} bills
            </span>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Bill No & Date</th>
                <th>Vendor Name</th>
                <th>Invoice No</th>
                <th>Category</th>
                <th>Total Amount</th>
                <th>Paid / Balance</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No purchase bills found. Click <strong>"Generate Purchase Bill"</strong> to issue a new bill.
                  </td>
                </tr>
              ) : (
                filteredBills.map(bill => (
                  <tr key={bill.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{bill.billNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{bill.vendorName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GSTIN: {bill.vendorGst || 'N/A'}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600 }}>
                        {bill.invoiceNo || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-approved" style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#475569' }}>
                        {bill.category || 'General'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{(Number(bill.totalAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        (Incl. GST ₹{(Number(bill.gstAmount) || 0).toLocaleString('en-IN')})
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        <span style={{ color: '#22c55e', fontWeight: 600 }}>₹{(Number(bill.paidAmount) || 0).toLocaleString('en-IN')}</span> paid
                      </div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: (Number(bill.balanceAmount) || 0) > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                        ₹{(Number(bill.balanceAmount) || 0).toLocaleString('en-IN')} due
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.75rem',
                          background: bill.status === 'PAID' ? '#dcfce7' : bill.status === 'PARTIAL' ? '#fef3c7' : '#fee2e2',
                          color: bill.status === 'PAID' ? '#15803d' : bill.status === 'PARTIAL' ? '#b45309' : '#b91c1c',
                          border: `1px solid ${bill.status === 'PAID' ? '#86efac' : bill.status === 'PARTIAL' ? '#fde047' : '#fca5a5'}`
                        }}
                      >
                        {bill.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="View Bill Details & Invoice"
                          onClick={() => setViewingBill(bill)}
                          style={{ padding: '0.4rem', background: '#e0f2fe', color: '#0284c7', border: 'none' }}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Edit Bill"
                          onClick={() => handleOpenEditBill(bill)}
                          style={{ padding: '0.4rem', background: '#fef3c7', color: '#d97706', border: 'none' }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Delete Bill"
                          onClick={() => setDeletingBill(bill)}
                          style={{ padding: '0.4rem', background: '#fee2e2', color: '#ef4444', border: 'none' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 3: PURCHASE ORDERS / ENTRIES */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'purchases' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
              Vendor Purchase Records & Auto Stock Increment
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              GST Input Credit & Inventory Category Mapping
            </span>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Vendor & GSTIN</th>
                <th>Vendor Invoice</th>
                <th>Category</th>
                <th>Total Purchase Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No purchase orders recorded yet.
                  </td>
                </tr>
              ) : (
                purchases.map(pur => (
                  <tr key={pur.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{pur.purchaseOrderNo}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(pur.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{pur.vendorName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GSTIN: {pur.vendorGst}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{pur.invoiceNo}</div>
                    </td>
                    <td>
                      <span className="badge badge-approved" style={{ fontSize: '0.75rem' }}>{pur.category}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{(pur.totalAmount || 0).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        (Includes GST ₹{(pur.gstAmount || 0).toLocaleString()})
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-approved">
                        <CheckCircle style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />
                        {pur.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Edit Purchase Record"
                          onClick={() => {
                            setEditingPur(pur);
                            setEditPurData({
                              vendorName: pur.vendorName || '',
                              vendorGst: pur.vendorGst || '',
                              invoiceNo: pur.invoiceNo || '',
                              category: pur.category || 'Networking Equipment',
                              totalAmount: pur.totalAmount || 0,
                              status: pur.status || 'APPROVED'
                            });
                          }}
                          style={{ padding: '0.4rem', background: '#fef3c7', color: '#d97706', border: 'none' }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Delete Purchase Record"
                          onClick={() => setDeletingPur(pur)}
                          style={{ padding: '0.4rem', background: '#fee2e2', color: '#ef4444', border: 'none' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 4: VOUCHERS LEDGER */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'vouchers' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
              Accounts Voucher Ledger & Cashflow Statements
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Double-Entry General Ledger Postings
            </span>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Voucher No</th>
                <th>Type</th>
                <th>Account Head</th>
                <th>Amount (₹)</th>
                <th>Narration</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No voucher entries recorded yet.
                  </td>
                </tr>
              ) : (
                vouchers.map(vch => (
                  <tr key={vch.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{vch.voucherNo}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(vch.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${vch.type === 'PAYMENT' ? 'badge-pending' : 'badge-approved'}`}>
                        {vch.type}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{vch.accountHead}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>
                        ₹{(vch.amount || 0).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {vch.narration}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-approved">
                        <FileCheck style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />
                        {vch.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Edit Voucher"
                          onClick={() => {
                            setEditingVch(vch);
                            setEditVchData({
                              type: vch.type || 'PAYMENT',
                              amount: vch.amount || 0,
                              accountHead: vch.accountHead || '',
                              narration: vch.narration || '',
                              status: vch.status || 'APPROVED'
                            });
                          }}
                          style={{ padding: '0.4rem', background: '#fef3c7', color: '#d97706', border: 'none' }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Delete Voucher"
                          onClick={() => setDeletingVch(vch)}
                          style={{ padding: '0.4rem', background: '#fee2e2', color: '#ef4444', border: 'none' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CREATE / EDIT VENDOR (Matching exact user screenshot design!)  */}
      {/* ===================================================================== */}
      {(showCreateVendorModal || editingVendor) && (
        <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: 0 }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                {editingVendor ? 'Edit Vendor' : 'Create New Vendor'}
              </h3>
              <button
                type="button"
                onClick={() => { setShowCreateVendorModal(false); setEditingVendor(null); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveVendor} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* SECTION 1: Basic Info */}
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Basic Info</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Name<span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="Enter Name"
                      value={vendorFormData.name}
                      onChange={e => setVendorFormData({ ...vendorFormData, name: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Contact<span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="Enter Contact"
                      value={vendorFormData.contact}
                      onChange={e => setVendorFormData({ ...vendorFormData, contact: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#f43f5e', marginTop: '0.25rem', fontWeight: 500 }}>
                      Please use with country code. (ex. +91)
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Email<span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter email"
                      value={vendorFormData.email}
                      onChange={e => setVendorFormData({ ...vendorFormData, email: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Tax Number
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Tax Number"
                      value={vendorFormData.taxNumber}
                      onChange={e => setVendorFormData({ ...vendorFormData, taxNumber: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Balance
                    </label>
                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      placeholder="Enter Balance"
                      value={vendorFormData.balance}
                      onChange={e => setVendorFormData({ ...vendorFormData, balance: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Billing Address */}
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Billing Address</h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Name"
                      value={vendorFormData.billingName}
                      onChange={e => setVendorFormData({ ...vendorFormData, billingName: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Phone
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Phone"
                      value={vendorFormData.billingPhone}
                      onChange={e => setVendorFormData({ ...vendorFormData, billingPhone: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Address
                  </label>
                  <textarea
                    rows={3}
                    className="form-control"
                    placeholder="Enter Address"
                    value={vendorFormData.address}
                    onChange={e => setVendorFormData({ ...vendorFormData, address: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      City
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter City"
                      value={vendorFormData.city}
                      onChange={e => setVendorFormData({ ...vendorFormData, city: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      State
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter State"
                      value={vendorFormData.state}
                      onChange={e => setVendorFormData({ ...vendorFormData, state: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Country
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Country"
                      value={vendorFormData.country}
                      onChange={e => setVendorFormData({ ...vendorFormData, country: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Zip Code
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Zip Code"
                      value={vendorFormData.zipCode}
                      onChange={e => setVendorFormData({ ...vendorFormData, zipCode: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                {/* Green Action Button: Shipping Same As Billing */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setVendorFormData(prev => ({
                        ...prev,
                        shippingName: prev.billingName || prev.name || '',
                        shippingPhone: prev.billingPhone || prev.contact || '',
                        shippingAddress: prev.address || '',
                        shippingCity: prev.city || '',
                        shippingState: prev.state || '',
                        shippingCountry: prev.country || '',
                        shippingZipCode: prev.zipCode || ''
                      }));
                    }}
                    style={{
                      background: '#65a30d',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.65rem 1.25rem',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(101, 163, 13, 0.3)'
                    }}
                  >
                    Shipping Same As Billing
                  </button>
                </div>
              </div>

              {/* SECTION 3: Shipping Address */}
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>Shipping Address</h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Name"
                      value={vendorFormData.shippingName}
                      onChange={e => setVendorFormData({ ...vendorFormData, shippingName: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Phone
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Phone"
                      value={vendorFormData.shippingPhone}
                      onChange={e => setVendorFormData({ ...vendorFormData, shippingPhone: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Address
                  </label>
                  <textarea
                    rows={3}
                    className="form-control"
                    placeholder="Address"
                    value={vendorFormData.shippingAddress}
                    onChange={e => setVendorFormData({ ...vendorFormData, shippingAddress: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      City
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter City"
                      value={vendorFormData.shippingCity}
                      onChange={e => setVendorFormData({ ...vendorFormData, shippingCity: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      State
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter State"
                      value={vendorFormData.shippingState}
                      onChange={e => setVendorFormData({ ...vendorFormData, shippingState: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Country
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Country"
                      value={vendorFormData.shippingCountry}
                      onChange={e => setVendorFormData({ ...vendorFormData, shippingCountry: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                      Zip Code
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter Zip Code"
                      value={vendorFormData.shippingZipCode}
                      onChange={e => setVendorFormData({ ...vendorFormData, shippingZipCode: e.target.value })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowCreateVendorModal(false); setEditingVendor(null); }}
                  style={{ padding: '0.6rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.6rem 1.5rem', fontWeight: 600 }}
                >
                  {editingVendor ? 'Save Changes' : 'Create Vendor'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: VIEW VENDOR DETAILS & BILLS LEDGER                            */}
      {/* ===================================================================== */}
      {viewingVendor && (
        <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                  {viewingVendor.name ? viewingVendor.name.charAt(0).toUpperCase() : 'V'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{viewingVendor.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>GSTIN: {viewingVendor.taxNumber || 'N/A'}</div>
                </div>
              </div>
              <button type="button" onClick={() => setViewingVendor(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1.25rem 0', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Primary Contact</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '2px' }}>{viewingVendor.contact}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Billing Phone: {viewingVendor.billingPhone || viewingVendor.contact}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Outstanding Balance</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: (Number(viewingVendor.balance) || 0) > 0 ? '#ef4444' : '#22c55e', marginTop: '2px' }}>
                  ₹{(Number(viewingVendor.balance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Billing Address</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {viewingVendor.address ? `${viewingVendor.address}, ` : ''}
                  {viewingVendor.city ? `${viewingVendor.city}, ` : ''}
                  {viewingVendor.state ? `${viewingVendor.state} ` : ''}
                  {viewingVendor.zipCode ? `- ${viewingVendor.zipCode}` : ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Associated Purchase Bills</h4>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const targetV = viewingVendor;
                  setViewingVendor(null);
                  handleOpenCreateBill(targetV);
                }}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
              >
                <Plus size={14} /> New Bill for {viewingVendor.name}
              </button>
            </div>

            <table className="custom-table">
              <thead>
                <tr>
                  <th>Bill No</th>
                  <th>Total Amount</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bills.filter(b => b.vendorId === viewingVendor.id || b.vendorName?.toLowerCase() === viewingVendor.name?.toLowerCase()).length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                      No bills issued for this vendor yet.
                    </td>
                  </tr>
                ) : (
                  bills.filter(b => b.vendorId === viewingVendor.id || b.vendorName?.toLowerCase() === viewingVendor.name?.toLowerCase()).map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 600 }}>{b.billNumber}</td>
                      <td style={{ fontWeight: 700 }}>₹{(Number(b.totalAmount) || 0).toLocaleString()}</td>
                      <td style={{ color: '#22c55e' }}>₹{(Number(b.paidAmount) || 0).toLocaleString()}</td>
                      <td style={{ color: '#ef4444', fontWeight: 700 }}>₹{(Number(b.balanceAmount) || 0).toLocaleString()}</td>
                      <td>
                        <span className="badge" style={{ fontSize: '0.72rem', background: b.status === 'PAID' ? '#dcfce7' : '#fee2e2', color: b.status === 'PAID' ? '#15803d' : '#b91c1c' }}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" onClick={() => setViewingVendor(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: DELETE VENDOR CONFIRMATION                                    */}
      {/* ===================================================================== */}
      {deletingVendor && (
        <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#ef4444' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>Confirm Vendor Deletion</h3>
            </div>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete vendor <strong>"{deletingVendor.name}"</strong>? This will remove vendor profile details from the system.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingVendor(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleDeleteVendor} style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                Delete Vendor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: GENERATE / EDIT PURCHASE BILL (Matching Bill Create Design!)   */}
      {/* ===================================================================== */}
      {(showCreateBillModal || editingBill) && (
        <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, padding: '1rem' }}>
          <div className="modal-content" style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '960px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '1.75rem', boxSizing: 'border-box' }}>
            
            {/* Header & Breadcrumb */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#1e293b' }}>
                  {editingBill ? `Edit Bill #${editingBill.billNumber}` : 'Bill Create'}
                </h2>
                <div style={{ fontSize: '0.82rem', color: '#65a30d', marginTop: '4px', fontWeight: 500 }}>
                  <span style={{ color: '#22c55e' }}>Dashboard</span> &gt; <span style={{ color: '#94a3b8' }}>Bill</span> &gt; <span style={{ color: '#475569' }}>Bill Create</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowCreateBillModal(false); setEditingBill(null); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', borderRadius: '50%' }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveBill} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.25rem' }}>
              
              {/* TOP FORM GRID MATCHING SCREENSHOT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
                
                {/* Column 1: Vendor */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
                    Vendor<span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <select
                    className="form-control"
                    required
                    value={billFormData.vendorId}
                    onChange={e => handleVendorSelectInBill(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: billFormData.vendorId ? '#1e293b' : '#94a3b8' }}
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name} ({v.contact})</option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem' }}>
                    Create vendor here. <span style={{ color: '#22c55e', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowCreateVendorModal(true)}>Create vendor</span>
                  </div>
                </div>

                {/* Column 2: Bill Date */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
                    Bill Date<span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={billFormData.billDate || new Date().toISOString().split('T')[0]}
                    onChange={e => setBillFormData({ ...billFormData, billDate: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                {/* Column 3: Due Date */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
                    Due Date<span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    required
                    value={billFormData.dueDate}
                    onChange={e => setBillFormData({ ...billFormData, dueDate: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
                
                {/* Row 2 Column 1: Bill Number */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
                    Bill Number
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    readOnly
                    value={editingBill ? editingBill.billNumber : `#BILL${String(bills.length + 1).padStart(5, '0')}`}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}
                  />
                </div>

                {/* Row 2 Column 2: Category */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
                    Category
                  </label>
                  <select
                    className="form-control"
                    value={billFormData.category}
                    onChange={e => setBillFormData({ ...billFormData, category: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  >
                    <option value="">Select Category</option>
                    <option value="Networking Equipment">Networking Equipment</option>
                    <option value="CCTV & Security Hardware">CCTV & Security Hardware</option>
                    <option value="Electrical Supplies">Electrical Supplies</option>
                    <option value="IT Infrastructure">IT Infrastructure</option>
                    <option value="General Support Service">General Support Service</option>
                  </select>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem' }}>
                    Create category here. <span style={{ color: '#22c55e', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Create category</span>
                  </div>
                </div>

                {/* Row 2 Column 3: Order Number */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.4rem' }}>
                    Order Number
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Order Number"
                    value={billFormData.orderNumber || ''}
                    onChange={e => setBillFormData({ ...billFormData, orderNumber: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

              </div>

              {/* PRODUCTS / INVENTORY AUTO-INCREMENT SECTION */}
              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '0.5rem', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#1e293b' }}>
                      Product Items & Auto Stock Increment
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Select existing inventory products or enter new ones. Purchased quantities will automatically increment stock in Inventory!
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleOpenCreateProduct}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: '#22c55e', borderColor: '#22c55e', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.35rem', boxShadow: '0 2px 6px rgba(34, 197, 94, 0.3)' }}
                    >
                      <Plus size={14} /> Add New Product to Inventory
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleAddBillItem} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: '#ffffff' }}>
                      <Plus size={14} /> Add Product Row
                    </button>
                  </div>
                </div>

                <div style={{ width: '100%', overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff' }}>
                  <table className="custom-table" style={{ width: '100%', tableLayout: 'auto', borderCollapse: 'collapse', background: '#ffffff' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '40%', padding: '0.65rem 0.75rem' }}>Product / Item</th>
                        <th style={{ width: '15%', padding: '0.65rem 0.75rem' }}>Qty</th>
                        <th style={{ width: '20%', padding: '0.65rem 0.75rem' }}>Unit Rate (₹)</th>
                        <th style={{ width: '20%', padding: '0.65rem 0.75rem' }}>Total (₹)</th>
                        <th style={{ width: '5%', padding: '0.65rem 0.5rem', textAlign: 'center' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {billFormData.items.map((it, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            {/* Option to select existing product OR type custom name */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', width: '100%' }}>
                              <select
                                className="form-control"
                                value={it.productId || ''}
                                onChange={e => {
                                  const pId = e.target.value;
                                  if (pId === '__NEW_PRODUCT__') {
                                    handleOpenCreateProduct();
                                    return;
                                  }
                                  const found = (data.products || []).find(p => p.id === pId);
                                  const updated = [...billFormData.items];
                                  if (found) {
                                    updated[idx].productId = found.id;
                                    updated[idx].item = found.name;
                                    updated[idx].code = found.code;
                                    updated[idx].rate = found.purchasePrice || found.unitPrice || 0;
                                    const q = Number(updated[idx].qty) || 1;
                                    updated[idx].amount = q * (found.purchasePrice || found.unitPrice || 0);
                                  } else {
                                    updated[idx].productId = '';
                                  }
                                  const sub = updated.reduce((a, c) => a + (Number(c.amount) || 0), 0);
                                  const gst = Math.round(sub * 0.18);
                                  setBillFormData(prev => ({ ...prev, items: updated, totalAmount: sub + gst, gstAmount: gst }));
                                }}
                                style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
                              >
                                <option value="">-- Select Inventory Product --</option>
                                <option value="__NEW_PRODUCT__" style={{ fontWeight: 'bold', color: '#22c55e' }}>+ Add New Product to Inventory...</option>
                                {(data.products || []).map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.code}) - Stock: {p.stockQuantity} {p.unit || 'Pcs'}
                                  </option>
                                ))}
                              </select>

                              <input
                                type="text"
                                className="form-control"
                                value={it.item}
                                onChange={e => handleBillItemChange(idx, 'item', e.target.value)}
                                placeholder="Or enter custom product name"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.82rem', width: '100%', boxSizing: 'border-box' }}
                              />
                            </div>
                          </td>

                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <input
                              type="number"
                              min="1"
                              className="form-control"
                              value={it.qty}
                              onChange={e => handleBillItemChange(idx, 'qty', e.target.value)}
                              style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', fontWeight: 600, width: '100%', boxSizing: 'border-box' }}
                            />
                          </td>

                          <td style={{ padding: '0.65rem 0.75rem' }}>
                            <input
                              type="number"
                              step="any"
                              className="form-control"
                              value={it.rate}
                              onChange={e => handleBillItemChange(idx, 'rate', e.target.value)}
                              style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' }}
                            />
                          </td>

                          <td style={{ padding: '0.65rem 0.75rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                            ₹{(Number(it.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>

                          <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                            {billFormData.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveBillItem(idx)}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                              >
                                <X size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TOTALS & PAYMENT SUMMARY */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', background: '#f1f5f9', padding: '1rem', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>GST Input Tax (18%)</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>₹{(Number(billFormData.gstAmount) || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Grand Total Billed</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-primary)' }}>₹{(Number(billFormData.totalAmount) || 0).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.2rem' }}>
                    Paid Amount (₹)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    value={billFormData.paidAmount}
                    onChange={e => setBillFormData({ ...billFormData, paidAmount: e.target.value })}
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowCreateBillModal(false); setEditingBill(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.75rem', fontWeight: 600 }}>
                  {editingBill ? 'Save Changes' : 'Create Purchase Bill'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CREATE NEW PRODUCT ON-THE-FLY IN INVENTORY                      */}
      {/* ===================================================================== */}
      {showCreateProductModal && (
        <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', padding: '1.75rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                  Add New Product to Inventory
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                  Product will be saved in inventory and added directly to your purchase bill.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateProductModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNewProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                  Product Name<span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Cisco Catalyst Switch / Cat6 Cable 300m"
                  value={productFormData.name}
                  onChange={e => setProductFormData({ ...productFormData, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    SKU / Product Code<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="e.g. PRD-9482"
                    value={productFormData.code}
                    onChange={e => setProductFormData({ ...productFormData, code: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Category
                  </label>
                  <select
                    className="form-control"
                    value={productFormData.category}
                    onChange={e => setProductFormData({ ...productFormData, category: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  >
                    <option value="Networking Equipment">Networking Equipment</option>
                    <option value="CCTV & Security Hardware">CCTV & Security Hardware</option>
                    <option value="Electrical Supplies">Electrical Supplies</option>
                    <option value="IT Infrastructure">IT Infrastructure</option>
                    <option value="General Support Service">General Support Service</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Initial Quantity<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    required
                    value={productFormData.stockQuantity}
                    onChange={e => setProductFormData({ ...productFormData, stockQuantity: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Unit
                  </label>
                  <select
                    className="form-control"
                    value={productFormData.unit}
                    onChange={e => setProductFormData({ ...productFormData, unit: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Meters">Meters</option>
                    <option value="Kg">Kg</option>
                    <option value="Sets">Sets</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Brand / Make
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Cisco, D-Link"
                    value={productFormData.brand}
                    onChange={e => setProductFormData({ ...productFormData, brand: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Purchase Price (₹)<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    required
                    placeholder="Cost price"
                    value={productFormData.purchasePrice}
                    onChange={e => setProductFormData({ ...productFormData, purchasePrice: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.35rem' }}>
                    Sale Price (₹)<span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    required
                    placeholder="Selling price"
                    value={productFormData.salePrice}
                    onChange={e => setProductFormData({ ...productFormData, salePrice: e.target.value })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateProductModal(false)}
                  style={{ padding: '0.6rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '0.6rem 1.5rem', fontWeight: 600, background: '#22c55e', borderColor: '#22c55e' }}
                >
                  Save & Add to Bill
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: VIEW BILL RECEIPT / INVOICE PREVIEW                            */}
      {/* ===================================================================== */}
      {viewingBill && (
        <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #22c55e', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ margin: 0, color: 'var(--brand-primary)', fontWeight: 800 }}>AKASH ENGINEERING</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Enterprise Vendor Purchase Invoice Statement</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ margin: 0, color: '#1e293b' }}>{viewingBill.billNumber}</h3>
                <span className="badge badge-approved">{viewingBill.status}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
              <div>
                <strong>Vendor Details:</strong>
                <div style={{ color: '#1e293b', fontWeight: 700, marginTop: '4px' }}>{viewingBill.vendorName}</div>
                <div>GSTIN: {viewingBill.vendorGst || 'N/A'}</div>
                <div>Invoice No: {viewingBill.invoiceNo}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div><strong>Bill Date:</strong> {viewingBill.createdAt ? new Date(viewingBill.createdAt).toLocaleDateString() : 'N/A'}</div>
                <div><strong>Due Date:</strong> {viewingBill.dueDate ? new Date(viewingBill.dueDate).toLocaleDateString() : 'N/A'}</div>
                <div><strong>Category:</strong> {viewingBill.category || 'General'}</div>
              </div>
            </div>

            <table className="custom-table" style={{ marginBottom: '1.5rem' }}>
              <thead>
                <tr>
                  <th>Item / Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let items = [];
                  try { items = viewingBill.itemsJson ? JSON.parse(viewingBill.itemsJson) : []; } catch (e) {}
                  if (items.length === 0) items = [{ item: 'General Equipment Purchase', qty: 1, rate: viewingBill.totalAmount, amount: viewingBill.totalAmount }];
                  return items.map((it, idx) => (
                    <tr key={idx}>
                      <td>{it.item}</td>
                      <td>{it.qty}</td>
                      <td>₹{(Number(it.rate) || 0).toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{(Number(it.amount) || 0).toLocaleString()}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
              <div style={{ width: '260px', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                  <span>Subtotal & GST (18%):</span>
                  <span>₹{(Number(viewingBill.gstAmount) || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 800, fontSize: '1.05rem', color: '#1e293b' }}>
                  <span>Grand Total:</span>
                  <span>₹{(Number(viewingBill.totalAmount) || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#22c55e' }}>
                  <span>Amount Paid:</span>
                  <span>₹{(Number(viewingBill.paidAmount) || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: '#ef4444', marginTop: '4px', paddingTop: '4px', borderTop: '1px dashed #cbd5e1' }}>
                  <span>Balance Due:</span>
                  <span>₹{(Number(viewingBill.balanceAmount) || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
              <button className="btn btn-secondary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Printer size={16} /> Print / Export PDF
              </button>
              <button className="btn btn-primary" onClick={() => setViewingBill(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: DELETE BILL CONFIRMATION                                       */}
      {/* ===================================================================== */}
      {deletingBill && (
        <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="modal-content" style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#ef4444' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1e293b' }}>Confirm Bill Deletion</h3>
            </div>
            <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete purchase bill <strong>"{deletingBill.billNumber}"</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingBill(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleDeleteBill} style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                Delete Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: LOG VENDOR PURCHASE (Existing Modal)                           */}
      {/* ===================================================================== */}
      {showPurModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Log Vendor Purchase Entry</h3>
              <button className="btn btn-secondary" onClick={() => setShowPurModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreatePurchase} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vendor Organization Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={newPur.vendorName}
                  onChange={e => setNewPur({ ...newPur, vendorName: e.target.value })}
                  placeholder="e.g. Cisco Systems India Ltd"
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vendor GSTIN</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newPur.vendorGst}
                    onChange={e => setNewPur({ ...newPur, vendorGst: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vendor Invoice No</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newPur.invoiceNo}
                    onChange={e => setNewPur({ ...newPur, invoiceNo: e.target.value })}
                    placeholder="e.g. INV-2026-889"
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category</label>
                  <select
                    className="form-control"
                    value={newPur.category}
                    onChange={e => setNewPur({ ...newPur, category: e.target.value })}
                  >
                    <option value="Networking Equipment">Networking Equipment</option>
                    <option value="CCTV & Security Hardware">CCTV & Security Hardware</option>
                    <option value="Electrical Supplies">Electrical Supplies</option>
                    <option value="IT Infrastructure">IT Infrastructure</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Amount (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newPur.totalAmount}
                    onChange={e => setNewPur({ ...newPur, totalAmount: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPurModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Purchase Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: EDIT PURCHASE RECORD (Existing Modal)                          */}
      {/* ===================================================================== */}
      {editingPur && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>
                Edit Purchase Record #{editingPur.purchaseOrderNo}
              </h3>
              <button className="btn btn-secondary" onClick={() => setEditingPur(null)}>✕</button>
            </div>
            <form onSubmit={handleEditPurchase} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vendor Organization Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={editPurData.vendorName}
                  onChange={e => setEditPurData({ ...editPurData, vendorName: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vendor GSTIN</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editPurData.vendorGst}
                    onChange={e => setEditPurData({ ...editPurData, vendorGst: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vendor Invoice No</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editPurData.invoiceNo}
                    onChange={e => setEditPurData({ ...editPurData, invoiceNo: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category</label>
                  <select
                    className="form-control"
                    value={editPurData.category}
                    onChange={e => setEditPurData({ ...editPurData, category: e.target.value })}
                  >
                    <option value="Networking Equipment">Networking Equipment</option>
                    <option value="CCTV & Security Hardware">CCTV & Security Hardware</option>
                    <option value="Electrical Supplies">Electrical Supplies</option>
                    <option value="IT Infrastructure">IT Infrastructure</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Amount (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editPurData.totalAmount}
                    onChange={e => setEditPurData({ ...editPurData, totalAmount: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status</label>
                <select
                  className="form-control"
                  value={editPurData.status}
                  onChange={e => setEditPurData({ ...editPurData, status: e.target.value })}
                >
                  <option value="APPROVED">APPROVED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingPur(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: DELETE PURCHASE CONFIRMATION                                   */}
      {/* ===================================================================== */}
      {deletingPur && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#ef4444' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Delete Purchase Record</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Are you sure you want to delete purchase record <strong>{deletingPur.purchaseOrderNo}</strong> from <strong>{deletingPur.vendorName}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingPur(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleDeletePurchase} style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CREATE VOUCHER (Existing Modal)                                */}
      {/* ===================================================================== */}
      {showVchModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Create New Voucher Entry</h3>
              <button className="btn btn-secondary" onClick={() => setShowVchModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateVoucher} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Voucher Type</label>
                  <select
                    className="form-control"
                    value={newVch.type}
                    onChange={e => setNewVch({ ...newVch, type: e.target.value })}
                  >
                    <option value="PAYMENT">PAYMENT</option>
                    <option value="RECEIPT">RECEIPT</option>
                    <option value="JOURNAL">JOURNAL</option>
                    <option value="CONTRA">CONTRA</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Amount (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newVch.amount}
                    onChange={e => setNewVch({ ...newVch, amount: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Account Head</label>
                <input
                  type="text"
                  className="form-control"
                  value={newVch.accountHead}
                  onChange={e => setNewVch({ ...newVch, accountHead: e.target.value })}
                  placeholder="e.g. Vendor Settlement / Client NEFT"
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Narration / Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={newVch.narration}
                  onChange={e => setNewVch({ ...newVch, narration: e.target.value })}
                  placeholder="Enter transaction details..."
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowVchModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Post Voucher Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: EDIT VOUCHER RECORD (Existing Modal)                           */}
      {/* ===================================================================== */}
      {editingVch && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>
                Edit Voucher #{editingVch.voucherNo}
              </h3>
              <button className="btn btn-secondary" onClick={() => setEditingVch(null)}>✕</button>
            </div>
            <form onSubmit={handleEditVoucher} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Voucher Type</label>
                  <select
                    className="form-control"
                    value={editVchData.type}
                    onChange={e => setEditVchData({ ...editVchData, type: e.target.value })}
                  >
                    <option value="PAYMENT">PAYMENT</option>
                    <option value="RECEIPT">RECEIPT</option>
                    <option value="JOURNAL">JOURNAL</option>
                    <option value="CONTRA">CONTRA</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Amount (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editVchData.amount}
                    onChange={e => setEditVchData({ ...editVchData, amount: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Account Head</label>
                <input
                  type="text"
                  className="form-control"
                  value={editVchData.accountHead}
                  onChange={e => setEditVchData({ ...editVchData, accountHead: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Narration / Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={editVchData.narration}
                  onChange={e => setEditVchData({ ...editVchData, narration: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status</label>
                <select
                  className="form-control"
                  value={editVchData.status}
                  onChange={e => setEditVchData({ ...editVchData, status: e.target.value })}
                >
                  <option value="APPROVED">APPROVED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingVch(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: DELETE VOUCHER CONFIRMATION                                    */}
      {/* ===================================================================== */}
      {deletingVch && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#ef4444' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Delete Voucher Entry</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Are you sure you want to delete voucher entry <strong>{deletingVch.voucherNo}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingVch(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleDeleteVoucher} style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                Delete Voucher
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
