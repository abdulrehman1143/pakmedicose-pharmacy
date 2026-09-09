const express = require('express');
const db = require('../database');

const router = express.Router();

// POST /api/prescriptions - Add prescription
router.post('/', (req, res) => {
  const { customer_phone, medicine_id, dosage, notes } = req.body;

  if (!customer_phone || !medicine_id || !dosage) {
    return res.status(400).json({ error: 'Customer phone, medicine ID, and dosage are required' });
  }

  db.run(
    `INSERT INTO prescriptions (customer_phone, medicine_id, dosage, notes)
     VALUES (?, ?, ?, ?)`,
    [customer_phone, medicine_id, dosage, notes || null],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        success: true,
        message: 'Prescription added',
        id: this.lastID
      });
    }
  );
});

// GET /api/prescriptions - Search prescriptions by customer phone
router.get('/', (req, res) => {
  const { customer_phone } = req.query;

  if (!customer_phone) {
    return res.status(400).json({ error: 'Customer phone required' });
  }

  db.all(
    `SELECT p.*, m.name as medicine_name, m.sku
     FROM prescriptions p
     JOIN medicines m ON p.medicine_id = m.id
     WHERE p.customer_phone = ?
     ORDER BY p.created_at DESC`,
    [customer_phone],
    (err, prescriptions) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(prescriptions);
    }
  );
});

// PUT /api/prescriptions/:id - Update prescription
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { dosage, notes } = req.body;

  db.run(
    `UPDATE prescriptions SET dosage = ?, notes = ? WHERE id = ?`,
    [dosage, notes || null, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Prescription not found' });
      res.json({ success: true, message: 'Prescription updated' });
    }
  );
});

// DELETE /api/prescriptions/:id - Delete prescription
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM prescriptions WHERE id = ?',
    [id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Prescription not found' });
      res.json({ success: true, message: 'Prescription deleted' });
    }
  );
});

module.exports = router;
