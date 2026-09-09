# 💊 Pak Medical Store - Management System

Complete Medical Store Management System with License Key Recurring Revenue Model

**Version:** 1.0.0  
**Built for:** Abdul Rehman  
**Platform:** Web Dashboard (Node.js + SQLite)

---

## Features

### ✅ Core Features Implemented

- **📦 Inventory Management**
  - Add/edit/delete medicines
  - Track stock levels
  - Expiry date alerts
  - Automatic low stock warnings
  - Supplier tracking

- **💳 Billing System (POS)**
  - Quick medicine search
  - Shopping cart
  - Discount application
  - Multiple payment methods (Cash, Card, Online)
  - Invoice generation
  - Print receipts

- **📋 Prescription Management**
  - Add customer prescriptions
  - Track dosage information
  - Search by customer phone
  - Edit/delete prescriptions

- **📊 Reports & Analytics**
  - Daily sales summary
  - Profit/loss calculations
  - Top selling medicines
  - Expired medicines tracking
  - Downloadable reports (PDF)

- **🇵🇰 FBR Tax Compliance (Pakistan)**
  - Automatic 17% Sales Tax calculation
  - NTN (National Tax Number) registration
  - Tax invoice generation
  - Monthly/Quarterly tax reports
  - FBR filing compliance status
  - Digital receipt tracking
  - Tax liability summary

- **👥 Customer Management**
  - Add new customers
  - Track purchase history
  - Loyalty points system
  - Customer search

- **🔑 License Key System (Revenue Model)**
  - Annual subscription renewal
  - Automatic expiry enforcement
  - Grace period (7 days)
  - Renewal reminders (30 days before expiry)
  - Payment tracking

---

## Quick Start

### 1. Install Dependencies
```bash
cd medical-store
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=3002
JWT_SECRET=your-super-secret-key-here-min-32-chars
STORE_NAME=Pak Medical Store
```

### 3. Start Server
```bash
npm start
```

Server runs on **http://localhost:3002**

### 4. Create Test License
The system will create an SQLite database automatically. You'll need a license key to access the dashboard.

**For testing**, create a license manually:
```bash
node -e "
const db = require('sqlite3').verbose();
const fs = require('fs');
db = new db.Database('./medical_store.db');
db.run(\`
  INSERT INTO licenses (store_name, license_key, start_date, expiry_date, is_active)
  VALUES ('Pak Medical Store', 'ABUZAR-STORE-TEST01-260909', date('now'), date('now', '+365 days'), 1)
\`);
"
```

### 5. Access Dashboard
- Open **http://localhost:3002** in browser
- When prompted, enter license key: `ABUZAR-STORE-TEST01-260909`
- Login with default staff account (future: add staff login screen)

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - Staff login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current staff

### Inventory (Requires valid license key)
- `GET /api/inventory` - List all medicines
- `POST /api/inventory` - Add medicine
- `PUT /api/inventory/:id` - Update medicine
- `DELETE /api/inventory/:id` - Delete medicine
- `GET /api/inventory/expiring-soon` - Medicines expiring in 30 days
- `GET /api/inventory/low-stock` - Low stock medicines

### Billing
- `POST /api/billing/invoice` - Create invoice
- `GET /api/billing/invoices` - List invoices
- `GET /api/billing/invoices/:id` - Get invoice details
- `POST /api/billing/search-medicine` - Search medicines

### Prescriptions
- `POST /api/prescriptions` - Add prescription
- `GET /api/prescriptions?customer_phone=X` - Get prescriptions
- `PUT /api/prescriptions/:id` - Update prescription
- `DELETE /api/prescriptions/:id` - Delete prescription

### Reports
- `GET /api/reports/daily` - Daily sales report
- `GET /api/reports/monthly` - Monthly report
- `GET /api/reports/top-medicines` - Top sellers
- `GET /api/reports/expired-medicines` - Expired stock
- `GET /api/reports/dashboard` - Dashboard summary

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Add customer
- `GET /api/customers/:phone` - Get customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Suppliers
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Add supplier
- `GET /api/suppliers/:id/medicines` - Supplier's medicines

### Licenses (Revenue Model)
- `GET /api/licenses/status` - Current license status
- `GET /api/licenses/renewals` - Payment history
- `POST /api/licenses/validate-key` - Validate key
- `POST /api/licenses/create` - Create license (ADMIN)
- `POST /api/licenses/:store/renew` - Renew license (ADMIN)

### Settings
- `GET /api/settings` - Get all settings
- `POST /api/settings` - Save settings
- `GET /api/settings/:key` - Get specific setting

---

## Database Schema

### Key Tables

**licenses** (CRITICAL for revenue)
- id, store_name (UNIQUE), license_key (UNIQUE)
- start_date, expiry_date, is_active, total_amount_paid
- created_at, updated_at

