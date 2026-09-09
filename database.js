const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'medical_store.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database error:', err.message);
  else console.log('✅ Connected to SQLite database');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Initialize database schema
const initializeDatabase = () => {
  db.serialize(() => {
    // Licenses table (CRITICAL for revenue model)
    db.run(`
      CREATE TABLE IF NOT EXISTS licenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        store_name TEXT NOT NULL UNIQUE,
        license_key TEXT NOT NULL UNIQUE,
        start_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        total_amount_paid REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run('CREATE INDEX IF NOT EXISTS idx_license_key ON licenses(license_key)');
    db.run('CREATE INDEX IF NOT EXISTS idx_store_name ON licenses(store_name)');

    // Medicines table
    db.run(`
      CREATE TABLE IF NOT EXISTS medicines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        generic_name TEXT,
        sku TEXT NOT NULL UNIQUE,
        quantity INTEGER NOT NULL DEFAULT 0,
        expiry_date DATE,
        cost_price REAL NOT NULL,
        selling_price REAL NOT NULL,
        category TEXT,
        supplier_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(supplier_id) REFERENCES suppliers(id)
      )
    `);

    db.run('CREATE INDEX IF NOT EXISTS idx_sku ON medicines(sku)');
    db.run('CREATE INDEX IF NOT EXISTS idx_expiry ON medicines(expiry_date)');

    // Suppliers table
    db.run(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Invoices table (with FBR tax compliance)
    db.run(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT NOT NULL UNIQUE,
        customer_name TEXT,
        customer_phone TEXT,
        subtotal_amount REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        tax_amount REAL DEFAULT 0,
        tax_percent REAL DEFAULT 17,
        total_amount REAL NOT NULL,
        payment_method TEXT,
        paid_by_staff_id INTEGER,
        fbr_compliant BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run('CREATE INDEX IF NOT EXISTS idx_invoice_number ON invoices(invoice_number)');
    db.run('CREATE INDEX IF NOT EXISTS idx_invoice_date ON invoices(created_at)');

    // Invoice items table
    db.run(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        medicine_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        discount REAL DEFAULT 0,
        subtotal REAL NOT NULL,
        FOREIGN KEY(invoice_id) REFERENCES invoices(id),
        FOREIGN KEY(medicine_id) REFERENCES medicines(id)
      )
    `);

    // Prescriptions table
    db.run(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_phone TEXT NOT NULL,
        medicine_id INTEGER NOT NULL,
        dosage TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(medicine_id) REFERENCES medicines(id)
      )
    `);

    db.run('CREATE INDEX IF NOT EXISTS idx_customer_phone ON prescriptions(customer_phone)');

    // Customers table
    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        email TEXT,
        loyalty_points INTEGER DEFAULT 0,
        total_purchases REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run('CREATE INDEX IF NOT EXISTS idx_customer_phone ON customers(phone)');

    // Staff table
    db.run(`
      CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'cashier',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Settings table
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Payment history for license renewals
    db.run(`
      CREATE TABLE IF NOT EXISTS license_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        license_id INTEGER NOT NULL,
        payment_date DATE NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(license_id) REFERENCES licenses(id)
      )
    `);

    console.log('📊 Database schema initialized');

    // Insert test license if not exists
    db.run(
      `INSERT OR IGNORE INTO licenses (store_name, license_key, start_date, expiry_date, is_active)
       VALUES (?, ?, ?, ?, ?)`,
      ['Pak Medicose Pharmacy', 'PAKMEDICOSE-PHARM-PMP001-260909', '2026-01-01', '2027-12-31', 1],
      function(err) {
        if (err) console.error('Error inserting test license:', err);
        else console.log('✅ Test license ready');
      }
    );
  });
};

// Initialize on startup
initializeDatabase();

module.exports = db;
