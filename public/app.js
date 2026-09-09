// ===== CONFIG =====
const API_URL = 'http://localhost:3002/api';

// Get license key from localStorage or use Pak Medicose Pharmacy key
const CORRECT_LICENSE_KEY = 'PAKMEDICOSE-PHARM-PMP001-260909';
let licenseKey = CORRECT_LICENSE_KEY;
localStorage.setItem('licenseKey', CORRECT_LICENSE_KEY);

if (!licenseKey) {
  alert('License key required to access system');
  window.location.href = '/';
} else {
  localStorage.setItem('licenseKey', licenseKey);
  console.log('✓ License Key Active: ' + licenseKey);
}

// Cart for POS
let cart = [];

// ===== API HELPER =====
const api = async (endpoint, method = 'GET', data = null) => {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${licenseKey}`,
      'Content-Type': 'application/json'
    }
  };

  if (data) options.body = JSON.stringify(data);

  try {
    const res = await fetch(`${API_URL}${endpoint}`, options);
    const json = await res.json();

    if (!res.ok) {
      if (res.status === 403) {
        alert('License expired! Please renew your subscription.');
        window.location.href = '/';
      }
      if (res.status === 401) {
        alert('Invalid license key');
        localStorage.removeItem('licenseKey');
        window.location.href = '/';
      }
      throw new Error(json.error || 'API error');
    }

    return json;
  } catch (err) {
    console.error('API Error:', err.message);
    alert('Error: ' + err.message);
    return null;
  }
};

// ===== TAB SWITCHING =====
const switchTab = (tabName) => {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  document.getElementById(tabName + '-tab')?.classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  initializeTabs();
  loadLicenseStatus();
  loadFBRCompliance();
  loadDashboard();
  loadMedicines();
  loadCustomers();
  loadSuppliers();
  setupEventListeners();
});

const initializeTabs = () => {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      switchTab(tabName);
    });
  });
};

// ===== LICENSE STATUS =====
const loadLicenseStatus = async () => {
  const license = await api('/licenses/status');
  if (!license) return;

  document.getElementById('licenseKey').textContent = license.license_key;
  document.getElementById('licenseExpiry').textContent = license.expiry_date;
  document.getElementById('daysRemainingConfig').textContent = license.days_remaining;

  // Show renewal warning if <30 days
  if (license.days_remaining <= 30 && license.days_remaining > 0) {
    document.getElementById('renewalAlert').style.display = 'flex';
    document.getElementById('daysRemaining').textContent = license.days_remaining;
  }

  if (license.days_remaining < 0) {
    document.getElementById('licenseStatusBadge').textContent = 'EXPIRED';
    document.getElementById('licenseStatusBadge').classList.add('expired');
  }
};

// ===== DASHBOARD =====
const loadDashboard = async () => {
  const report = await api('/reports/dashboard');
  if (!report) return;

  document.getElementById('todaysSales').textContent = '₨' + (report.today_sales || 0).toFixed(0);
  document.getElementById('lowStockCount').textContent = report.low_stock_count || 0;
  document.getElementById('expiringCount').textContent = report.expired_count || 0;

  // Home tab alerts
  let alerts = '<li>System running normally</li>';
  if (report.expired_count > 0) alerts += `<li>⚠️ ${report.expired_count} medicines expired</li>`;
  if (report.low_stock_count > 0) alerts += `<li>⚠️ ${report.low_stock_count} medicines low stock</li>`;
  document.getElementById('homeAlerts').innerHTML = alerts;

  // License info on home
  const license = await api('/licenses/status');
  if (license) {
    document.getElementById('homeLicenseInfo').innerHTML = `
      <p>Active: <strong>${license.expiry_date}</strong></p>
      <p>Days Remaining: <strong>${license.days_remaining}</strong></p>
    `;
  }
};

// ===== MEDICINES / INVENTORY =====
const loadMedicines = async () => {
  const medicines = await api('/inventory');
  if (!medicines) return;

  const tbody = document.querySelector('#medicineTable tbody');
  tbody.innerHTML = '';

  medicines.forEach(med => {
    const profit = med.selling_price - med.cost_price;
    const status = med.quantity < 10 ? '⚠️ Low' : (med.expiry_date && new Date(med.expiry_date) < new Date() ? '❌ Expired' : '✅ OK');

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${med.name}</td>
      <td>${med.sku}</td>
      <td>${med.quantity}</td>
      <td>${med.expiry_date || '-'}</td>
      <td>₨${med.cost_price}</td>
      <td>₨${med.selling_price}</td>
      <td>₨${profit.toFixed(2)}</td>
      <td>${status}</td>
      <td>
        <button class="btn btn-info" onclick="editMedicine(${med.id})">Edit</button>
        <button class="btn btn-danger" onclick="deleteMedicine(${med.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  // Populate medicine dropdowns
  populateMedicineSelects(medicines);
};

const populateMedicineSelects = (medicines) => {
  [
    document.getElementById('prescMedicineId'),
    document.getElementById('medicineSelect')
  ].forEach(select => {
    if (!select) return;
    select.innerHTML = '<option value="">Select Medicine</option>';
    medicines.forEach(m => {
      const option = document.createElement('option');
      option.value = m.id;
      option.textContent = `${m.name} (₨${m.selling_price})`;
      select.appendChild(option);
    });
  });
};

const setupAddMedicineForm = () => {
  document.getElementById('addMedicineBtn').addEventListener('click', () => {
    document.getElementById('medicineForm').style.display = 'block';
    document.getElementById('medicineId').value = '';
  });

  document.getElementById('cancelMedicineBtn').addEventListener('click', () => {
    document.getElementById('medicineForm').style.display = 'none';
    document.getElementById('medicineFormElement').reset();
  });

  document.getElementById('medicineFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    const medicineId = document.getElementById('medicineId').value;
    const data = {
      name: document.getElementById('medicineName').value,
      generic_name: document.getElementById('genericName').value,
      sku: document.getElementById('sku').value,
      quantity: parseInt(document.getElementById('quantity').value),
      expiry_date: document.getElementById('expiryDate').value || null,
      cost_price: parseFloat(document.getElementById('costPrice').value),
      selling_price: parseFloat(document.getElementById('sellingPrice').value),
      category: document.getElementById('category').value,
      supplier_id: document.getElementById('supplierId').value || null
    };

    const endpoint = medicineId ? `/inventory/${medicineId}` : '/inventory';
    const method = medicineId ? 'PUT' : 'POST';
    const result = await api(endpoint, method, data);

    if (result) {
      alert(result.message);
      document.getElementById('medicineForm').style.display = 'none';
      document.getElementById('medicineFormElement').reset();
      loadMedicines();
    }
  });

  document.getElementById('medicineSearch').addEventListener('input', async (e) => {
    const search = e.target.value.toLowerCase();
    const table = document.getElementById('medicineTable').getElementsByTagName('tbody')[0];
    const rows = table.getElementsByTagName('tr');

    for (let row of rows) {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(search) ? '' : 'none';
    }
  });
};

const editMedicine = async (id) => {
  const medicines = await api('/inventory');
  const med = medicines.find(m => m.id === id);
  if (!med) return;

  document.getElementById('medicineId').value = id;
  document.getElementById('medicineName').value = med.name;
  document.getElementById('genericName').value = med.generic_name || '';
  document.getElementById('sku').value = med.sku;
  document.getElementById('quantity').value = med.quantity;
  document.getElementById('expiryDate').value = med.expiry_date || '';
  document.getElementById('costPrice').value = med.cost_price;
  document.getElementById('sellingPrice').value = med.selling_price;
  document.getElementById('category').value = med.category || '';
  document.getElementById('medicineForm').style.display = 'block';
};

const deleteMedicine = async (id) => {
  if (!confirm('Delete this medicine?')) return;
  const result = await api(`/inventory/${id}`, 'DELETE');
  if (result) {
    alert('Medicine deleted');
    loadMedicines();
  }
};

// ===== POS / BILLING =====
const setupPOSForm = () => {
  document.getElementById('posSearch').addEventListener('input', async (e) => {
    const query = e.target.value;
    if (query.length < 2) {
      document.getElementById('posSearchResults').innerHTML = '';
      return;
    }

    const result = await api('/billing/search-medicine', 'POST', { query });
    if (!result) return;

    let html = '';
    result.forEach(med => {
      html += `<div class="search-result-item" onclick="addToCart(${med.id}, '${med.name}', ${med.selling_price})">
        ${med.name} - ₨${med.selling_price} (Stock: ${med.quantity})
      </div>`;
    });
    document.getElementById('posSearchResults').innerHTML = html;
  });

  document.getElementById('discountPercent').addEventListener('change', calculateTotal);
  document.getElementById('completePaymentBtn').addEventListener('click', completePayment);
  document.getElementById('clearCartBtn').addEventListener('click', () => {
    cart = [];
    updateCartDisplay();
    document.getElementById('invoiceReceipt').style.display = 'none';
  });
};

const addToCart = (medicineId, name, price) => {
  const existing = cart.find(item => item.medicine_id === medicineId);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ medicine_id: medicineId, name, price, quantity: 1 });
  }
  updateCartDisplay();
};

const removeFromCart = (index) => {
  cart.splice(index, 1);
  updateCartDisplay();
};

const updateCartDisplay = () => {
  const tbody = document.querySelector('#cartTable tbody');
  tbody.innerHTML = '';

  cart.forEach((item, index) => {
    const subtotal = item.price * item.quantity;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td><input type="number" value="${item.quantity}" onchange="updateQuantity(${index}, this.value)" min="1"></td>
      <td>₨${item.price}</td>
      <td>₨${subtotal.toFixed(2)}</td>
      <td><button class="btn btn-danger" onclick="removeFromCart(${index})">Remove</button></td>
    `;
    tbody.appendChild(row);
  });

  calculateTotal();
};