**medicines**
- id, name, generic_name, sku (UNIQUE), quantity
- expiry_date, cost_price, selling_price, category, supplier_id

**invoices**
- id, invoice_number, customer_name, customer_phone
- total_amount, discount_amount, tax_amount, payment_method
- created_at

**invoice_items**
- id, invoice_id, medicine_id, quantity, unit_price, discount, subtotal

**prescriptions**
- id, customer_phone, medicine_id, dosage, notes, created_at

**customers**
- id, name, phone (UNIQUE), email, loyalty_points, total_purchases

**suppliers**
- id, name, phone, email, address

**license_payments** (Track renewals)
- id, license_id, payment_date, amount, payment_method, notes

---

## License Key System (Revenue Model)

### How It Works

1. **License Key Format**: `ABUZAR-STORE-XXXXX-YYMMDD`
   - Unique per store
   - Expires on configured date
   - Cannot be shared across stores

2. **Validation**
   - Every API request requires: `Authorization: Bearer LICENSE_KEY`
   - If expired → 403 error (system stops working)
   - If invalid → 401 error (access denied)

3. **Grace Period**
   - 7 days after expiry → read-only mode
   - After grace period → full lock

4. **Renewal Warnings**
   - 30 days before expiry → renewal alert
   - In dashboard: "License expires in X days. Renew now"

5. **Renewal Process**
   - Customer requests renewal
   - Payment is collected (WhatsApp/JazzCash)
   - Admin approves payment
   - New license key is generated
   - System auto-unlocks with new key

### Creating Licenses (Admin)

```bash
curl -X POST http://localhost:3002/api/licenses/create \
  -H "Content-Type: application/json" \
  -d '{
    "store_name": "Pak Medical Store",
    "expiry_date": "2026-09-09",
    "amount_paid": 5000
  }'
```

Returns:
```json
{
  "success": true,
  "license": {
    "license_key": "ABUZAR-STORE-TEST01-260909",
    "expiry_date": "2026-09-09"
  }
}
```

---

## 🇵🇰 FBR Tax System (Pakistan Compliance)

### FBR Requirements Implementation

**Pakistan's Federal Board of Revenue (FBR) Compliance**:
- ✅ **Sales Tax**: Automatic 17% (GST) calculation
- ✅ **NTN Registration**: National Tax Number field in settings
- ✅ **Digital Invoicing**: All invoices tracked electronically
- ✅ **Tax Breakdown**: Every receipt shows tax component
- ✅ **Monthly Reports**: Aggregate tax liability reports
- ✅ **Compliance Status**: Dashboard shows FBR status

### How It Works

1. **Configuration**
   - Store enters NTN (National Tax Number) in Settings
   - Sets sales tax percentage (default: 17%)
   - System validates compliance

2. **Invoice Generation**
   ```
   Subtotal:        ₨1,000
   - Discount:      ₨100
   = After Discount: ₨900
   + Tax (17%):     ₨153
   = TOTAL:         ₨1,053
   ```

3. **Tax Tracking**
   - Each invoice marked as "FBR Compliant"
   - Tax amount tracked separately
   - Digital receipt issued
   - Data stored for monthly filing

4. **Monthly Tax Liability**
   - API: `GET /api/reports/monthly-tax?month=2026-09`
   - Returns: Total sales, total tax, filing due date
   - Due date: By 25th of following month
   - Bank deposit instructions included

### Setup

```javascript
// 1. Go to Settings tab
// 2. Fill in "FBR Tax Compliance" section
//    - NTN: 1234567-8 (your tax registration number)
//    - Sales Tax %: 17 (or as applicable)
// 3. Click "Save Settings"
// 4. FBR Status changes to "✓ COMPLIANT"

// 5. All future invoices automatically include 17% tax
// 6. Reports show tax collected for filing
```

### API Endpoints (FBR)

```bash
# Get FBR compliance status
GET /api/settings/fbr/compliance
Response: { store_ntn, sales_tax_percent, fbr_compliant }

# Get FBR tax report for date range
GET /api/reports/fbr-tax?start_date=2026-09-01&end_date=2026-09-30
Response: { daily_breakdown, summary: { total_sales, total_tax, effective_tax_rate } }

# Get monthly tax liability
GET /api/reports/monthly-tax?month=2026-09
Response: { daily_breakdown, summary: { total_tax_liability, due_date, fbr_instructions } }
```

### Example Monthly Report

```json
{
  "month": "2026-09",
  "summary": {
    "total_invoices": 450,
    "total_sales": 450000,
    "total_tax_liability": 76500,
    "effective_tax_rate": "17.00%",
    "tax_to_deposit": 76500,
    "due_date": "2026-10-25",
    "fbr_instructions": "File return via FBR portal. Tax liable to deposit in bank account."
  }
}
```

