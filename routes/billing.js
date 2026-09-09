const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const router = express.Router();

// POST /api/billing/invoice - Create new invoice with FBR tax
router.post('/invoice', (req, res) => {
  const { customer_name, customer_phone, items, payment_method, discount_percent, tax_percent } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const invoiceNumber = `INV-${Date.now()}`;
  let subtotalAmount = 0;
  let discountAmount = 0;
  let taxAmount = 0;
  let totalAmount = 0;
  const salesTaxPercent = tax_percent || 17; // FBR default: 17%

  // Calculate totals
  let query = 'SELECT id, selling_price FROM medicines WHERE id IN (' + items.map(() => '?').join(',') + ')';
  const medicineIds = items.map(i => i.medicine_id);

  db.all(query, medicineIds, (err, medicines) => {
    if (err) return res.status(500).json({ error: err.message });

    // Map medicines by ID for easier lookup
    const medicineMap = {};
    medicines.forEach(m => medicineMap[m.id] = m);

    // Calculate subtotal
    items.forEach(item => {
      const medicine = medicineMap[item.medicine_id];
      if (medicine) {
        const subtotal = (medicine.selling_price * item.quantity);
        subtotalAmount += subtotal;
      }
    });

    // Apply discount
    if (discount_percent) {
      discountAmount = (subtotalAmount * discount_percent) / 100;
    }

    const amountAfterDiscount = subtotalAmount - discountAmount;

    // Calculate FBR Sales Tax (17% on amount after discount)
    taxAmount = (amountAfterDiscount * salesTaxPercent) / 100;

    // Total = Subtotal - Discount + Tax
    totalAmount = amountAfterDiscount + taxAmount;

    // Insert invoice
    db.run(
      `INSERT INTO invoices (invoice_number, customer_name, customer_phone, total_amount, discount_amount, tax_amount, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [invoiceNumber, customer_name || 'Walk-in', customer_phone || null, totalAmount, discountAmount, taxAmount, payment_method],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });

        const invoiceId = this.lastID;

        // Insert invoice items
        let insertedItems = 0;

        items.forEach(item => {
          const medicine = medicineMap[item.medicine_id];
          if (!medicine) return;

          const subtotal = medicine.selling_price * item.quantity;

          db.run(
            `INSERT INTO invoice_items (invoice_id, medicine_id, quantity, unit_price, subtotal)
             VALUES (?, ?, ?, ?, ?)`,
            [invoiceId, item.medicine_id, item.quantity, medicine.selling_price, subtotal],
            function(err) {
              insertedItems++;

              if (err) {
                console.error('Error inserting invoice item:', err);
              }

              // Update medicine quantity
              db.run(
                'UPDATE medicines SET quantity = quantity - ? WHERE id = ?',
                [item.quantity, item.medicine_id]
              );

              // After all items inserted, update customer loyalty points
              if (insertedItems === items.length) {
                if (customer_phone) {
                  db.run(
                    `UPDATE customers SET total_purchases = total_purchases + ?, loyalty_points = loyalty_points + ? WHERE phone = ?`,
                    [totalAmount, Math.floor(totalAmount / 100), customer_phone]
                  );
                }

                res.status(201).json({
                  success: true,
                  message: 'Invoice created successfully',
                  invoice: {
                    id: invoiceId,
                    invoice_number: invoiceNumber,
                    subtotal: subtotalAmount,
                    discount_amount: discountAmount,
                    tax_amount: taxAmount,
                    tax_percent: salesTaxPercent,
                    total_amount: totalAmount,
                    payment_method: payment_method,
                    items: items.length,
                    fbr_compliant: true,
                    timestamp: new Date()
                  }
                });
              }
            }
          );
        });
      }
    );
  });
});

// GET /api/billing/invoices - List invoices
router.get('/invoices', (req, res) => {
  const query = `
    SELECT id, invoice_number, customer_name, customer_phone, total_amount, discount_amount, payment_method, created_at
    FROM invoices
    ORDER BY created_at DESC
    LIMIT 100
  `;

  db.all(query, (err, invoices) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(invoices);
  });
});

// GET /api/billing/invoices/:id - Get invoice details
router.get('/invoices/:id', (req, res) => {
  const { id } = req.params;

  db.get(
    'SELECT * FROM invoices WHERE id = ?',
    [id],
    (err, invoice) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

      // Get invoice items
      db.all(
        `SELECT ii.*, m.name, m.sku FROM invoice_items ii
         JOIN medicines m ON ii.medicine_id = m.id
         WHERE ii.invoice_id = ?`,
        [id],
        (err, items) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ ...invoice, items });
        }
      );
    }
  );
});

// POST /api/billing/search-medicine - Quick medicine search
router.post('/search-medicine', (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Search query required' });
  }

  db.all(
    `SELECT id, name, sku, quantity, selling_price FROM medicines
     WHERE (name LIKE ? OR sku LIKE ?) AND quantity > 0
     LIMIT 10`,
    [`%${query}%`, `%${query}%`],
    (err, medicines) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(medicines);
    }
  );
});

module.exports = router;