const updateQuantity = (index, newQuantity) => {
  cart[index].quantity = parseInt(newQuantity) || 1;
  updateCartDisplay();
};

const calculateTotal = async () => {
  let subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;
  const discountAmount = (subtotal * discountPercent) / 100;
  const amountAfterDiscount = subtotal - discountAmount;

  // Get FBR tax rate from settings (default 17%)
  const settings = await api('/settings/fbr/compliance');
  const taxPercent = settings?.sales_tax_percent || 17;

  // Calculate FBR Sales Tax (17% on amount after discount)
  const taxAmount = (amountAfterDiscount * taxPercent) / 100;
  const total = amountAfterDiscount + taxAmount;

  document.getElementById('subtotal').textContent = subtotal.toFixed(2);
  document.getElementById('discountAmount').textContent = discountAmount.toFixed(2);
  document.getElementById('amountAfterDiscount').textContent = amountAfterDiscount.toFixed(2);
  document.getElementById('taxAmount').textContent = taxAmount.toFixed(2);
  document.getElementById('billTotal').textContent = total.toFixed(2);
};

const completePayment = async () => {
  if (cart.length === 0) {
    alert('Cart is empty');
    return;
  }

  const customerName = document.getElementById('customerName').value || 'Walk-in Customer';
  const customerPhone = document.getElementById('customerPhone').value || null;
  const paymentMethod = document.getElementById('paymentMethod').value;
  const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;

  // Get FBR tax settings
  const settings = await api('/settings/fbr/compliance');
  const taxPercent = settings?.sales_tax_percent || 17;

  const result = await api('/billing/invoice', 'POST', {
    customer_name: customerName,
    customer_phone: customerPhone,
    items: cart,
    payment_method: paymentMethod,
    discount_percent: discountPercent,
    tax_percent: taxPercent
  });

  if (result) {
    const total = parseFloat(document.getElementById('billTotal').textContent);
    const taxAmount = parseFloat(document.getElementById('taxAmount').textContent);

    document.getElementById('invoiceNumber').textContent = result.invoice.invoice_number;
    document.getElementById('invoiceDate').textContent = new Date().toLocaleString();
    document.getElementById('receiptCustomerName').textContent = customerName;
    document.getElementById('receiptTotal').textContent = '₨' + total.toFixed(2);
    document.getElementById('receiptPayment').textContent = paymentMethod;

    // Show receipt with tax info
    const receiptContent = document.createElement('div');
    receiptContent.style.fontSize = '0.9rem';
    receiptContent.innerHTML = `
      <p>Invoice #: ${result.invoice.invoice_number}</p>
      <p>Date: ${new Date().toLocaleString()}</p>
      <p>Customer: ${customerName}</p>
      <hr style="margin: 0.5rem 0;">
      <p>Subtotal: ₨${result.invoice.subtotal}</p>
      <p>Discount: ₨${result.invoice.discount_amount}</p>
      <p>🇵🇰 Tax (${result.invoice.tax_percent}%): ₨${result.invoice.tax_amount.toFixed(2)}</p>
      <p><strong>Total: ₨${result.invoice.total_amount.toFixed(2)}</strong></p>
      <p>Payment: ${paymentMethod}</p>
      <p style="font-size: 0.8rem; color: #6b7280; margin-top: 0.5rem;">
        ✓ FBR Compliant | Digital Invoice
      </p>
    `;

    document.getElementById('invoiceReceipt').innerHTML = receiptContent.innerHTML;
    document.getElementById('invoiceReceipt').style.display = 'block';

    cart = [];
    updateCartDisplay();
    loadDashboard();

    alert('✓ Invoice created: ' + result.invoice.invoice_number + '\n💰 Tax: ₨' + result.invoice.tax_amount.toFixed(2));
  }
};

