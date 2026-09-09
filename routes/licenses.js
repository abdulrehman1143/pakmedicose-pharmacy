const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

const router = express.Router();

// GET /api/licenses/status - Get current license status
router.get('/status', (req, res) => {
  const licenseKey = req.licenseKey;

  if (!licenseKey) {
    return res.status(400).json({ error: 'License key not found in request' });
  }

  db.get(
    `SELECT id, store_name, license_key, start_date, expiry_date, is_active, total_amount_paid
     FROM licenses
     WHERE license_key = ?`,
    [licenseKey],
    (err, license) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!license) return res.status(404).json({ error: 'License not found' });

      const today = new Date();
      const expiryDate = new Date(license.expiry_date);
      const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

      res.json({
        ...license,
        days_remaining: daysRemaining,
        is_expired: daysRemaining < 0,
        renewal_warning: daysRemaining <= 30 && daysRemaining > 0,
        renewal_url: 'https://abuzarmedical.pk/renew'
      });
    }
  );
});

// GET /api/licenses/renewals - Get payment history
router.get('/renewals', (req, res) => {
  const licenseKey = req.licenseKey;

  db.get(
    'SELECT id FROM licenses WHERE license_key = ?',
    [licenseKey],
    (err, license) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!license) return res.status(404).json({ error: 'License not found' });

      db.all(
        `SELECT payment_date, amount, payment_method, notes
         FROM license_payments
         WHERE license_id = ?
         ORDER BY payment_date DESC`,
        [license.id],
        (err, payments) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json(payments);
        }
      );
    }
  );
});

// POST /api/licenses/validate-key - Manual license validation
router.post('/validate-key', (req, res) => {
  const { license_key } = req.body;

  if (!license_key) {
    return res.status(400).json({ error: 'License key required' });
  }

  db.get(
    `SELECT id, store_name, expiry_date, is_active
     FROM licenses
     WHERE license_key = ?`,
    [license_key],
    (err, license) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!license) return res.status(404).json({ error: 'Invalid license key' });

      const today = new Date();
      const expiryDate = new Date(license.expiry_date);

      if (expiryDate < today) {
        return res.status(403).json({
          error: 'License expired',
          expiry_date: license.expiry_date,
          renew_url: 'https://abuzarmedical.pk/renew'
        });
      }

      res.json({
        valid: true,
        store_name: license.store_name,
        expires_at: license.expiry_date
      });
    }
  );
});

// ADMIN: POST /api/licenses/create - Create new license key
// This endpoint is for Abuzar to generate keys for customers
router.post('/create', (req, res) => {
  const { store_name, expiry_date, amount_paid } = req.body;

  if (!store_name || !expiry_date) {
    return res.status(400).json({ error: 'Store name and expiry date required' });
  }

  // Generate unique license key: ABUZAR-STORE-XXXXX-YYMMDD
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  const datePart = new Date().toISOString().substring(2, 8).replace(/-/g, '');
  const licenseKey = `ABUZAR-STORE-${randomPart}-${datePart}`;

  const today = new Date();

  db.run(
    `INSERT INTO licenses (store_name, license_key, start_date, expiry_date, is_active, total_amount_paid)
     VALUES (?, ?, ?, ?, true, ?)`,
    [store_name, licenseKey, today.toISOString().split('T')[0], expiry_date, amount_paid || 0],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Store name already has a license' });
        }
        return res.status(500).json({ error: err.message });
      }

      const licenseId = this.lastID;

      // Record initial payment
      if (amount_paid) {
        db.run(
          `INSERT INTO license_payments (license_id, payment_date, amount, payment_method, notes)
           VALUES (?, ?, ?, 'INITIAL', 'License activation payment')`,
          [licenseId, today.toISOString().split('T')[0], amount_paid]
        );
      }

      res.status(201).json({
        success: true,
        message: 'License created successfully',
        license: {
          store_name,
          license_key: licenseKey,
          start_date: today.toISOString().split('T')[0],
          expiry_date,
          renewal_url: 'https://abuzarmedical.pk/renew'
        }
      });
    }
  );
});

// ADMIN: POST /api/licenses/:store_name/renew - Renew license
router.post('/:store_name/renew', (req, res) => {
  const { store_name } = req.params;
  const { new_expiry_date, renewal_payment } = req.body;

  if (!new_expiry_date) {
    return res.status(400).json({ error: 'New expiry date required' });
  }

  db.run(
    `UPDATE licenses
     SET expiry_date = ?, total_amount_paid = total_amount_paid + ?
     WHERE store_name = ?`,
    [new_expiry_date, renewal_payment || 0, store_name],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'License not found' });

      // Record renewal payment
      db.get(
        'SELECT id FROM licenses WHERE store_name = ?',
        [store_name],
        (err, license) => {
          if (license) {
            db.run(
              `INSERT INTO license_payments (license_id, payment_date, amount, payment_method, notes)
               VALUES (?, ?, ?, 'RENEWAL', 'Annual license renewal')`,
              [license.id, new Date().toISOString().split('T')[0], renewal_payment || 0]
            );
          }

          res.json({
            success: true,
            message: 'License renewed successfully',
            new_expiry_date
          });
        }
      );
    }
  );
});

// ADMIN: POST /api/licenses/:store_name/deactivate - Deactivate license
router.post('/:store_name/deactivate', (req, res) => {
  const { store_name } = req.params;

  db.run(
    `UPDATE licenses SET is_active = false WHERE store_name = ?`,
    [store_name],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'License not found' });
      res.json({ success: true, message: 'License deactivated' });
    }
  );
});

module.exports = router;
