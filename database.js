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

    // Add is_narcotic column if not exists
    db.run(`ALTER TABLE medicines ADD COLUMN is_narcotic BOOLEAN DEFAULT 0`, () => {});

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

    // Seed ALL 79 medicines if table is empty
    db.get('SELECT COUNT(*) as count FROM medicines', (err, row) => {
      if (row && row.count === 0) {
        console.log('🌱 Seeding 79 medicines database...');
        const seedSQL = `INSERT INTO medicines (name, generic_name, sku, quantity, expiry_date, cost_price, selling_price, category, is_narcotic) VALUES
('Crocin 500mg','Paracetamol','CROCN-500',100,'2026-12-31',3,8,'Painkillers',0),
('Aspirin Bayer','Aspirin','ASPBYR-325',80,'2026-12-31',4,10,'Painkillers',0),
('Brufen','Ibuprofen','BFIN-400',50,'2026-12-31',6,15,'Painkillers',0),
('Combiflam','Ibuprofen+Paracetamol','COMBF-TAB',60,'2026-12-31',6,15,'Painkillers',0),
('Dispirin','Aspirin','DISP-500',70,'2026-12-31',4,10,'Painkillers',0),
('Amoxil','Amoxicillin','AMXL-500',100,'2026-12-31',8,20,'Antibiotics',0),
('Azacin','Azithromycin','AZAC-500',60,'2026-12-31',15,40,'Antibiotics',0),
('Cipro','Ciprofloxacin','CIPRO-500',40,'2026-12-31',10,25,'Antibiotics',0),
('Augmentin','Amoxicillin+Clavulanic','AUGM-625',80,'2026-12-31',20,50,'Antibiotics',0),
('Suprax','Cefixime','SUPR-200',50,'2026-12-31',12,30,'Antibiotics',0),
('Robitussin','Dextromethorphan','ROBI-DM',30,'2026-12-31',80,150,'Cough/Cold',0),
('Strepsils','Amylmetacresol','STRP-LOZ',50,'2026-12-31',15,35,'Cough/Cold',0),
('Benadryl Cough','Diphenhydramine','BENA-COUGH',25,'2026-12-31',90,180,'Cough/Cold',0),
('Aspirin Plus C','Aspirin+Vitamin C','ASPR-C',60,'2026-12-31',8,18,'Cough/Cold',0),
('Shelf Cough Syrup','Dextromethorphan','SHELF-COUGH',40,'2026-12-31',50,100,'Cough/Cold',0),
('Flagyl','Metronidazole','FLAG-400',100,'2026-12-31',5,12,'Digestive',0),
('Digene','Aluminum+Magnesium','DIGN-TAB',80,'2026-12-31',3,8,'Digestive',0),
('Nexium','Esomeprazole','NEXM-20',50,'2026-12-31',25,60,'Digestive',0),
('Zantac','Ranitidine','ZANT-150',60,'2026-12-31',8,20,'Digestive',0),
('Vomistop','Ondansetron','VOMI-4',60,'2026-12-31',8,20,'Digestive',0),
('D-Drops','Vitamin D','DDROP-1000',120,'2026-12-31',3,8,'Vitamins',0),
('Celin','Vitamin C','CELN-500',150,'2026-12-31',2,6,'Vitamins',0),
('Becosule B Complex','B Vitamins','BECO-COMP',100,'2026-12-31',5,12,'Vitamins',0),
('Calcidia','Calcium','CALCD-500',80,'2026-12-31',8,18,'Vitamins',0),
('Fervin Iron','Iron Supplement','FERV-IRON',100,'2026-12-31',4,10,'Vitamins',0),
('Avoquin','Hydroquinone','AVOQ-CREM',20,'2026-12-31',80,180,'Skin',0),
('Retinova','Tretinoin','RETN-CREM',15,'2026-12-31',120,280,'Skin',0),
('Sunban Sunscreen','Sunscreen','SUNB-50',40,'2026-12-31',150,350,'Skin',0),
('Neem Plus Face Wash','Neem Extract','NEEM-WASH',50,'2026-12-31',100,200,'Skin',0),
('Acne Control','Benzoyl Peroxide','ACNE-GEL',30,'2026-12-31',70,160,'Skin',0),
('Allergex','Cetirizine','ALLGX-10',100,'2026-12-31',3,8,'Allergy',0),
('Clarityne','Loratadine','CLART-10',80,'2026-12-31',4,10,'Allergy',0),
('Fexodin','Fexofenadine','FEXOD-120',60,'2026-12-31',6,15,'Allergy',0),
('Benadryl Tablet','Diphenhydramine','BENA-TAB',50,'2026-12-31',5,12,'Allergy',0),
('Allerwin Syrup','Pheniramine','ALLW-SYP',25,'2026-12-31',60,140,'Allergy',0),
('Amlodipine','Amlodipine','AMLO-5',100,'2026-12-31',8,20,'Other',0),
('Lisinopril','Lisinopril','LISI-10',80,'2026-12-31',6,15,'Other',0),
('Betaloc','Metoprolol','BETA-50',60,'2026-12-31',7,18,'Other',0),
('Atenolol','Atenolol','ATEN-50',70,'2026-12-31',5,12,'Other',0),
('Glucophage','Metformin','GLUCO-500',120,'2026-12-31',4,10,'Other',0),
('Daonil','Glibenclamide','DAON-5',90,'2026-12-31',5,12,'Other',0),
('Insulin NPH','Insulin','INSUL-NPH',30,'2026-12-31',500,1200,'Other',0),
('Nestle Milk Powder 400g','Milk Powder','NESTLE-MILK-400',50,'2027-06-30',250,550,'Dairy',0),
('Nestle Pure Life Water 1.5L','Drinking Water','NESTLE-WATER-1.5L',100,'2027-12-31',40,80,'Beverages',0),
('Nescafe Coffee 50g','Instant Coffee','NESCAFE-50G',40,'2027-09-30',120,280,'Beverages',0),
('Nestle Cerelac Baby Food','Baby Cereal','CERELAC-200G',30,'2027-03-31',200,450,'Baby Food',0),
('Maggi Noodles 70g','Instant Noodles','MAGGI-70G',80,'2027-08-31',20,45,'Food',0),
('Fresh Milk 1L','Whole Milk','MILK-1L-FRESH',60,'2026-10-31',80,150,'Dairy',0),
('Yogurt 400g','Plain Yogurt','YOGURT-400G',40,'2026-10-20',60,120,'Dairy',0),
('Butter 250g','Pure Butter','BUTTER-250G',30,'2027-03-15',300,600,'Dairy',0),
('Cheese Slice 200g','Cheddar Cheese','CHEESE-200G',25,'2027-01-31',180,380,'Dairy',0),
('Lipton Tea Bags 50s','Black Tea','LIPTON-50',35,'2027-12-31',150,320,'Beverages',0),
('Tetley Tea 100g','Premium Tea','TETLEY-100G',25,'2027-11-30',180,400,'Beverages',0),
('Black Tea Leaves 500g','Loose Tea','TEA-500G-LOOSE',20,'2027-09-30',250,500,'Beverages',0),
('White Sugar 1kg','Refined Sugar','SUGAR-1KG',100,'2027-12-31',80,150,'Food',0),
('Salt 1kg','Table Salt','SALT-1KG',80,'2027-12-31',30,60,'Food',0),
('Cooking Oil 2L','Vegetable Oil','OIL-2L',50,'2027-08-31',250,480,'Food',0),
('Ghee 500g','Pure Ghee','GHEE-500G',30,'2027-09-30',400,850,'Food',0),
('ORS Powder Packet','Oral Rehydration','ORS-PACKET',100,'2027-12-31',15,35,'Other',0),
('Honey 250g','Pure Honey','HONEY-250G',35,'2027-12-31',200,450,'Food',0),
('Jam 400g','Strawberry Jam','JAM-400G',20,'2027-09-30',120,280,'Food',0),
('Nido Full Cream 400g','Milk Powder','NIDO-400G',50,'2027-06-30',280,620,'Dairy',0),
('Nido Full Cream 900g','Milk Powder','NIDO-900G',30,'2027-07-31',550,1200,'Dairy',0),
('Nido 3+ Grow 400g','Milk Powder','NIDO-3PLUS-400',25,'2027-05-31',320,700,'Dairy',0),
('Nescafe Gold 50g','Instant Coffee','NESCAFE-GOLD-50',40,'2027-10-31',180,400,'Beverages',0),
('Nescafe Classic 100g','Instant Coffee','NESCAFE-CLASS-100',35,'2027-09-30',300,650,'Beverages',0),
('Nestle Milo 400g','Chocolate Drink','MILO-400G',45,'2027-08-31',220,480,'Beverages',0),
('Nestle Aero 35g','Chocolate Bar','AERO-35G',100,'2027-12-31',25,60,'Confectionery',0),
('Nestle KitKat 45g','Chocolate Bar','KITKAT-45G',80,'2027-12-31',30,70,'Confectionery',0),
('Nestle Smarties 45g','Chocolate Candy','SMARTIES-45G',60,'2027-11-30',20,50,'Confectionery',0),
('Nestle Milkybar 40g','Milk Chocolate','MILKYBAR-40G',70,'2027-12-31',22,55,'Confectionery',0),
('Morphine Injection 10mg','Morphine','MORPH-INJ-10',20,'2026-12-31',500,1200,'Narcotics',1),
('Codeine Syrup 10mg/5ml','Codeine','CODEINE-SYP',15,'2026-09-30',150,350,'Narcotics',1),
('Diazepam 5mg','Diazepam','DIAZ-5',30,'2027-03-31',8,20,'Narcotics',1),
('Tramadol 50mg','Tramadol','TRAM-50',40,'2026-11-30',12,30,'Narcotics',1),
('Alprazolam 0.5mg','Alprazolam','ALPR-0.5',35,'2027-02-28',10,25,'Narcotics',1),
('Lorazepam 2mg','Lorazepam','LORA-2',25,'2027-01-31',15,40,'Narcotics',1),
('Methadone 5mg','Methadone','METH-5',10,'2027-04-30',80,200,'Narcotics',1),
('Pentazocine 50mg','Pentazocine','PENTA-50',20,'2026-10-31',120,300,'Narcotics',1);`;
        db.exec(seedSQL, (err) => {
          if (err) console.error('Seeding error:', err);
          else console.log('✅ All 79 medicines seeded successfully');
        });
      }
    });
  });
};

// Initialize on startup
initializeDatabase();

module.exports = db;
