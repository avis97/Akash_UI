import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Plus, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  BellRing, 
  Download,
  DollarSign,
  Briefcase,
  Edit2,
  Trash2,
  AlertTriangle,
  Calendar,
  UserCheck,
  Check,
  Clock,
  MapPin,
  Building
} from 'lucide-react';

export default function BillingQuotations({ data = {}, currentRole, currentUser, onRefresh, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab || 'invoices'); // 'invoices' | 'quotations'
  const [showInvModal, setShowInvModal] = useState(false);
  const [showQuotModal, setShowQuotModal] = useState(false);

  // Edit / Delete state for Invoices & Quotations
  const [editingInv, setEditingInv] = useState(null);
  const [deletingInv, setDeletingInv] = useState(null);
  const [editingQuot, setEditingQuot] = useState(null);
  const [deletingQuot, setDeletingQuot] = useState(null);

  // Flow State: Quotation Acceptance & Meeting Assignment
  const [assignMeetingQuot, setAssignMeetingQuot] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    clientName: '',
    clientAddress: '',
    scheduledAt: '',
    assignedToId: '',
    agenda: '',
    deliverables: ''
  });

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  const [invoices, setInvoices] = useState(data.invoices || []);
  const [quotations, setQuotations] = useState(data.quotations || []);
  const [users, setUsers] = useState(data.users || []);
  const [products, setProducts] = useState(data.products || []);

  // Product Line Items for Quotation Creation
  const [quotItems, setQuotItems] = useState([
    { productId: '', name: '', code: '', unitPrice: 0, qty: 1, total: 0 }
  ]);

  const quotSubtotal = quotItems.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
  const quotGst = Math.round(quotSubtotal * 0.18);
  const quotGrandTotal = quotSubtotal + quotGst;

  const handleAddQuotItem = () => {
    setQuotItems(prev => [...prev, { productId: '', name: '', code: '', unitPrice: 0, qty: 1, total: 0 }]);
  };

  const handleRemoveQuotItem = (index) => {
    setQuotItems(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.length === 0 ? [{ productId: '', name: '', code: '', unitPrice: 0, qty: 1, total: 0 }] : updated;
    });
  };

  const handleQuotItemChange = (index, field, value) => {
    setQuotItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        if (prod) {
          item.productId = prod.id;
          item.name = prod.name;
          item.code = prod.code;
          item.unitPrice = Number(prod.unitPrice) || 0;
          item.qty = item.qty || 1;
          item.total = item.qty * item.unitPrice;
        } else {
          item.productId = '';
        }
      } else if (field === 'qty') {
        item.qty = Math.max(1, Number(value) || 1);
        item.total = item.qty * (item.unitPrice || 0);
      } else if (field === 'unitPrice') {
        item.unitPrice = Number(value) || 0;
        item.total = (item.qty || 1) * item.unitPrice;
      } else if (field === 'name') {
        item.name = value;
      }

      updated[index] = item;
      return updated;
    });
  };

  const fetchBillingData = useCallback(async () => {
    try {
      const [invRes, quotRes, usrRes, prodRes] = await Promise.allSettled([
        fetch('/api/billing/invoices').then(r => r.json()),
        fetch('/api/billing/quotations').then(r => r.json()),
        fetch('/api/users').then(r => r.json()),
        fetch('/api/inventory').then(r => r.json())
      ]);

      if (invRes.status === 'fulfilled' && invRes.value?.success) setInvoices(invRes.value.data);
      if (quotRes.status === 'fulfilled' && quotRes.value?.success) setQuotations(quotRes.value.data);
      if (usrRes.status === 'fulfilled' && usrRes.value?.success) setUsers(usrRes.value.data);
      if (prodRes.status === 'fulfilled' && prodRes.value?.success) setProducts(prodRes.value.data);
    } catch (err) {
      console.error('Error fetching billing data:', err);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  // Derived Client and Employee Lists
  const registeredClients = users.filter(u => u.role === 'CLIENT' || u.role === 'USER');
  const availableEmployees = users.filter(u => u.role === 'EMPLOYEE' || u.role === 'SERVICE_PERSONNEL' || u.role === 'FACILITY_MANAGER');

  const isClient = currentRole === 'CLIENT' || currentUser?.role === 'CLIENT';

  const displayedInvoices = invoices.filter(inv => {
    if (isClient && currentUser) {
      const clientName = currentUser.name?.toLowerCase().trim();
      const clientId = currentUser.id;
      const clientEmail = currentUser.email?.toLowerCase().trim();

      const matchesId = clientId && inv.clientId === clientId;
      const matchesName = clientName && inv.clientName?.toLowerCase().trim() === clientName;
      const matchesEmail = clientEmail && inv.clientEmail?.toLowerCase().trim() === clientEmail;

      return Boolean(matchesId || matchesName || matchesEmail);
    }
    return true;
  });

  const displayedQuotations = quotations.filter(q => {
    if (isClient && currentUser) {
      const clientName = currentUser.name?.toLowerCase().trim();
      const clientId = currentUser.id;
      const clientEmail = currentUser.email?.toLowerCase().trim();

      const matchesId = clientId && q.clientId === clientId;
      const matchesName = clientName && q.clientName?.toLowerCase().trim() === clientName;
      const matchesEmail = clientEmail && q.clientEmail?.toLowerCase().trim() === clientEmail;

      return Boolean(matchesId || matchesName || matchesEmail);
    }
    return true;
  });

  // Handle client selection when creating quotation
  const handleClientSelect = (clientId) => {
    if (!clientId) {
      setNewQuot(prev => ({ ...prev, clientId: '', clientName: '', clientEmail: '' }));
      return;
    }
    const found = registeredClients.find(c => c.id === clientId);
    if (found) {
      setNewQuot(prev => ({
        ...prev,
        clientId: found.id,
        clientName: found.name,
        clientEmail: found.email
      }));
    }
  };

  // Handle Client / Super Admin Accepting Quotation
  const handleAcceptQuotation = async (quot) => {
    try {
      const res = await fetch(`/api/billing/quotations/${quot.id}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptedBy: currentUser?.name || 'Client Representative' })
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccessMsg(`Quotation #${quot.quotationNumber} accepted! Final Tax Invoice #${json.invoice?.invoiceNumber || ''} automatically generated & client lead status updated to Active Client.`);
        setTimeout(() => setActionSuccessMsg(''), 7000);
        fetchBillingData();
        if (onRefresh) onRefresh();
      } else {
        alert(json.message || 'Failed to accept quotation');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open modal to assign meeting to an employee from accepted quotation
  const openAssignMeetingModal = (quot) => {
    const defaultEmp = availableEmployees.length > 0 ? availableEmployees[0].id : '';
    setAssignMeetingQuot(quot);
    setMeetingForm({
      title: `Service Onboarding & Setup: ${quot.clientName}`,
      clientName: quot.clientName,
      clientAddress: 'Client Corporate Site / Headquarters',
      scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      assignedToId: defaultEmp,
      agenda: `Service kickoff and installation for accepted Quotation #${quot.quotationNumber} (₹${quot.grandTotal?.toLocaleString() || quot.totalAmount?.toLocaleString()})`,
      deliverables: 'Service delivery checklist, technical setup audit, sign-off sheet'
    });
  };

  // Submit meeting assignment to backend
  const handleScheduleMeetingFromQuot = async (e) => {
    e.preventDefault();
    if (!assignMeetingQuot) return;
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...meetingForm,
          assignedToId: meetingForm.assignedToId || null
        })
      });
      const json = await res.json();
      if (json.success) {
        setAssignMeetingQuot(null);
        setActionSuccessMsg(`Service meeting successfully scheduled and assigned to employee for ${assignMeetingQuot.clientName}! The employee can now view this meeting in Service Meetings.`);
        setTimeout(() => setActionSuccessMsg(''), 7000);
        fetchBillingData();
        if (onRefresh) onRefresh();
      } else {
        alert(json.message || 'Error scheduling meeting');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // New Invoice Form State
  const [newInv, setNewInv] = useState({
    clientName: '',
    clientEmail: '',
    totalAmount: 45000,
    dueDate: '2026-09-20'
  });

  // Edit Invoice Form State
  const [editInvData, setEditInvData] = useState({
    clientName: '',
    clientEmail: '',
    totalAmount: 45000,
    paidAmount: 0,
    dueDate: '',
    status: 'UNPAID'
  });

  // New Quotation Form State
  const [newQuot, setNewQuot] = useState({
    clientId: '',
    clientName: '',
    clientEmail: '',
    totalAmount: 60000
  });

  // Edit Quotation Form State
  const [editQuotData, setEditQuotData] = useState({
    clientName: '',
    clientEmail: '',
    totalAmount: 60000,
    validUntil: '',
    status: 'SENT'
  });

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInv)
      });
      const json = await res.json();
      if (json.success) {
        setShowInvModal(false);
        setNewInv({ clientName: '', clientEmail: '', totalAmount: 45000, dueDate: '2026-09-20' });
        fetchBillingData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditInvoice = async (e) => {
    e.preventDefault();
    if (!editingInv) return;
    try {
      const res = await fetch(`/api/billing/invoices/${editingInv.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editInvData)
      });
      const json = await res.json();
      if (json.success) {
        setEditingInv(null);
        fetchBillingData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deletingInv) return;
    try {
      const res = await fetch(`/api/billing/invoices/${deletingInv.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setDeletingInv(null);
        fetchBillingData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    try {
      const validItems = quotItems.filter(i => i.name || i.productId);
      const subtotal = quotSubtotal > 0 ? quotSubtotal : Number(newQuot.totalAmount) || 0;

      const payload = {
        clientId: newQuot.clientId || null,
        clientName: newQuot.clientName,
        clientEmail: newQuot.clientEmail,
        totalAmount: subtotal,
        items: validItems.length > 0 ? validItems : [{ name: 'Service & System Package', qty: 1, unitPrice: subtotal, total: subtotal }]
      };

      const res = await fetch('/api/billing/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setShowQuotModal(false);
        setNewQuot({ clientId: '', clientName: '', clientEmail: '', totalAmount: 0 });
        setQuotItems([{ productId: '', name: '', code: '', unitPrice: 0, qty: 1, total: 0 }]);
        setActionSuccessMsg(`Official Quotation #${json.data?.quotationNumber} successfully created and sent to ${newQuot.clientName}!`);
        setTimeout(() => setActionSuccessMsg(''), 7000);
        fetchBillingData();
        if (onRefresh) onRefresh();
      } else {
        alert(json.message || 'Error creating quotation');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditQuotation = async (e) => {
    e.preventDefault();
    if (!editingQuot) return;
    try {
      const res = await fetch(`/api/billing/quotations/${editingQuot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editQuotData)
      });
      const json = await res.json();
      if (json.success) {
        setEditingQuot(null);
        fetchBillingData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuotation = async () => {
    if (!deletingQuot) return;
    try {
      const res = await fetch(`/api/billing/quotations/${deletingQuot.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setDeletingQuot(null);
        fetchBillingData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintQuotPDF = (q) => {
    const printWindow = window.open('', '_blank', 'width=850,height=1100');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups to print/download the PDF.');
      return;
    }
    const validUntilStr = typeof q.validUntil === 'string' ? q.validUntil.slice(0, 10) : new Date(q.validUntil).toISOString().slice(0, 10);
    const createdDateStr = q.createdAt ? new Date(q.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    
    let parsedItems = [];
    try {
      parsedItems = typeof q.itemsJson === 'string' ? JSON.parse(q.itemsJson) : (q.itemsJson || []);
    } catch (e) {
      parsedItems = [];
    }
    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      parsedItems = [{ name: 'Enterprise Service & Equipment Package', qty: 1, unitPrice: q.totalAmount, total: q.totalAmount }];
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quotation_${q.quotationNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; }
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 40px;
            color: #0f172a;
            background: #ffffff;
          }
          .quot-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-title {
            font-size: 24px;
            font-weight: 800;
            color: #2563eb;
            letter-spacing: -0.5px;
          }
          .company-subtitle {
            font-size: 13px;
            color: #64748b;
            margin-top: 4px;
          }
          .quot-title {
            font-size: 28px;
            font-weight: 800;
            color: #0f172a;
            text-align: right;
          }
          .quot-badge {
            display: inline-block;
            background: #eff6ff;
            color: #2563eb;
            font-size: 14px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 6px;
            margin-top: 6px;
            text-align: right;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          .box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px 20px;
          }
          .box-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          .box-name {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
          }
          .box-detail {
            font-size: 13px;
            color: #475569;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          th {
            background: #0f172a;
            color: #ffffff;
            font-size: 12px;
            text-transform: uppercase;
            font-weight: 700;
            padding: 12px 16px;
            text-align: left;
          }
          td {
            padding: 14px 16px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
            color: #334155;
          }
          .text-right { text-align: right; }
          .totals-table {
            width: 320px;
            margin-left: auto;
            margin-bottom: 30px;
          }
          .totals-table td {
            padding: 8px 16px;
            border-bottom: none;
          }
          .grand-total {
            font-size: 16px;
            font-weight: 800;
            color: #1e40af;
            border-top: 2px solid #cbd5e1;
            border-bottom: 2px solid #cbd5e1 !important;
            background: #eff6ff;
          }
          .terms {
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            margin-top: 40px;
            line-height: 1.6;
          }
          .signature-block {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .sig-line {
            border-top: 1px solid #94a3b8;
            width: 200px;
            text-align: center;
            padding-top: 6px;
            font-size: 12px;
            font-weight: 600;
            color: #475569;
          }
          .print-btn-bar {
            margin-bottom: 20px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }
          .btn-print {
            background: #2563eb;
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
          }
          @media print {
            .print-btn-bar { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="print-btn-bar">
          <button class="btn-print" onclick="window.print()">🖨️ Save as PDF / Print</button>
        </div>

        <div class="quot-header">
          <div>
            <div class="company-title">VS DIGITECH ENTERPRISE</div>
            <div class="company-subtitle">Enterprise Software & Facility Solutions</div>
            <div class="company-subtitle">Email: billing@vsdigitech.com | Web: www.vsdigitech.com</div>
          </div>
          <div style="text-align: right;">
            <div class="quot-title">QUOTATION</div>
            <div class="quot-badge"># ${q.quotationNumber}</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="box">
            <div class="box-title">Client Details (Bill To)</div>
            <div class="box-name">${q.clientName || 'Valued Client'}</div>
            <div class="box-detail">Email: ${q.clientEmail || 'N/A'}</div>
            ${q.client?.companyName ? `<div class="box-detail">Company: ${q.client.companyName}</div>` : ''}
            ${q.client?.gstin ? `<div class="box-detail">GSTIN: ${q.client.gstin}</div>` : ''}
          </div>
          <div class="box">
            <div class="box-title">Quotation Summary</div>
            <div class="box-detail"><strong>Quotation Date:</strong> ${createdDateStr}</div>
            <div class="box-detail"><strong>Valid Until:</strong> ${validUntilStr}</div>
            <div class="box-detail"><strong>Status:</strong> ${q.status}</div>
            <div class="box-detail"><strong>Currency:</strong> INR (₹)</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product / Service Description</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Unit Price (₹)</th>
              <th class="text-right">Line Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${parsedItems.map((item, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>
                  <strong>${item.name || 'Product Line Item'}</strong>
                  ${item.code ? `<span style="font-size: 11px; color: #64748b; margin-left: 6px;">[Code: ${item.code}]</span>` : ''}
                </td>
                <td class="text-right">${item.qty || 1}</td>
                <td class="text-right">₹${Number(item.unitPrice || (item.total / (item.qty || 1)))?.toLocaleString()}</td>
                <td class="text-right">₹${Number(item.total)?.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <table class="totals-table">
          <tr>
            <td>Subtotal:</td>
            <td class="text-right">₹${q.totalAmount?.toLocaleString()}</td>
          </tr>
          <tr>
            <td>GST (18%):</td>
            <td class="text-right">₹${q.gstAmount?.toLocaleString()}</td>
          </tr>
          <tr class="grand-total">
            <td>Grand Total:</td>
            <td class="text-right">₹${q.grandTotal?.toLocaleString()}</td>
          </tr>
        </table>

        <div class="signature-block">
          <div class="terms">
            <strong>Terms & Conditions:</strong><br/>
            1. Validity: This quotation is valid until ${validUntilStr}.<br/>
            2. Payment: Payable upon formal acceptance.<br/>
            3. GST: 18% GST added as per prevailing taxation laws.
          </div>
          <div>
            <div class="sig-line">Authorized Signatory</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handlePrintInvPDF = (inv) => {
    const printWindow = window.open('', '_blank', 'width=850,height=1100');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups to print/download the PDF.');
      return;
    }
    const dueDateStr = typeof inv.dueDate === 'string' ? inv.dueDate.slice(0, 10) : new Date(inv.dueDate).toISOString().slice(0, 10);
    const createdDateStr = inv.createdAt ? new Date(inv.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice_${inv.invoiceNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; }
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 40px;
            color: #0f172a;
            background: #ffffff;
          }
          .inv-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-title {
            font-size: 24px;
            font-weight: 800;
            color: #2563eb;
            letter-spacing: -0.5px;
          }
          .company-subtitle {
            font-size: 13px;
            color: #64748b;
            margin-top: 4px;
          }
          .inv-title {
            font-size: 28px;
            font-weight: 800;
            color: #0f172a;
            text-align: right;
          }
          .inv-badge {
            display: inline-block;
            background: #f0fdf4;
            color: #16a34a;
            font-size: 14px;
            font-weight: 700;
            padding: 4px 12px;
            border-radius: 6px;
            margin-top: 6px;
            text-align: right;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          .box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px 20px;
          }
          .box-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          .box-name {
            font-size: 16px;
            font-weight: 700;
            color: #0f172a;
          }
          .box-detail {
            font-size: 13px;
            color: #475569;
            margin-top: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          th {
            background: #0f172a;
            color: #ffffff;
            font-size: 12px;
            text-transform: uppercase;
            font-weight: 700;
            padding: 12px 16px;
            text-align: left;
          }
          td {
            padding: 14px 16px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
            color: #334155;
          }
          .text-right { text-align: right; }
          .totals-table {
            width: 320px;
            margin-left: auto;
            margin-bottom: 30px;
          }
          .totals-table td {
            padding: 8px 16px;
            border-bottom: none;
          }
          .grand-total {
            font-size: 16px;
            font-weight: 800;
            color: #16a34a;
            border-top: 2px solid #cbd5e1;
            border-bottom: 2px solid #cbd5e1 !important;
            background: #f0fdf4;
          }
          .signature-block {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .sig-line {
            border-top: 1px solid #94a3b8;
            width: 200px;
            text-align: center;
            padding-top: 6px;
            font-size: 12px;
            font-weight: 600;
            color: #475569;
          }
          .print-btn-bar {
            margin-bottom: 20px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }
          .btn-print {
            background: #2563eb;
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
          }
          @media print {
            .print-btn-bar { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="print-btn-bar">
          <button class="btn-print" onclick="window.print()">🖨️ Save as PDF / Print</button>
        </div>

        <div class="inv-header">
          <div>
            <div class="company-title">VS DIGITECH ENTERPRISE</div>
            <div class="company-subtitle">TAX INVOICE</div>
            <div class="company-subtitle">Email: billing@vsdigitech.com | Web: www.vsdigitech.com</div>
          </div>
          <div style="text-align: right;">
            <div class="inv-title">INVOICE</div>
            <div class="inv-badge"># ${inv.invoiceNumber}</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="box">
            <div class="box-title">Billed To</div>
            <div class="box-name">${inv.clientName || 'Valued Customer'}</div>
            <div class="box-detail">Email: ${inv.clientEmail || 'N/A'}</div>
          </div>
          <div class="box">
            <div class="box-title">Invoice Details</div>
            <div class="box-detail"><strong>Invoice Date:</strong> ${createdDateStr}</div>
            <div class="box-detail"><strong>Due Date:</strong> ${dueDateStr}</div>
            <div class="box-detail"><strong>Status:</strong> ${inv.status}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Service Fee / Invoice Amount</td>
              <td class="text-right">1</td>
              <td class="text-right">₹${inv.totalAmount?.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <table class="totals-table">
          <tr>
            <td>Total Amount:</td>
            <td class="text-right">₹${inv.totalAmount?.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Paid Amount:</td>
            <td class="text-right">₹${inv.paidAmount?.toLocaleString()}</td>
          </tr>
          <tr class="grand-total">
            <td>Balance Due:</td>
            <td class="text-right">₹${inv.balanceAmount?.toLocaleString()}</td>
          </tr>
        </table>

        <div class="signature-block">
          <div style="font-size: 12px; color: #64748b;">
            Thank you for your business!
          </div>
          <div>
            <div class="sig-line">Authorized Signatory</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleSendPaymentReminder = (clientName, invNo) => {
    alert(`Automated Email & SMS Payment Reminder sent to ${clientName} for Invoice #${invNo}!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      
      {actionSuccessMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          padding: '0.45rem 0.85rem',
          borderRadius: 'var(--radius-md)',
          color: '#34d399',
          fontSize: '0.8rem',
          fontWeight: 600
        }}>
          <CheckCircle size={16} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Sub-nav & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', background: '#ffffff', padding: '0.45rem 0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', gap: '0.2rem', background: '#f1f5f9', padding: '0.18rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <button 
            className={`btn ${activeTab === 'invoices' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            onClick={() => setActiveTab('invoices')}
          >
            <FileText style={{ width: 14, height: 14 }} />
            Invoices & Automated Billing ({invoices.length})
          </button>
          <button 
            className={`btn ${activeTab === 'quotations' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            onClick={() => setActiveTab('quotations')}
          >
            <Briefcase style={{ width: 14, height: 14 }} />
            Client Quotations ({quotations.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.45rem' }}>
          {activeTab === 'invoices' ? (
            <button className="btn btn-primary" style={{ padding: '0.28rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => setShowInvModal(true)}>
              <Plus style={{ width: 14, height: 14 }} />
              Generate Tax Invoice
            </button>
          ) : (
            <button className="btn btn-primary" style={{ padding: '0.28rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }} onClick={() => setShowQuotModal(true)}>
              <Plus style={{ width: 14, height: 14 }} />
              Create Client Quotation
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: Invoices */}
      {activeTab === 'invoices' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
              Automated Billing Ledger & Payment Reminders
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Integrated GST Calculation & Reminder Alerts
            </span>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Client</th>
                <th>Total Amount</th>
                <th>Paid Amount</th>
                <th>Balance Due</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedInvoices.map(inv => (
                <tr key={inv.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-yellow)' }}>
                      {inv.invoiceNumber}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{inv.clientName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.clientEmail}</div>
                  </td>
                  <td>₹{inv.totalAmount.toLocaleString()}</td>
                  <td style={{ color: 'var(--brand-green)' }}>₹{inv.paidAmount.toLocaleString()}</td>
                  <td><strong style={{ color: inv.balanceAmount > 0 ? 'var(--brand-red)' : 'var(--text-primary)' }}>₹{inv.balanceAmount.toLocaleString()}</strong></td>
                  <td>{typeof inv.dueDate === 'string' ? inv.dueDate.slice(0, 10) : new Date(inv.dueDate).toISOString().slice(0, 10)}</td>
                  <td>
                    {inv.status === 'PAID' && <span className="badge badge-approved">PAID</span>}
                    {inv.status === 'PARTIAL' && <span className="badge badge-pending">PARTIAL</span>}
                    {inv.status === 'OVERDUE' && <span className="badge badge-rejected">OVERDUE</span>}
                    {inv.status === 'UNPAID' && <span className="badge badge-pending">UNPAID</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        title="Download / Print Invoice PDF"
                        onClick={() => handlePrintInvPDF(inv)}
                      >
                        <Download size={14} color="var(--brand-primary)" />
                        PDF
                      </button>
                      {inv.balanceAmount > 0 && (
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => handleSendPaymentReminder(inv.clientName, inv.invoiceNumber)}
                          title="Send Payment Reminder"
                        >
                          <BellRing style={{ width: 14, height: 14, color: 'var(--brand-yellow)' }} />
                        </button>
                      )}
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(59, 130, 246, 0.4)', color: '#3b82f6' }}
                        title="Edit Invoice"
                        onClick={() => {
                          setEditingInv(inv);
                          setEditInvData({
                            clientName: inv.clientName || '',
                            clientEmail: inv.clientEmail || '',
                            totalAmount: inv.totalAmount || 0,
                            paidAmount: inv.paidAmount || 0,
                            dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().slice(0, 10) : '',
                            status: inv.status || 'UNPAID'
                          });
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                        title="Delete Invoice"
                        onClick={() => setDeletingInv(inv)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: Quotations */}
      {activeTab === 'quotations' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
              Client Quotation Management & Approval Track
            </h3>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Quotation No</th>
                <th>Client Name</th>
                <th>Net Amount</th>
                <th>GST (18%)</th>
                <th>Grand Total</th>
                <th>Valid Until</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedQuotations.map(q => (
                <tr key={q.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-yellow)' }}>
                      {q.quotationNumber}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{q.clientName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{q.clientEmail}</div>
                    {q.client?.clientStatus && (
                      <div style={{ marginTop: '0.2rem' }}>
                        <span style={{
                          fontSize: '0.65rem',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: q.client.clientStatus === 'ACTIVE_CLIENT' ? 'rgba(16, 185, 129, 0.2)' : q.client.clientStatus === 'QUOTATION_SENT' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                          color: q.client.clientStatus === 'ACTIVE_CLIENT' ? '#34d399' : q.client.clientStatus === 'QUOTATION_SENT' ? '#60a5fa' : '#facc15'
                        }}>
                          {q.client.clientStatus === 'ACTIVE_CLIENT' ? 'Active Client (Won)' : q.client.clientStatus === 'QUOTATION_SENT' ? 'Quotation Sent' : 'Lead'}
                        </span>
                      </div>
                    )}
                  </td>
                  <td>₹{q.totalAmount.toLocaleString()}</td>
                  <td>₹{q.gstAmount.toLocaleString()}</td>
                  <td><strong style={{ color: 'var(--brand-gold)' }}>₹{q.grandTotal.toLocaleString()}</strong></td>
                  <td>{typeof q.validUntil === 'string' ? q.validUntil.slice(0, 10) : new Date(q.validUntil).toISOString().slice(0, 10)}</td>
                  <td>
                    {q.status === 'APPROVED' && <span className="badge badge-approved">APPROVED</span>}
                    {q.status === 'SENT' && <span className="badge badge-scheduled">SENT TO CLIENT</span>}
                    {q.status === 'REJECTED' && <span className="badge badge-rejected">REJECTED</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Download PDF Button */}
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                        title="Download / Print Quotation PDF"
                        onClick={() => handlePrintQuotPDF(q)}
                      >
                        <Download size={14} color="var(--brand-yellow)" />
                        PDF
                      </button>

                      {/* Step 3: Accept Quotation button */}
                      {q.status !== 'APPROVED' && (
                        <button 
                          className="btn btn-secondary"
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            borderColor: 'rgba(16, 185, 129, 0.35)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontWeight: 600
                          }}
                          title="Accept Quotation"
                          onClick={() => handleAcceptQuotation(q)}
                        >
                          <Check size={14} />
                          Accept
                        </button>
                      )}

                      {/* Step 4: Assign Meeting to Employee button */}
                      {q.status === 'APPROVED' && (
                        <button 
                          className="btn btn-primary"
                          style={{
                            padding: '0.35rem 0.7rem',
                            fontSize: '0.75rem',
                            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                            color: '#fff',
                            border: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                          }}
                          title="Schedule & Assign Service Meeting to Employee"
                          onClick={() => openAssignMeetingModal(q)}
                        >
                          <Calendar size={14} />
                          Assign Meeting
                        </button>
                      )}

                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(59, 130, 246, 0.4)', color: '#3b82f6' }}
                        title="Edit Quotation"
                        onClick={() => {
                          setEditingQuot(q);
                          setEditQuotData({
                            clientName: q.clientName || '',
                            clientEmail: q.clientEmail || '',
                            totalAmount: q.totalAmount || 0,
                            validUntil: q.validUntil ? new Date(q.validUntil).toISOString().slice(0, 10) : '',
                            status: q.status || 'SENT'
                          });
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                        title="Delete Quotation"
                        onClick={() => setDeletingQuot(q)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal 1: Generate Invoice */}
      {showInvModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Issue Itemized Tax Invoice
            </h3>
            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Organization Name</label>
                <input 
                  className="input-field" 
                  required
                  value={newInv.clientName}
                  onChange={e => setNewInv({ ...newInv, clientName: e.target.value })}
                  placeholder="e.g. PwC India / HDFC Bank"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Email</label>
                <input 
                  type="email"
                  className="input-field" 
                  required
                  value={newInv.clientEmail}
                  onChange={e => setNewInv({ ...newInv, clientEmail: e.target.value })}
                  placeholder="accounts@client.com"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Invoice Total (₹)</label>
                  <input 
                    type="number"
                    className="input-field" 
                    required
                    value={newInv.totalAmount}
                    onChange={e => setNewInv({ ...newInv, totalAmount: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Payment Due Date</label>
                  <input 
                    type="date"
                    className="input-field" 
                    value={newInv.dueDate}
                    onChange={e => setNewInv({ ...newInv, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowInvModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 1B: Edit Invoice */}
      {editingInv && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Edit Invoice ({editingInv.invoiceNumber})
            </h3>
            <form onSubmit={handleEditInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Name</label>
                  <input 
                    className="input-field" 
                    required
                    value={editInvData.clientName}
                    onChange={e => setEditInvData({ ...editInvData, clientName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Email</label>
                  <input 
                    type="email"
                    className="input-field" 
                    required
                    value={editInvData.clientEmail}
                    onChange={e => setEditInvData({ ...editInvData, clientEmail: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Amount (₹)</label>
                  <input 
                    type="number"
                    className="input-field" 
                    required
                    value={editInvData.totalAmount}
                    onChange={e => setEditInvData({ ...editInvData, totalAmount: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Paid Amount (₹)</label>
                  <input 
                    type="number"
                    className="input-field" 
                    value={editInvData.paidAmount}
                    onChange={e => setEditInvData({ ...editInvData, paidAmount: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status</label>
                  <select 
                    className="select-field"
                    value={editInvData.status}
                    onChange={e => setEditInvData({ ...editInvData, status: e.target.value })}
                  >
                    <option value="UNPAID">UNPAID</option>
                    <option value="PARTIAL">PARTIAL</option>
                    <option value="PAID">PAID</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Due Date</label>
                <input 
                  type="date"
                  className="input-field" 
                  value={editInvData.dueDate}
                  onChange={e => setEditInvData({ ...editInvData, dueDate: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingInv(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Invoice Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Quotation */}
      {showQuotModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Create Official Quotation & Request
            </h3>
            <form onSubmit={handleCreateQuotation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select Registered Client</label>
                <select 
                  className="select-field"
                  onChange={e => handleClientSelect(e.target.value)}
                  style={{ marginBottom: '0.5rem' }}
                >
                  <option value="">-- Choose Registered Client (or enter manually below) --</option>
                  {registeredClients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email}) {c.phone ? `- ${c.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Name</label>
                <input 
                  className="input-field" 
                  required
                  value={newQuot.clientName}
                  onChange={e => setNewQuot({ ...newQuot, clientName: e.target.value })}
                  placeholder="Client Organization Name"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Contact Email</label>
                <input 
                  type="email"
                  className="input-field" 
                  required
                  value={newQuot.clientEmail}
                  onChange={e => setNewQuot({ ...newQuot, clientEmail: e.target.value })}
                />
              </div>
              {/* Product Line Items & Quantities Selection */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Briefcase size={15} color="var(--brand-yellow)" />
                    Product Items & Quantity Selection (From Stock Inventory Catalog)
                  </label>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    onClick={handleAddQuotItem}
                  >
                    <Plus size={14} /> Add Product Item
                  </button>
                </div>

                {quotItems.map((item, index) => (
                  <div key={index} style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.4fr 0.8fr 1fr auto', gap: '0.6rem', alignItems: 'center' }}>
                      {/* Select from Inventory */}
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Select Inventory Product</label>
                        <select 
                          className="select-field"
                          style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                          value={item.productId}
                          onChange={e => handleQuotItemChange(index, 'productId', e.target.value)}
                        >
                          <option value="">-- Choose Product Item --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              [{p.code || 'ITEM'}] {p.name} - ₹{Number(p.unitPrice || 0).toLocaleString()} ({p.stockQuantity || 0} in stock)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Item Name / Custom */}
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Item Name</label>
                        <input 
                          className="input-field"
                          style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                          placeholder="Product / Service Description"
                          value={item.name}
                          onChange={e => handleQuotItemChange(index, 'name', e.target.value)}
                        />
                      </div>

                      {/* Quantity */}
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Quantity (Qty)</label>
                        <input 
                          type="number"
                          min="1"
                          className="input-field"
                          style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                          value={item.qty}
                          onChange={e => handleQuotItemChange(index, 'qty', e.target.value)}
                        />
                      </div>

                      {/* Unit Price */}
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'block' }}>Unit Price (₹)</label>
                        <input 
                          type="number"
                          className="input-field"
                          style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                          value={item.unitPrice}
                          onChange={e => handleQuotItemChange(index, 'unitPrice', e.target.value)}
                        />
                      </div>

                      {/* Remove Button */}
                      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1.25rem' }}>
                        <button 
                          type="button" 
                          style={{ 
                            background: '#fef2f2', 
                            border: '1px solid #fecaca', 
                            color: '#ef4444', 
                            borderRadius: '6px', 
                            padding: '0.45rem', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Remove item"
                          onClick={() => handleRemoveQuotItem(index)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.8rem', color: '#475569', fontWeight: 600, paddingTop: '0.25rem', borderTop: '1px dashed #e2e8f0' }}>
                      <span>Line Total: <strong style={{ color: '#d97706', fontSize: '0.85rem' }}>₹{(Number(item.total) || 0).toLocaleString()}</strong></span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Automatic Calculation Summary */}
              <div style={{ background: '#f1f5f9', padding: '0.95rem 1.15rem', borderRadius: '10px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569' }}>
                  <span>Net Amount (Subtotal):</span>
                  <strong style={{ color: '#0f172a', fontWeight: 700 }}>₹{quotSubtotal.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569' }}>
                  <span>GST (18% Statutory Tax):</span>
                  <span style={{ color: '#d97706', fontWeight: 700 }}>+ ₹{quotGst.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem', marginTop: '0.2rem', color: '#0f172a' }}>
                  <span>Grand Total Payable:</span>
                  <span style={{ color: '#059669', fontSize: '1.1rem' }}>₹{quotGrandTotal.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuotModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Send Quotation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2B: Edit Quotation */}
      {editingQuot && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '1rem' }}>
              Edit Quotation ({editingQuot.quotationNumber})
            </h3>
            <form onSubmit={handleEditQuotation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Name</label>
                <input 
                  className="input-field" 
                  required
                  value={editQuotData.clientName}
                  onChange={e => setEditQuotData({ ...editQuotData, clientName: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Email</label>
                <input 
                  type="email"
                  className="input-field" 
                  required
                  value={editQuotData.clientEmail}
                  onChange={e => setEditQuotData({ ...editQuotData, clientEmail: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Net Amount (₹)</label>
                  <input 
                    type="number"
                    className="input-field" 
                    required
                    value={editQuotData.totalAmount}
                    onChange={e => setEditQuotData({ ...editQuotData, totalAmount: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status</label>
                  <select 
                    className="select-field"
                    value={editQuotData.status}
                    onChange={e => setEditQuotData({ ...editQuotData, status: e.target.value })}
                  >
                    <option value="SENT">SENT TO CLIENT</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Valid Until</label>
                <input 
                  type="date"
                  className="input-field" 
                  value={editQuotData.validUntil}
                  onChange={e => setEditQuotData({ ...editQuotData, validUntil: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingQuot(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Quotation Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Invoice Confirmation Modal */}
      {deletingInv && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f87171' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0 }}>
                Confirm Invoice Deletion
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete invoice <strong>{deletingInv.invoiceNumber}</strong> for <strong>{deletingInv.clientName}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingInv(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleDeleteInvoice}>
                Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Quotation Confirmation Modal */}
      {deletingQuot && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#f87171' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0 }}>
                Confirm Quotation Deletion
              </h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete quotation <strong>{deletingQuot.quotationNumber}</strong> for <strong>{deletingQuot.clientName}</strong>?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingQuot(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444' }} onClick={handleDeleteQuotation}>
                Delete Quotation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Assign Service Meeting with Employee from Accepted Quotation */}
      {assignMeetingQuot && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Calendar size={22} color="var(--brand-primary)" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', margin: 0 }}>
                  Assign Service Meeting with Employee
                </h3>
              </div>
              <span className="badge badge-approved">Quot #{assignMeetingQuot.quotationNumber}</span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Quotation has been accepted! Select a dedicated <strong>Employee</strong> to conduct the service meeting with <strong>{assignMeetingQuot.clientName}</strong>. The employee will see this meeting on their schedule.
            </p>

            <form onSubmit={handleScheduleMeetingFromQuot} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Meeting Title</label>
                <input 
                  className="input-field"
                  required
                  value={meetingForm.title}
                  onChange={e => setMeetingForm({ ...meetingForm, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Client Name</label>
                  <input 
                    className="input-field"
                    required
                    value={meetingForm.clientName}
                    onChange={e => setMeetingForm({ ...meetingForm, clientName: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <UserCheck size={14} color="var(--brand-primary)" />
                    Assign to Employee
                  </label>
                  <select 
                    className="select-field"
                    required
                    value={meetingForm.assignedToId}
                    onChange={e => setMeetingForm({ ...meetingForm, assignedToId: e.target.value })}
                  >
                    <option value="">-- Select Employee --</option>
                    {availableEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.designation || emp.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Scheduled Date & Time</label>
                  <input 
                    type="datetime-local"
                    className="input-field"
                    required
                    value={meetingForm.scheduledAt}
                    onChange={e => setMeetingForm({ ...meetingForm, scheduledAt: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Site / Meeting Address</label>
                  <input 
                    className="input-field"
                    required
                    value={meetingForm.clientAddress}
                    onChange={e => setMeetingForm({ ...meetingForm, clientAddress: e.target.value })}
                    placeholder="Client site address"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Meeting Agenda / Scope</label>
                <textarea 
                  className="input-field"
                  rows={2}
                  value={meetingForm.agenda}
                  onChange={e => setMeetingForm({ ...meetingForm, agenda: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Expected Deliverables</label>
                <input 
                  className="input-field"
                  value={meetingForm.deliverables}
                  onChange={e => setMeetingForm({ ...meetingForm, deliverables: e.target.value })}
                  placeholder="e.g. Service checklist, site audit report, sign-off sheet"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssignMeetingQuot(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>
                  <UserCheck size={16} />
                  Confirm & Assign Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
