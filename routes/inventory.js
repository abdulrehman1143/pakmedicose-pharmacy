const express = require('express');
const db = require('../database');

const router = express.Router();

// GET /api/inventory - List all medicines
router.get('/', (req, res) => {
  const search = req.query.search || '';

  let query = 'SELECT * FROM medicines';
  const params = [];

  if (search) {
    query += ' WHERE name LIKE ? OR sku LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY name ASC LIMIT 100';

  db.all(query, params, (err, medicines) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(medicines);
  });
});

// POST /api/inventory - Add new medicine
router.post('/', (req, res) => {
  const { name, generic_name, sku, quantity, expiry_date, cost_price, selling_price, category, supplier_id } = req.body;

  if (!name || !sku || cost_price === undefined || selling_price === undefined) {
    return res.status(400).json({ error: 'Name, SKU, cost price, and selling price are required' });
  }

  db.run(
    `INSERT INTO medicines (name, generic_name, sku, quantity, expiry_date, cost_price, selling_price, category, supplier_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, generic_name || null, sku, quantity || 0, expiry_date || null, cost_price, selling_price, category || null, supplier_id || null],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'SKU already exists' });
        }
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        success: true,
        message: 'Medicine added successfully',
        id: this.lastID
      });
    }
  );
});

// PUT /api/inventory/:id - Update medicine
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, generic_name, quantity, expiry_date, cost_price, selling_price, category, supplier_id } = req.body;

  db.run(
    `UPDATE medicines SET
      name = ?, generic_name = ?, quantity = ?, expiry_date = ?, cost_price = ?, selling_price = ?, category = ?, supplier_id = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name, generic_name || null, quantity, expiry_date || null, cost_price, selling_price, category || null, supplier_id || null, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Medicine not found' });
      res.json({ success: true, message: 'Medicine updated' });
    }
  );
});

// DELETE /api/inventory/:id - Delete medicine
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM medicines WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Medicine not found' });
    res.json({ success: true, message: 'Medicine deleted' });
  });
});

// GET /api/inventory/expiring-soon - Medicines expiring in 30 days
router.get('/expiring-soon', (req, res) => {
  const query = `
    SELECT * FROM medicines
    WHERE expiry_date IS NOT NULL
      AND expiry_date >= DATE('now')
      AND expiry_date <= DATE('now', '+30 days')
    ORDER BY expiry_date ASC
  `;

  db.all(query, (err, medicines) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(medicines);
  });
});

// GET /api/inventory/low-stock - Medicines below minimum stock
router.get('/low-stock', (req, res) => {
  const minStock = 10; // Configurable minimum
  const query = `
    SELECT * FROM medicines
    WHERE quantity < ?
    ORDER BY quantity ASC
  `;

  db.all(query, [minStock], (err, medicines) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(medicines);
  });
});

module.exports = router;