// ===== PRESCRIPTIONS =====
const setupPrescriptionForm = () => {
  document.getElementById('addPrescriptionBtn').addEventListener('click', () => {
    document.getElementById('prescriptionForm').style.display = 'block';
    document.getElementById('prescriptionId').value = '';
  });

  document.getElementById('cancelPrescriptionBtn').addEventListener('click', () => {
    document.getElementById('prescriptionForm').style.display = 'none';
    document.getElementById('prescriptionFormElement').reset();
  });

  document.getElementById('prescriptionFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      customer_phone: document.getElementById('prescCustomerPhone').value,
      medicine_id: parseInt(document.getElementById('prescMedicineId').value),
      dosage: document.getElementById('prescDosage').value,
      notes: document.getElementById('prescNotes').value
    };

    const result = await api('/prescriptions', 'POST', data);
    if (result) {
      alert('Prescription added');
      document.getElementById('prescriptionForm').style.display = 'none';
      document.getElementById('prescriptionFormElement').reset();
      loadPrescriptions();
    }
  });

  document.getElementById('prescSearch').addEventListener('input', (e) => {
    loadPrescriptions(e.target.value);
  });
};

const loadPrescriptions = async (search = '') => {
  if (!search) return;

  const result = await api(`/prescriptions?customer_phone=${search}`);
  if (!result) return;

  const tbody = document.querySelector('#prescriptionTable tbody');
  tbody.innerHTML = '';

  result.forEach(presc => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${presc.customer_phone}</td>
      <td>${presc.medicine_name}</td>
      <td>${presc.dosage}</td>
      <td>${new Date(presc.created_at).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-danger" onclick="deletePrescription(${presc.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
};

const deletePrescription = async (id) => {
  if (!confirm('Delete this prescription?')) return;
  const result = await api(`/prescriptions/${id}`, 'DELETE');
  if (result) alert('Deleted');
};

// ===== CUSTOMERS =====
const loadCustomers = async () => {
  const customers = await api('/customers');
  if (!customers) return;

  const tbody = document.querySelector('#customerTable tbody');
  tbody.innerHTML = '';

  customers.forEach(cust => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${cust.name}</td>
      <td>${cust.phone}</td>
      <td>${cust.email || '-'}</td>
      <td>${cust.loyalty_points || 0}</td>
      <td>₨${cust.total_purchases || 0}</td>
      <td>
        <button class="btn btn-danger" onclick="deleteCustomer(${cust.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
};

const setupCustomerForm = () => {
  document.getElementById('addCustomerBtn').addEventListener('click', () => {
    document.getElementById('customerForm').style.display = 'block';
    document.getElementById('customerId').value = '';
  });

  document.getElementById('cancelCustomerBtn').addEventListener('click', () => {
    document.getElementById('customerForm').style.display = 'none';
    document.getElementById('customerFormElement').reset();
  });

  document.getElementById('customerFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById('customerFormName').value,
      phone: document.getElementById('customerFormPhone').value,
      email: document.getElementById('customerFormEmail').value
    };

    const result = await api('/customers', 'POST', data);
    if (result) {
      alert('Customer added');
      document.getElementById('customerForm').style.display = 'none';
      document.getElementById('customerFormElement').reset();
      loadCustomers();
    }
  });

  document.getElementById('customerSearch').addEventListener('input', async (e) => {
    const search = e.target.value;
    if (!search) return loadCustomers();
    const result = await api(`/customers?search=${search}`);
    if (result) loadCustomers();
  });
};

const deleteCustomer = async (id) => {
  if (!confirm('Delete this customer?')) return;
  const result = await api(`/customers/${id}`, 'DELETE');
  if (result) {
    alert('Deleted');
    loadCustomers();
  }
};

// ===== SUPPLIERS =====
const loadSuppliers = async () => {
  const suppliers = await api('/suppliers');
  if (!suppliers) return;

  [document.getElementById('supplierId')].forEach(select => {
    if (select) {
      select.innerHTML = '<option value="">Select Supplier</option>';
      suppliers.forEach(sup => {
        const option = document.createElement('option');
        option.value = sup.id;
        option.textContent = sup.name;
        select.appendChild(option);
      });
    }
  });
};

// ===== REPORTS =====
const setupReports = () => {
  document.getElementById('generateReportBtn').addEventListener('click', async () => {
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    if (!startDate || !endDate) {
      alert('Please select both dates');
      return;
    }

    const dailyReport = await api(`/reports/daily?date=${startDate}`);
    if (dailyReport) {
      document.getElementById('reportTotalSales').textContent = '₨' + (dailyReport.total_sales || 0).toFixed(2);
      document.getElementById('reportTotalProfit').textContent = '₨' + (dailyReport.total_profit || 0).toFixed(2);
      document.getElementById('reportProfitMargin').textContent = dailyReport.profit_margin;
      document.getElementById('reportMedicinesSold').textContent = dailyReport.total_quantity_sold || 0;
    }

    // Load FBR Tax Report
    const fbrReport = await api(`/reports/fbr-tax?start_date=${startDate}&end_date=${endDate}`);
    if (fbrReport) {
      document.getElementById('reportTotalTax').textContent = '₨' + (fbrReport.summary.total_tax || 0).toFixed(2);
      document.getElementById('reportTaxRate').textContent = '17%';
      document.getElementById('reportTaxableSales').textContent = '₨' + (fbrReport.summary.total_sales || 0).toFixed(2);
      document.getElementById('reportFBRStatus').textContent = fbrReport.fbr_status;
    }

    const topMedicines = await api('/reports/top-medicines?limit=10');
    if (topMedicines) {
      const tbody = document.querySelector('#topMedicinesTable tbody');
      tbody.innerHTML = '';
      topMedicines.forEach(med => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${med.name}</td>
          <td>${med.quantity_sold}</td>
          <td>₨${med.revenue.toFixed(2)}</td>
          <td>₨${med.profit.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
      });
    }
  });

  document.getElementById('downloadReportBtn').addEventListener('click', () => {
    window.print();
  });
};

// ===== SETTINGS & FBR COMPLIANCE =====
const loadFBRCompliance = async () => {
  const compliance = await api('/settings/fbr/compliance');
  if (!compliance) return;

  const statusDiv = document.getElementById('fbrComplianceStatus');
  if (!statusDiv) return;

  if (compliance.fbr_compliant) {
    statusDiv.className = 'alert alert-success';
    statusDiv.innerHTML = `
      ✓ <strong>FBR Compliant</strong><br>
      Store: ${compliance.store_name}<br>
      NTN: ${compliance.store_ntn}<br>
      Tax Rate: ${compliance.sales_tax_percent}%<br>
      All invoices tracked and compliant
    `;
  } else {
    statusDiv.className = 'alert alert-danger';
    statusDiv.innerHTML = `
      ⚠️ <strong>Not FBR Compliant</strong><br>
      NTN Number required for compliance<br>
      Please update NTN in Store Configuration
    `;
  }
};

const setupSettings = () => {
  document.getElementById('storeConfigForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const settings = {
      store_name: document.getElementById('configStoreName').value,
      store_email: document.getElementById('configStoreEmail').value,
      store_phone: document.getElementById('configStorePhone').value,
      store_address: document.getElementById('configStoreAddress').value,
      store_city: document.getElementById('configStoreCity').value,
      store_ntn: document.getElementById('configStoreNTN').value,
      sales_tax_percent: parseFloat(document.getElementById('configSalesTaxPercent').value)
    };

    const result = await api('/settings', 'POST', settings);
    if (result) {
      alert('✓ Settings saved!\n🇵🇰 FBR compliance updated');
      loadFBRCompliance();
      calculateTotal();
    }
  });

  document.getElementById('renewLicenseLink').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Contact Pak Medical Store support to renew your license.\nPhone: +92-300-1234567\nEmail: support@pakmedical.pk');
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('licenseKey');
    window.location.href = '/';
  });
};

// ===== EVENT LISTENER SETUP =====
const setupEventListeners = () => {
  setupAddMedicineForm();
  setupPOSForm();
  setupPrescriptionForm();
  setupCustomerForm();
  setupReports();
  setupSettings();
};
