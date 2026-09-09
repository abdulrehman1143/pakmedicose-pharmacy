const express = require('express');
const db = require('../database');

const router = express.Router();

// POST /api/customers - Add new customer
router.post('/', (req, res) => {
  const { name, phone, email } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  db.run(
    `INSERT INTO customers (name, phone, email)
     VALUES (?, ?, ?)`,
    [name, phone, email || null],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Phone number already exists' });
        }
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        success: true,
        message: 'Customer added',
        id: this.lastID
      });
    }
  );
});

// GET /api/customers - Search customers
router.get('/', (req, res) => {
  const { search } = req.query;

  let query = 'SELECT * FROM customers';
  const params = [];

  if (search) {
    query += ' WHERE name LIKE ? OR phone LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY name ASC LIMIT 50';

  db.all(query, params, (err, customers) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(customers);
  });
});

// GET /api/customers/:phone - Get customer by phone
router.get('/:phone', (req, res) => {
  const { phone } = req.params;

  db.get(
    'SELECT * FROM customers WHERE phone = ?',
    [phone],
    (err, customer) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!customer) return res.status(404).json({ error: 'Customer not found' });
      res.json(customer);
    }
  );
});

// PUT /api/customers/:id - Update customer
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, email, loyalty_points } = req.body;

  db.run(
    `UPDATE customers SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      email = COALESCE(?, email),
      loyalty_points = COALESCE(?, loyalty_points),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [name || null, phone || null, email || null, loyalty_points || null, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Customer not found' });
      res.json({ success: true, message: 'Customer updated' });
    }
  );
});

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run(
    'DELETE FROM customers WHERE id = ?',
    [id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Customer not found' });
      res.json({ success: true, message: 'Customer deleted' });
    }
  );
});

module.exports = router;
