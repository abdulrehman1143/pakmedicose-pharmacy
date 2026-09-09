const express = require('express');
const db = require('../database');

const router = express.Router();

// POST /api/suppliers - Add supplier
router.post('/', (req, res) => {
  const { name, phone, email, address } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Supplier name required' });
  }

  db.run(
    `INSERT INTO suppliers (name, phone, email, address)
     VALUES (?, ?, ?, ?)`,
    [name, phone || null, email || null, address || null],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        success: true,
        message: 'Supplier added',
        id: this.lastID
      });
    }
  );
});

// GET /api/suppliers - List suppliers
router.get('/', (req, res) => {
  db.all(
    'SELECT * FROM suppliers ORDER BY name ASC',
    (err, suppliers) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(suppliers);
    }
  );
});

// GET /api/suppliers/:id - Get supplier
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get(
    'SELECT * FROM suppliers WHERE id = ?',
    [id],
    (err, supplier) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
      res.json(supplier);
    }
  );
});

// GET /api/suppliers/:id/medicines - Get medicines from supplier
router.get('/:id/medicines', (req, res) => {
  const { id } = req.params;

  db.all(
    'SELECT * FROM medicines WHERE supplier_id = ? ORDER BY name ASC',
    [id],
    (err, medicines) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(medicines);
    }
  );
});

// PUT /api/suppliers/:id - Update supplier
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, email, address } = req.body;

  db.run(
    `UPDATE suppliers SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      email = COALESCE(?, email),
      address = COALESCE(?, address),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name || null, phone || null, email || null, address || null, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Supplier not found' });
      res.json({ success: true, message: 'Supplier updated' });
    }
  );
});

// DELETE /api/suppliers/:id - Delete supplier
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM suppliers WHERE id = ?',
    [id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Supplier not found' });
      res.json({ success: true, message: 'Supplier deleted' });
    }
  );
});

module.exports = router;
