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
  Building,
  ChevronDown,
  ChevronUp,
  X,
  MoreVertical,
  XCircle
} from 'lucide-react';

const DEFAULT_TERMS_CONFIG = {
  validity: 'one month',
  gstRate: '18% extra',
  additionalCharges: true,
  jobAccess: true,
  shutdownRequired: true,
  officeHoursOnly: true,
  electricalPower: true,
  storageSpace: true,
  tankFilled: false,
  localHazard: true,
  actualQuantityOption: 'actual_delivered_and_executed',
  completionTime: '7 working days',
  completionTimeCustom: '',
  paymentTerms: 'option_a',
  customTermsText: ''
};

function formatTermsList(configInput) {
  if (!configInput) return [];
  let config = configInput;
  if (typeof configInput === 'string') {
    try {
      config = JSON.parse(configInput);
    } catch (e) {
      return [configInput];
    }
  }
  if (!config || typeof config !== 'object') return [];

  const list = [];
  if (config.validity) {
    list.push(`Quotation is valid for ${config.validity} only.`);
  }
  if (config.gstRate) {
    list.push(`GST ${config.gstRate}.`);
  }
  if (config.additionalCharges !== false) {
    list.push(`Additional charges will be applicable for all other materials and works except that mentioned therein in the above quotation.`);
  }
  if (config.jobAccess !== false) {
    list.push(`All necessary job accesses and permission should be arranged and ensured from client end.`);
  }
  if (config.shutdownRequired !== false) {
    list.push(`Shut down of the system must be required for the job and that should be arranged from client end.`);
  }
  if (config.officeHoursOnly !== false) {
    list.push(`The job will be carried out at office hours/ day hours only.`);
  }
  if (config.electricalPower !== false) {
    list.push(`Necessary electrical power should be provided from the client end.`);
  }
  if (config.storageSpace !== false) {
    list.push(`A space should be arranged to stay/ keep tools and materials from client end.`);
  }
  if (config.tankFilled) {
    list.push(`The tank/ reservoir should be filled up from end as required for the job.`);
  }
  if (config.localHazard !== false) {
    list.push(`Local hazard (if any) should be handled/ settled by the client.`);
  }
  if (config.actualQuantityOption === 'actual_delivered_only') {
    list.push(`Invoice will be raised against actual delivered quantity.`);
  } else if (config.actualQuantityOption !== 'none') {
    list.push(`Invoice will be raised against actual delivered quantity and work executed therewith.`);
  }
  if (config.completionTime) {
    const timeText = config.completionTime === 'custom' ? (config.completionTimeCustom || 'As agreed') : config.completionTime;
    list.push(`Job completion time: ${timeText}.`);
  }
  if (config.paymentTerms === 'option_b') {
    list.push(`Payment should be made 50% as advance along with work order and the balance amount should be released in full within seven days of job completion.`);
  } else if (config.paymentTerms !== 'none') {
    list.push(`Payment should be made 40% as advance along with work order. More 30% should be released on delivery of materials at site. The balance amount should be released in full within seven days of job completion.`);
  }
  if (config.customTermsText && config.customTermsText.trim()) {
    config.customTermsText.split('\n').forEach(t => {
      if (t.trim()) list.push(t.trim());
    });
  }

  return list;
}