### FBR Filing Process

1. **Monthly**: Generate tax report from dashboard
2. **Aggregate**: Sum all invoices for the month
3. **File**: Submit return via FBR portal by 25th
4. **Deposit**: Pay total tax liability to bank
5. **Document**: Keep digital receipts for audit trail

### Invoice Format (FBR Compliant)

Every invoice includes:
- ✓ Invoice Number (unique)
- ✓ Date & Time
- ✓ Store NTN
- ✓ Medicine details (name, qty, price)
- ✓ **Subtotal**
- ✓ **Discount** (if any)
- ✓ **Sales Tax (17%)**
- ✓ **TOTAL WITH TAX**
- ✓ Payment method
- ✓ Compliance status badge

---

## Monetization

This system includes a **recurring revenue model**:

- **Licensing Fee**: ₨5,000 per year
- **Per Store**: Each medical store gets one unique license key
- **Auto Enforcement**: Software stops working when license expires
- **No Piracy**: Key cannot be shared across stores
- **Stable Revenue**: Annual subscription ensures predictable income

### Revenue Calculation Example
- 100 stores × ₨5,000/year = **₨500,000/year recurring revenue**
- With proper marketing: 500 stores = **₨2.5M/year**

---

## Deployment Options

### Option 1: Railway.app (Recommended)
```bash
git init
git add .
git commit -m "Initial commit"
git remote add railway https://railway.app/...
git push railway main
```

Set environment variables in Railway dashboard:
- `PORT=3002`
- `JWT_SECRET=your-secret`
- `NODE_ENV=production`

### Option 2: Heroku
```bash
heroku create pak-medical-store
heroku config:set JWT_SECRET=your-secret
git push heroku main
```

### Option 3: VPS (Digital Ocean / AWS)
1. SSH into server
2. Clone repo: `git clone ...`
3. Install Node.js and npm
4. Run: `npm install && npm start`
5. Use PM2 for process management: `pm2 start server.js`

---

## Future Enhancements (Phase 2+)

- **Flutter Mobile App** - Counter operations, quick billing
- **Desktop App** - Electron wrapper
- **WhatsApp Integration** - Order confirmations, payment links
- **Email Notifications** - Invoices, low stock alerts
- **Barcode Scanning** - QR code support
- **Multi-Store** - Centralized inventory across branches
- **Advanced Analytics** - Predictive ordering, seasonal trends

---

## Security

- ✅ License key validation on every API call
- ✅ JWT tokens for staff authentication
- ✅ SQLite with indexed queries
- ✅ CORS enabled for frontend
- ✅ Error handling & logging

**Production Checklist**:
- [ ] Use strong JWT_SECRET (32+ chars)
- [ ] Enable HTTPS only
- [ ] Setup database backups
- [ ] Configure firewall rules
- [ ] Monitor license expiries
- [ ] Log all transactions

---

## Testing

### Create Test Data
```bash
# Add test medicine
curl -X POST http://localhost:3002/api/inventory \
  -H "Authorization: Bearer ABUZAR-STORE-TEST01-260909" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aspirin",
    "sku": "ASP001",
    "quantity": 100,
    "cost_price": 2,
    "selling_price": 5
  }'

# Add test customer
curl -X POST http://localhost:3002/api/customers \
  -H "Authorization: Bearer ABUZAR-STORE-TEST01-260909" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmed Khan",
    "phone": "03001234567",
    "email": "ahmed@example.com"
  }'

# Create invoice
curl -X POST http://localhost:3002/api/billing/invoice \
  -H "Authorization: Bearer ABUZAR-STORE-TEST01-260909" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Walk-in",
    "items": [{"medicine_id": 1, "quantity": 2}],
    "payment_method": "Cash"
  }'
```

---

## Support & Contact

**Owner**: Abdul Rehman  
**Email**: abdul.rahman.seo@gmail.com  
**Store Support**: support@pakmedical.pk  
**Phone**: +92-300-1234567

---

## License

© 2025 Pak Medical Store. All rights reserved.

This software is proprietary and licensed per-store. Unauthorized copying or distribution is prohibited.

---

## Changelog

### v1.0.0 (Current)
- ✅ Complete backend with Express.js
- ✅ SQLite database with schema
- ✅ License key system (revenue model)
- ✅ Web dashboard (inventory, billing, reports)
- ✅ POS system with cart
- ✅ Prescription management
- ✅ Customer & supplier management
- ✅ Daily/monthly reports
- ✅ API documentation

### v1.1.0 (Planned)
- Flutter mobile app
- WhatsApp integration
- Email notifications
- Barcode scanning