function renderDocumentPDFHtml(doc, type = 'QUOTATION') {
  const isInvoice = type === 'INVOICE';
  const createdDateStr = doc.createdAt ? new Date(doc.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
  const dateLabel = isInvoice ? 'Invoice Date' : 'Quotation Date';
  const secondDateLabel = isInvoice ? 'Due Date' : 'Valid Until';
  const secondDateVal = isInvoice 
    ? (doc.dueDate ? new Date(doc.dueDate).toISOString().slice(0, 10) : 'N/A')
    : (doc.validUntil ? new Date(doc.validUntil).toISOString().slice(0, 10) : 'N/A');

  let parsedItems = [];
  try {
    parsedItems = typeof doc.itemsJson === 'string' ? JSON.parse(doc.itemsJson) : (doc.itemsJson || []);
  } catch (e) {
    parsedItems = [];
  }
  if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
    parsedItems = [{ name: 'Equipment Supply & Technical Service', qty: 1, unitPrice: doc.totalAmount, total: doc.totalAmount }];
  }

  const termsList = formatTermsList(doc.termsAndConditions);
  const docHead = doc.documentHead || (isInvoice ? 'TAX INVOICE' : 'QUOTATION / PROPOSAL');
  const refNo = doc.quotationNumber || doc.invoiceNumber || 'N/A';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${docHead}_${refNo.replace(/\//g, '_')}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 36px;
          color: #0f172a;
          background: #ffffff;
        }
        .header-letterhead {
          text-align: center;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 10px;
          margin-bottom: 12px;
        }
        .company-name {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .company-tagline {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          margin-top: 3px;
        }
        .company-contact {
          font-size: 11px;
          color: #64748b;
          margin-top: 3px;
        }
        .reg-bar {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 11px;
          color: #334155;
          margin-bottom: 20px;
          line-height: 1.6;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
        }
        .doc-title-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 12px;
        }
        .doc-head-title {
          font-size: 22px;
          font-weight: 800;
          color: #1e3a8a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .doc-ref-badge {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          font-size: 13px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 6px;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 14px 16px;
        }
        .box-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .box-name {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
        }
        .box-detail {
          font-size: 12.5px;
          color: #475569;
          margin-top: 3px;
        }
        .subject-box {
          background: #eff6ff;
          border-left: 4px solid #2563eb;
          padding: 10px 14px;
          margin-bottom: 18px;
          border-radius: 4px;
        }
        .preface-box {
          font-size: 13px;
          color: #334155;
          font-style: italic;
          margin-bottom: 18px;
          line-height: 1.6;
          background: #f9fafb;
          padding: 12px;
          border-radius: 6px;
          border: 1px dashed #d1d5db;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background: #0f172a;
          color: #ffffff;
          font-size: 11.5px;
          text-transform: uppercase;
          font-weight: 700;
          padding: 10px 14px;
          text-align: left;
        }
        td {
          padding: 12px 14px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
          color: #334155;
        }
        .text-right { text-align: right; }
        .totals-table {
          width: 320px;
          margin-left: auto;
          margin-bottom: 24px;
        }
        .totals-table td {
          padding: 6px 14px;
          border-bottom: none;
        }
        .grand-total {
          font-size: 15px;
          font-weight: 800;
          color: #1e40af;
          border-top: 2px solid #cbd5e1;
          border-bottom: 2px solid #cbd5e1 !important;
          background: #eff6ff;
        }
        .terms-section {
          margin-top: 24px;
          border-top: 1.5px solid #e2e8f0;
          padding-top: 14px;
        }
        .terms-title {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .terms-list {
          margin: 0;
          padding-left: 18px;
          font-size: 11.5px;
          color: #334155;
          line-height: 1.65;
        }
        .signature-block {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .sig-box { text-align: center; }
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

      <!-- Letterhead Header -->
      <div class="header-letterhead">
        <div class="company-name">AKASH ENGINEERING</div>
        <div class="company-tagline">Engineers, Contractors & General Order Suppliers</div>
        <div class="company-contact">Regd. Office: Kolkata, West Bengal | Phone: +91 98300 00000 | Email: info@akashengineering.in</div>
      </div>

      <!-- Registration Bar -->
      <div class="reg-bar">
        <div><strong>GSTIN NO.:</strong> 19AIYPH5363D1ZU &nbsp;|&nbsp; <strong>PAN NO.:</strong> AIYPH5363D &nbsp;|&nbsp; <strong>MSME REG.:</strong> UDYAM-WB-18-0005364</div>
        <div><strong>ESI CODE:</strong> 41000559200000606 &nbsp;|&nbsp; <strong>EPF CODE:</strong> WBCAL1559618000</div>
      </div>

      <!-- Document Title & Ref -->
      <div class="doc-title-bar">
        <div class="doc-head-title">${docHead}</div>
        <div class="doc-ref-badge">Ref No: ${refNo}</div>
      </div>

      <!-- Grid Details -->
      <div class="grid-2">
        <div class="box">
          <div class="box-title">CUSTOMER DETAILS (BILL TO)</div>
          <div class="box-name">${doc.clientName || 'Valued Client'}</div>
          ${doc.clientAddress ? `<div class="box-detail"><strong>Address:</strong> ${doc.clientAddress}</div>` : ''}
          <div class="box-detail"><strong>Email:</strong> ${doc.clientEmail || 'N/A'} ${doc.clientPhone ? `| <strong>Phone:</strong> ${doc.clientPhone}` : ''}</div>
          ${doc.clientGst ? `<div class="box-detail"><strong>Customer GSTIN:</strong> ${doc.clientGst}</div>` : ''}
          ${doc.clientPan ? `<div class="box-detail"><strong>Customer PAN:</strong> ${doc.clientPan}</div>` : ''}
        </div>
        <div class="box">
          <div class="box-title">DOCUMENT SUMMARY</div>
          <div class="box-detail"><strong>${dateLabel}:</strong> ${createdDateStr}</div>
          <div class="box-detail"><strong>${secondDateLabel}:</strong> ${secondDateVal}</div>
          ${doc.kindAttention ? `<div class="box-detail"><strong>Kind Attention:</strong> ${doc.kindAttention}</div>` : ''}
          <div class="box-detail"><strong>Status:</strong> ${doc.status || 'ACTIVE'}</div>
        </div>
      </div>

      <!-- Subject -->
      ${doc.subject ? `
        <div class="subject-box">
          <strong style="color: #1e40af; font-size: 12.5px;">Subject:</strong>
          <span style="font-size: 13.5px; font-weight: 700; color: #0f172a; margin-left: 6px;">${doc.subject}</span>
        </div>
      ` : ''}

      <!-- Preface -->
      ${doc.preface ? `
        <div class="preface-box">
          ${doc.preface}
        </div>
      ` : ''}

      <!-- Items Table -->
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
              <td class="text-right">₹${Number(item.total || (item.qty * item.unitPrice))?.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Totals -->
      <table class="totals-table">
        <tr>
          <td>Subtotal:</td>
          <td class="text-right">₹${(doc.totalAmount || 0).toLocaleString()}</td>
        </tr>
        <tr>
          <td>GST Amount:</td>
          <td class="text-right">₹${(doc.gstAmount || Math.round((doc.totalAmount || 0) * 0.18)).toLocaleString()}</td>
        </tr>
        <tr class="grand-total">
          <td>Grand Total:</td>
          <td class="text-right">₹${(doc.grandTotal || (doc.totalAmount + Math.round((doc.totalAmount || 0) * 0.18))).toLocaleString()}</td>
        </tr>
      </table>

      <!-- Terms & Conditions -->
      ${termsList.length > 0 ? `
        <div class="terms-section">
          <div class="terms-title">Terms & Conditions:</div>
          <ol class="terms-list">
            ${termsList.map(t => `<li>${t}</li>`).join('')}
          </ol>
        </div>
      ` : ''}

      <!-- Signatures -->
      <div class="signature-block">
        <div class="sig-box">
          <div style="font-size: 12px; color: #64748b; margin-bottom: 45px;">Client's Acceptance & Confirmation Stamp</div>
          <div class="sig-line">Accepted & Confirmed</div>
        </div>
        <div class="sig-box">
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 45px;">For AKASH ENGINEERING</div>
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
}

export default function BillingQuotations({ data = {}, currentRole, currentUser, onRefresh, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab || 'invoices'); // 'invoices' | 'quotations'
  const [showInvModal, setShowInvModal] = useState(false);
  const [showQuotModal, setShowQuotModal] = useState(false);
  const [showTermsAccordion, setShowTermsAccordion] = useState(true);

  // Edit / Delete state for Invoices & Quotations
  const [editingInv, setEditingInv] = useState(null);
  const [deletingInv, setDeletingInv] = useState(null);
  const [editingQuot, setEditingQuot] = useState(null);
  const [deletingQuot, setDeletingQuot] = useState(null);

  // Flow State: Quotation Acceptance & Meeting Assignment
  const [openQuotMenuId, setOpenQuotMenuId] = useState(null);
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

  const isClient = currentRole === 'CLIENT' || currentUser?.role === 'CLIENT';

  const fetchBillingData = useCallback(async () => {
    try {
      const quotUrl = (isClient && currentUser)
        ? `/api/billing/quotations?clientId=${currentUser.id}&clientEmail=${encodeURIComponent(currentUser.email || '')}`
        : '/api/billing/quotations';

      const [invRes, quotRes, usrRes, prodRes] = await Promise.allSettled([
        fetch('/api/billing/invoices').then(r => r.json()),
        fetch(quotUrl).then(r => r.json()),
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
  }, [isClient, currentUser]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  // Derived Client and Employee Lists
  const registeredClients = users.filter(u => u.role === 'CLIENT' || u.role === 'USER');
  const availableEmployees = users.filter(u => u.role === 'EMPLOYEE' || u.role === 'SERVICE_PERSONNEL' || u.role === 'FACILITY_MANAGER');

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

  // New Invoice Form State
  const [newInv, setNewInv] = useState({
    invoiceNumber: `AKASH/INV/25-26/${327 + invoices.length}`,
    documentHead: 'TAX INVOICE',
    subject: '',
    kindAttention: '',
    clientId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    clientGst: '',
    clientPan: '',
    preface: '',
    termsConfig: { ...DEFAULT_TERMS_CONFIG },
    totalAmount: 45000,
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
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
    quotationNumber: `AKASH/QTN/25-26/${327 + quotations.length}`,
    documentHead: 'QUOTATION / PROPOSAL',
    subject: '',
    kindAttention: '',
    clientId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    clientGst: '',
    clientPan: '',
    preface: '',
    termsConfig: { ...DEFAULT_TERMS_CONFIG },
    totalAmount: 60000
  });

  // Edit Quotation Form State
  const [editQuotData, setEditQuotData] = useState({
    documentHead: 'QUOTATION / PROPOSAL',
    subject: '',
    kindAttention: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    clientGst: '',
    clientPan: '',
    preface: '',
    totalAmount: 60000,
    validUntil: '',
    status: 'SENT'
  });

  // Handle client selection when creating quotation/invoice
  const handleClientSelect = (clientId, isInvoice = false) => {
    if (!clientId) {
      if (isInvoice) {
        setNewInv(prev => ({ ...prev, clientId: '', clientName: '', clientEmail: '', clientPhone: '', clientAddress: '', clientGst: '', clientPan: '' }));
      } else {
        setNewQuot(prev => ({ ...prev, clientId: '', clientName: '', clientEmail: '', clientPhone: '', clientAddress: '', clientGst: '', clientPan: '' }));
      }
      return;
    }
    const found = registeredClients.find(c => c.id === clientId);
    if (found) {
      const updatedFields = {
        clientId: found.id,
        clientName: found.name,
        clientEmail: found.email || '',
        clientPhone: found.phone || '',
        clientAddress: found.address || '',
        clientGst: found.panCard ? '' : '',
        clientPan: found.panCard || ''
      };
      if (isInvoice) {
        setNewInv(prev => ({ ...prev, ...updatedFields }));
      } else {
        setNewQuot(prev => ({ ...prev, ...updatedFields }));
      }
    }
  };

  // Handle Client Accepting Quotation
  const handleAcceptQuotation = async (quot) => {
    try {
      const res = await fetch(`/api/billing/quotations/${quot.id}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptedBy: currentUser?.name || 'Client Representative' })
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccessMsg(`Quotation #${quot.quotationNumber} accepted successfully! Bill will now be generated by Super Admin.`);
        setTimeout(() => setActionSuccessMsg(''), 7000);
        fetchBillingData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Client / Super Admin Rejecting Quotation
  const handleRejectQuotation = async (quot) => {
    try {
      const res = await fetch(`/api/billing/quotations/${quot.id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectedBy: currentUser?.name || 'Client Representative' })
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccessMsg(`Quotation #${quot.quotationNumber} marked as REJECTED.`);
        setTimeout(() => setActionSuccessMsg(''), 7000);
        fetchBillingData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Super Admin Generates Bill (Tax Invoice) from Accepted Quotation
  const handleGenerateBill = async (quot) => {
    try {
      const nextInvNo = `AKASH/INV/25-26/${327 + invoices.length}`;
      const res = await fetch(`/api/billing/quotations/${quot.id}/generate-bill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatedBy: currentUser?.name || 'Superadmin', invoiceNumber: nextInvNo })
      });
      const json = await res.json();
      if (json.success) {
        setActionSuccessMsg(`Tax Invoice #${json.invoice?.invoiceNumber || ''} generated by Super Admin for Quotation #${quot.quotationNumber}! Product quantities deducted from total inventory stock.`);
        setTimeout(() => setActionSuccessMsg(''), 7000);
        fetchBillingData();
        if (onRefresh) onRefresh();
      } else {
        alert(json.message || 'Failed to generate bill');
      }
    } catch (err) {
      console.error('Error generating bill:', err);
    }
  };

  const openAssignMeetingModal = (quot) => {
    setAssignMeetingQuot(quot);
    setMeetingForm({
      title: `Service Kickoff: ${quot.subject || quot.quotationNumber}`,
      clientName: quot.clientName || '',
      clientAddress: quot.clientAddress || 'Client Site Location',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      assignedToId: availableEmployees[0]?.id || '',
      agenda: `Service kickoff and installation for accepted Quotation #${quot.quotationNumber} (₹${quot.grandTotal?.toLocaleString() || quot.totalAmount?.toLocaleString()})`,
      deliverables: 'Service checklist, site audit report, client sign-off'
    });
  };

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

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newInv,
          termsAndConditions: JSON.stringify(newInv.termsConfig)
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowInvModal(false);
        setNewInv({
          invoiceNumber: `AKASH/INV/25-26/${327 + invoices.length + 1}`,
          documentHead: 'TAX INVOICE',
          subject: '',
          kindAttention: '',
          clientId: '',
          clientName: '',
          clientEmail: '',
          clientPhone: '',
          clientAddress: '',
          clientGst: '',
          clientPan: '',
          preface: '',
          termsConfig: { ...DEFAULT_TERMS_CONFIG },
          totalAmount: 45000,
          dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
        });
        fetchBillingData();
        if (onRefresh) onRefresh();
      } else {
        alert(json.message || 'Error creating invoice');
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
        quotationNumber: newQuot.quotationNumber || `AKASH/QTN/25-26/${327 + quotations.length}`,
        documentHead: newQuot.documentHead,
        subject: newQuot.subject,
        kindAttention: newQuot.kindAttention,
        clientId: newQuot.clientId || null,
        clientName: newQuot.clientName,
        clientEmail: newQuot.clientEmail,
        clientPhone: newQuot.clientPhone,
        clientAddress: newQuot.clientAddress,
        clientGst: newQuot.clientGst,
        clientPan: newQuot.clientPan,
        preface: newQuot.preface,
        termsAndConditions: JSON.stringify(newQuot.termsConfig),
        totalAmount: subtotal,
        gstAmount: Math.round(subtotal * (newQuot.termsConfig.gstRate.includes('28') ? 0.28 : 0.18)),
        grandTotal: subtotal + Math.round(subtotal * (newQuot.termsConfig.gstRate.includes('28') ? 0.28 : 0.18)),
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
        setNewQuot({
          quotationNumber: `AKASH/QTN/25-26/${327 + quotations.length + 1}`,
          documentHead: 'QUOTATION / PROPOSAL',
          subject: '',
          kindAttention: '',
          clientId: '',
          clientName: '',
          clientEmail: '',
          clientPhone: '',
          clientAddress: '',
          clientGst: '',
          clientPan: '',
          preface: '',
          termsConfig: { ...DEFAULT_TERMS_CONFIG },
          totalAmount: 0
        });
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
    const printWindow = window.open('', '_blank', 'width=900,height=1150');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups to print/download the PDF.');
      return;
    }
    const htmlContent = renderDocumentPDFHtml(q, 'QUOTATION');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handlePrintInvPDF = (inv) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1150');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups to print/download the PDF.');
      return;
    }
    const htmlContent = renderDocumentPDFHtml(inv, 'INVOICE');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Helper render component for Terms & Conditions Checkbox Panel
  const renderTermsPanel = (termsConfig, setTermsConfig) => (
    <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '1rem', marginTop: '0.5rem' }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '0.75rem' }}
        onClick={() => setShowTermsAccordion(!showTermsAccordion)}
      >
        <strong style={{ fontSize: '0.88rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          📋 Terms & Conditions Configurator (Akash Engineering Terms)
        </strong>
        {showTermsAccordion ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {showTermsAccordion && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem', color: '#334155' }}>

          {/* 1. Validity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 600, minWidth: 160 }}>1. Quotation Validity:</span>
            <select
              className="select-field"
              style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.82rem' }}
              value={termsConfig.validity}
              onChange={e => setTermsConfig({ ...termsConfig, validity: e.target.value })}
            >
              <option value="ten days">ten days</option>
              <option value="fifteen days">fifteen days</option>
              <option value="one month">one month</option>
              <option value="two months">two months</option>
              <option value="three months">three months</option>
            </select>
          </div>

          {/* 2. GST */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 600, minWidth: 160 }}>2. GST Rate:</span>
            <select
              className="select-field"
              style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.82rem' }}
              value={termsConfig.gstRate}
              onChange={e => setTermsConfig({ ...termsConfig, gstRate: e.target.value })}
            >
              <option value="18% extra">18% extra</option>
              <option value="28% extra">28% extra</option>
            </select>
          </div>

          {/* Standard Checkboxes 3-10 */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={termsConfig.additionalCharges}
              onChange={e => setTermsConfig({ ...termsConfig, additionalCharges: e.target.checked })}
            />
            <span>3. Additional charges will be applicable for all other materials and works except mentioned above.</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={termsConfig.jobAccess}
              onChange={e => setTermsConfig({ ...termsConfig, jobAccess: e.target.checked })}
            />
            <span>4. All necessary job accesses and permission should be arranged and ensured from client end.</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={termsConfig.shutdownRequired}
              onChange={e => setTermsConfig({ ...termsConfig, shutdownRequired: e.target.checked })}
            />
            <span>5. Shut down of the system must be required for the job and arranged from client end.</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={termsConfig.officeHoursOnly}
              onChange={e => setTermsConfig({ ...termsConfig, officeHoursOnly: e.target.checked })}
            />
            <span>6. The job will be carried out at office hours / day hours only.</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={termsConfig.electricalPower}
              onChange={e => setTermsConfig({ ...termsConfig, electricalPower: e.target.checked })}
            />
            <span>7. Necessary electrical power should be provided from the client end.</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={termsConfig.storageSpace}
              onChange={e => setTermsConfig({ ...termsConfig, storageSpace: e.target.checked })}
            />
            <span>8. A space should be arranged to stay / keep tools and materials from client end.</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={termsConfig.tankFilled}
              onChange={e => setTermsConfig({ ...termsConfig, tankFilled: e.target.checked })}
            />
            <span>9. The tank / reservoir should be filled up from client end as required for the job.</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={termsConfig.localHazard}
              onChange={e => setTermsConfig({ ...termsConfig, localHazard: e.target.checked })}
            />
            <span>10. Local hazard (if any) should be handled / settled by the client.</span>
          </label>

          {/* 11 & 12. Actual Delivered Option */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
            <span style={{ fontWeight: 600, minWidth: 160 }}>11/12. Invoice Basis:</span>
            <select
              className="select-field"
              style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.82rem' }}
              value={termsConfig.actualQuantityOption}
              onChange={e => setTermsConfig({ ...termsConfig, actualQuantityOption: e.target.value })}
            >
              <option value="actual_delivered_and_executed">Invoice raised against actual delivered quantity and work executed therewith</option>
              <option value="actual_delivered_only">Invoice raised against actual delivered quantity</option>
            </select>
          </div>

          {/* 13. Completion Time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 600, minWidth: 160 }}>13. Job Completion Time:</span>
            <select
              className="select-field"
              style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.82rem' }}
              value={termsConfig.completionTime}
              onChange={e => setTermsConfig({ ...termsConfig, completionTime: e.target.value })}
            >
              <option value="7 working days">7 working days</option>
              <option value="10 working days">10 working days</option>
              <option value="15 working days">15 working days</option>
              <option value="custom">Custom Input Manually</option>
            </select>
            {termsConfig.completionTime === 'custom' && (
              <input
                className="input-field"
                style={{ width: 180, padding: '0.3rem 0.6rem', fontSize: '0.82rem' }}
                placeholder="e.g. 20 working days"
                value={termsConfig.completionTimeCustom}
                onChange={e => setTermsConfig({ ...termsConfig, completionTimeCustom: e.target.value })}
              />
            )}
          </div>

          {/* 14. Payment Terms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.2rem' }}>
            <span style={{ fontWeight: 600 }}>14. Payment Terms:</span>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="paymentTerms"
                checked={termsConfig.paymentTerms === 'option_a'}
                onChange={() => setTermsConfig({ ...termsConfig, paymentTerms: 'option_a' })}
              />
              <span>a) 40% advance along with work order. 30% on delivery of materials at site. Balance within 7 days of completion.</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="radio"
                name="paymentTerms"
                checked={termsConfig.paymentTerms === 'option_b'}
                onChange={() => setTermsConfig({ ...termsConfig, paymentTerms: 'option_b' })}
              />
              <span>b) 50% advance along with work order and balance released in full within 7 days of completion.</span>
            </label>
          </div>

          {/* Additional Custom Terms */}
          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>Additional Terms & Conditions (One per line):</label>
            <textarea
              className="input-field"
              rows={2}
              style={{ fontSize: '0.82rem' }}
              placeholder="Insert any other custom terms & conditions..."
              value={termsConfig.customTermsText}
              onChange={e => setTermsConfig({ ...termsConfig, customTermsText: e.target.value })}
            />
          </div>

        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Action Notification Message */}
      {actionSuccessMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '0.75rem 1rem', borderRadius: '8px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} />
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{actionSuccessMsg}</span>
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

        {!isClient && (
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
        )}
      </div>

      {/* TAB 1: Invoices */}
      {activeTab === 'invoices' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
              Automated Billing Ledger & Payment Reminders
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Akash Engineering GST & Proforma Invoice System
            </span>
          </div>

          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="custom-table" style={{ width: '100%', minWidth: '950px' }}>
              <thead>
                <tr>
                  <th style={{ whiteSpace: 'nowrap', minWidth: '170px' }}>Invoice No</th>
                  <th style={{ minWidth: '180px' }}>Client Details</th>
                  <th style={{ minWidth: '200px' }}>Subject & Head</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Total Amount</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Paid Amount</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Balance Due</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Due Date</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ whiteSpace: 'nowrap', minWidth: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-yellow)', fontSize: '0.85rem' }}>
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{inv.clientName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.clientEmail}</div>
                      {inv.clientGst && <div style={{ fontSize: '0.7rem', color: '#64748b' }}>GST: {inv.clientGst}</div>}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{inv.subject || 'Equipment Supply'}</div>
                      <span style={{ fontSize: '0.68rem', background: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700, display: 'inline-block', whiteSpace: 'nowrap', marginTop: '0.2rem' }}>
                        {inv.documentHead || 'TAX INVOICE'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>₹{inv.totalAmount.toLocaleString()}</td>
                    <td style={{ color: 'var(--brand-green)', whiteSpace: 'nowrap' }}>₹{inv.paidAmount.toLocaleString()}</td>
                    <td style={{ whiteSpace: 'nowrap' }}><strong style={{ color: inv.balanceAmount > 0 ? 'var(--brand-red)' : 'var(--text-primary)' }}>₹{inv.balanceAmount.toLocaleString()}</strong></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{typeof inv.dueDate === 'string' ? inv.dueDate.slice(0, 10) : new Date(inv.dueDate).toISOString().slice(0, 10)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {inv.status === 'PAID' && <span className="badge badge-approved">PAID</span>}
                      {inv.status === 'PARTIAL' && <span className="badge badge-pending">PARTIAL</span>}
                      {inv.status === 'OVERDUE' && <span className="badge badge-rejected">OVERDUE</span>}
                      {inv.status === 'UNPAID' && <span className="badge badge-pending">UNPAID</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.55rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          title="Download / Print Invoice PDF"
                          onClick={() => handlePrintInvPDF(inv)}
                        >
                          <Download size={14} color="var(--brand-primary)" />
                          PDF
                        </button>
                        {!isClient && (
                          <>
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
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Quotations */}
      {activeTab === 'quotations' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: 700 }}>
              Client Quotation Management & Approval Track
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Akash Engineering Quotation & Proforma System
            </span>
          </div>

          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="custom-table" style={{ width: '100%', minWidth: '1050px' }}>
              <thead>
                <tr>
                  <th style={{ whiteSpace: 'nowrap', minWidth: '180px' }}>Quotation No</th>
                  <th style={{ minWidth: '180px' }}>Client Name & Details</th>
                  <th style={{ minWidth: '200px' }}>Subject & Head</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Net Amount</th>
                  <th style={{ whiteSpace: 'nowrap' }}>GST Amount</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Grand Total</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Valid Until</th>
                  <th style={{ whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ whiteSpace: 'nowrap', minWidth: '220px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedQuotations.map(q => (
                  <tr key={q.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-yellow)', fontSize: '0.85rem' }}>
                        {q.quotationNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{q.clientName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{q.clientEmail}</div>
                      {q.kindAttention && <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 600 }}>Attn: {q.kindAttention}</div>}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{q.subject || 'Supply & Works'}</div>
                      <span style={{ fontSize: '0.68rem', background: '#fef3c7', color: '#b45309', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700, display: 'inline-block', whiteSpace: 'nowrap', marginTop: '0.2rem' }}>
                        {q.documentHead || 'QUOTATION / PROPOSAL'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>₹{q.totalAmount.toLocaleString()}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>₹{q.gstAmount.toLocaleString()}</td>
                    <td style={{ whiteSpace: 'nowrap' }}><strong style={{ color: 'var(--brand-gold)' }}>₹{q.grandTotal.toLocaleString()}</strong></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{typeof q.validUntil === 'string' ? q.validUntil.slice(0, 10) : new Date(q.validUntil).toISOString().slice(0, 10)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {(q.status === 'BILLED' || q.status === 'APPROVED') && <span className="badge badge-approved">BILLED & INVOICED</span>}
                      {q.status === 'ACCEPTED' && (
                        <span className="badge badge-pending" style={{ background: 'rgba(59, 130, 246, 0.18)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                          ACCEPTED BY CLIENT
                        </span>
                      )}
                      {q.status === 'SENT' && <span className="badge badge-scheduled">SENT TO CLIENT</span>}
                      {q.status === 'REJECTED' && <span className="badge badge-rejected">REJECTED</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          title="Download / Print Quotation PDF"
                          onClick={() => handlePrintQuotPDF(q)}
                        >
                          <Download size={14} color="var(--brand-yellow)" />
                          PDF
                        </button>

                        {/* Triple-Dot Action Dropdown Menu */}
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <button
                            className="btn btn-secondary"
                            style={{
                              padding: '0.35rem 0.55rem',
                              fontSize: '0.75rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              borderColor: openQuotMenuId === q.id ? '#2563eb' : 'rgba(148, 163, 184, 0.4)',
                              background: openQuotMenuId === q.id ? '#eff6ff' : 'transparent'
                            }}
                            title="Quotation Actions"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenQuotMenuId(openQuotMenuId === q.id ? null : q.id);
                            }}
                          >
                            <MoreVertical size={15} color="#475569" />
                          </button>

                          {openQuotMenuId === q.id && (
                            <div
                              style={{
                                position: 'absolute',
                                right: 0,
                                top: 'calc(100% + 4px)',
                                background: '#ffffff',
                                border: '1px solid #cbd5e1',
                                borderRadius: '10px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)',
                                zIndex: 9999,
                                minWidth: '185px',
                                padding: '0.35rem 0',
                                display: 'flex',
                                flexDirection: 'column'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {(q.status === 'SENT' || q.status === 'DRAFT' || q.status === 'REJECTED') && (
                                <>
                                  <button
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      padding: '0.55rem 0.85rem',
                                      fontSize: '0.78rem',
                                      fontWeight: 600,
                                      color: '#059669',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      cursor: 'pointer',
                                      width: '100%',
                                      textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdf4'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    onClick={() => {
                                      setOpenQuotMenuId(null);
                                      handleAcceptQuotation(q);
                                    }}
                                  >
                                    <Check size={15} color="#059669" />
                                    Accept Quotation
                                  </button>

                                  <button
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      padding: '0.55rem 0.85rem',
                                      fontSize: '0.78rem',
                                      fontWeight: 600,
                                      color: '#dc2626',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      cursor: 'pointer',
                                      width: '100%',
                                      textAlign: 'left'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    onClick={() => {
                                      setOpenQuotMenuId(null);
                                      handleRejectQuotation(q);
                                    }}
                                  >
                                    <XCircle size={15} color="#dc2626" />
                                    Reject Quotation
                                  </button>
                                </>
                              )}

                              {/* Option 3: Generate Bill / Invoice (Shown when Quotation is Accepted) */}
                              {!isClient && (q.status === 'ACCEPTED' || q.status === 'APPROVED') && q.status !== 'BILLED' && (
                                <button
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    padding: '0.55rem 0.85rem',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    color: '#2563eb',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    width: '100%',
                                    textAlign: 'left'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#eff6ff'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                  onClick={() => {
                                    setOpenQuotMenuId(null);
                                    handleGenerateBill(q);
                                  }}
                                >
                                  <DollarSign size={15} color="#2563eb" />
                                  Generate Bill (Invoice)
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {!isClient && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                            title="Delete Quotation"
                            onClick={() => setDeletingQuot(q)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

      {/* Modal 1: Generate Tax / Proforma Invoice */}
      {showInvModal && (
        <div className="modal-overlay" onClick={() => setShowInvModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1.5rem' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', color: '#0f172a', borderRadius: '16px', width: '100%', maxWidth: '750px', maxHeight: 'calc(100vh - 2.5rem)', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', border: '1px solid #e2e8f0', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  AKASH ENGINEERING - Issue Invoice
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>GSTIN: 19AIYPH5363D1ZU | PAN: AIYPH5363D</span>
              </div>
              <button type="button" onClick={() => setShowInvModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Row 1: Document Head & Invoice Number */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Issue Under Head (Document Type)</label>
                  <select
                    className="select-field"
                    value={newInv.documentHead}
                    onChange={e => setNewInv({ ...newInv, documentHead: e.target.value })}
                  >
                    <option value="TAX INVOICE">1) TAX INVOICE</option>
                    <option value="PROFORMA INVOICE">2) PROFORMA INVOICE</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Invoice Reference No.*</label>
                  <input
                    className="input-field"
                    required
                    value={newInv.invoiceNumber}
                    onChange={e => setNewInv({ ...newInv, invoiceNumber: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 2: Kind Attention & Subject */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Kind Attention</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Mr. Arnab Tal / Purchase Manager"
                    value={newInv.kindAttention}
                    onChange={e => setNewInv({ ...newInv, kindAttention: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Subject*</label>
                  <input
                    className="input-field"
                    required
                    placeholder="e.g. Supply & Installation of Electrical Motor"
                    value={newInv.subject}
                    onChange={e => setNewInv({ ...newInv, subject: e.target.value })}
                  />
                </div>
              </div>

              {/* Client Selector & Info */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Select Registered Client (Optional)</label>
                <select
                  className="select-field"
                  onChange={e => handleClientSelect(e.target.value, true)}
                >
                  <option value="">-- Choose Registered Client (or enter manually below) --</option>
                  {registeredClients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Client Name*</label>
                  <input
                    className="input-field"
                    required
                    value={newInv.clientName}
                    onChange={e => setNewInv({ ...newInv, clientName: e.target.value })}
                    placeholder="Client Organization Name"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Client Email*</label>
                  <input
                    type="email"
                    className="input-field"
                    required
                    value={newInv.clientEmail}
                    onChange={e => setNewInv({ ...newInv, clientEmail: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Customer GSTIN</label>
                  <input
                    className="input-field"
                    placeholder="19XXXXX1234X1ZX"
                    value={newInv.clientGst}
                    onChange={e => setNewInv({ ...newInv, clientGst: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Customer PAN</label>
                  <input
                    className="input-field"
                    placeholder="ABCDE1234F"
                    value={newInv.clientPan}
                    onChange={e => setNewInv({ ...newInv, clientPan: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Client Phone</label>
                  <input
                    className="input-field"
                    placeholder="+91 9876543210"
                    value={newInv.clientPhone}
                    onChange={e => setNewInv({ ...newInv, clientPhone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Client Billing Address</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={newInv.clientAddress}
                  onChange={e => setNewInv({ ...newInv, clientAddress: e.target.value })}
                  placeholder="Full office or site delivery address"
                />
              </div>

              {/* Amount & Due Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Invoice Total Amount (₹)*</label>
                  <input
                    type="number"
                    className="input-field"
                    required
                    value={newInv.totalAmount}
                    onChange={e => setNewInv({ ...newInv, totalAmount: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Payment Due Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={newInv.dueDate}
                    onChange={e => setNewInv({ ...newInv, dueDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Preface Option */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Preface Text (Optional)</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={newInv.preface}
                  onChange={e => setNewInv({ ...newInv, preface: e.target.value })}
                  placeholder="Insert optional preface text before line items..."
                />
              </div>

              {/* Terms Panel */}
              {renderTermsPanel(newInv.termsConfig, (updated) => setNewInv({ ...newInv, termsConfig: updated }))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowInvModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Official Quotation / Proforma */}
      {showQuotModal && (
        <div className="modal-overlay" onClick={() => setShowQuotModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '1.5rem' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#ffffff', color: '#0f172a', borderRadius: '16px', width: '100%', maxWidth: '780px', maxHeight: 'calc(100vh - 2.5rem)', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', border: '1px solid #e2e8f0', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  AKASH ENGINEERING - Create Official Quotation
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>GSTIN: 19AIYPH5363D1ZU | PAN: AIYPH5363D</span>
              </div>
              <button type="button" onClick={() => setShowQuotModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Row 1: Document Head & Quotation Number */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Issue Under Head (Document Type)</label>
                  <select
                    className="select-field"
                    value={newQuot.documentHead}
                    onChange={e => setNewQuot({ ...newQuot, documentHead: e.target.value })}
                  >
                    <option value="QUOTATION / PROPOSAL">1) QUOTATION / PROPOSAL</option>
                    <option value="PROFORMA INVOICE">2) PROFORMA INVOICE</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Quotation Reference No.*</label>
                  <input
                    className="input-field"
                    required
                    value={newQuot.quotationNumber}
                    onChange={e => setNewQuot({ ...newQuot, quotationNumber: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 2: Kind Attention & Subject */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Kind Attention</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Mr. Arnab Tal / Purchase Manager"
                    value={newQuot.kindAttention}
                    onChange={e => setNewQuot({ ...newQuot, kindAttention: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Subject*</label>
                  <input
                    className="input-field"
                    required
                    placeholder="e.g. Supply & Installation of Electrical Motor"
                    value={newQuot.subject}
                    onChange={e => setNewQuot({ ...newQuot, subject: e.target.value })}
                  />
                </div>
              </div>

              {/* Client Selection & Customer Details */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Select Registered Client (Optional)</label>
                <select
                  className="select-field"
                  onChange={e => handleClientSelect(e.target.value, false)}
                >
                  <option value="">-- Choose Registered Client (or enter manually below) --</option>
                  {registeredClients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Client Name*</label>
                  <input
                    className="input-field"
                    required
                    value={newQuot.clientName}
                    onChange={e => setNewQuot({ ...newQuot, clientName: e.target.value })}
                    placeholder="Client Organization Name"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Client Contact Email*</label>
                  <input
                    type="email"
                    className="input-field"
                    required
                    value={newQuot.clientEmail}
                    onChange={e => setNewQuot({ ...newQuot, clientEmail: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Customer GSTIN</label>
                  <input
                    className="input-field"
                    placeholder="19AIYPH5363D1ZU"
                    value={newQuot.clientGst}
                    onChange={e => setNewQuot({ ...newQuot, clientGst: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Customer PAN</label>
                  <input
                    className="input-field"
                    placeholder="AIYPH5363D"
                    value={newQuot.clientPan}
                    onChange={e => setNewQuot({ ...newQuot, clientPan: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Client Phone</label>
                  <input
                    className="input-field"
                    placeholder="+91 98300 00000"
                    value={newQuot.clientPhone}
                    onChange={e => setNewQuot({ ...newQuot, clientPhone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Client Address</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={newQuot.clientAddress}
                  onChange={e => setNewQuot({ ...newQuot, clientAddress: e.target.value })}
                  placeholder="Full office / site delivery address"
                />
              </div>

              {/* Preface Option */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>Preface Text (Optional Manual Preface)</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={newQuot.preface}
                  onChange={e => setNewQuot({ ...newQuot, preface: e.target.value })}
                  placeholder="Insert manual preface text to appear before the item table..."
                />
              </div>

              {/* Product Line Items & Quantities Selection */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.85rem', marginTop: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Briefcase size={15} color="#d97706" />
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
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem', display: 'block' }}>Select Inventory Product</label>
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

                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem', display: 'block' }}>Item Name</label>
                        <input
                          className="input-field"
                          style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                          placeholder="Product / Service Description"
                          value={item.name}
                          onChange={e => handleQuotItemChange(index, 'name', e.target.value)}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem', display: 'block' }}>Quantity (Qty)</label>
                        <input
                          type="number"
                          min="1"
                          className="input-field"
                          style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                          value={item.qty}
                          onChange={e => handleQuotItemChange(index, 'qty', e.target.value)}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem', display: 'block' }}>Unit Price (₹)</label>
                        <input
                          type="number"
                          className="input-field"
                          style={{ padding: '0.45rem 0.6rem', fontSize: '0.82rem' }}
                          value={item.unitPrice}
                          onChange={e => handleQuotItemChange(index, 'unitPrice', e.target.value)}
                        />
                      </div>

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
                  <span>GST ({newQuot.termsConfig.gstRate}):</span>
                  <span style={{ color: '#d97706', fontWeight: 700 }}>+ ₹{Math.round(quotSubtotal * (newQuot.termsConfig.gstRate.includes('28') ? 0.28 : 0.18)).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem', marginTop: '0.2rem', color: '#0f172a' }}>
                  <span>Grand Total Payable:</span>
                  <span style={{ color: '#059669', fontSize: '1.1rem' }}>
                    ₹{(quotSubtotal + Math.round(quotSubtotal * (newQuot.termsConfig.gstRate.includes('28') ? 0.28 : 0.18))).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Terms Panel */}
              {renderTermsPanel(newQuot.termsConfig, (updated) => setNewQuot({ ...newQuot, termsConfig: updated }))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuotModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Send Quotation</button>
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
