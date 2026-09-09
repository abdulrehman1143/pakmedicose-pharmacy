const express = require('express');
const db = require('../database');

const router = express.Router();

// GET /api/settings - Get all settings
router.get('/', (req, res) => {
  db.all(
    'SELECT key, value FROM settings',
    (err, settings) => {
      if (err) return res.status(500).json({ error: err.message });

      const settingsMap = {};
      settings.forEach(s => {
        try {
          settingsMap[s.key] = JSON.parse(s.value);
        } catch {
          settingsMap[s.key] = s.value;
        }
      });

      // Add defaults if not set
      if (!settingsMap.store_ntn) settingsMap.store_ntn = '';
      if (!settingsMap.sales_tax_percent) settingsMap.sales_tax_percent = 17;
      if (!settingsMap.store_name) settingsMap.store_name = 'Pak Medical Store';

      res.json(settingsMap);
    }
  );
});

// POST /api/settings - Save settings
router.post('/', (req, res) => {
  const settings = req.body;

  if (Object.keys(settings).length === 0) {
    return res.status(400).json({ error: 'No settings provided' });
  }

  let completed = 0;
  const total = Object.keys(settings).length;

  Object.entries(settings).forEach(([key, value]) => {
    const valueStr = typeof value === 'object' ? JSON.stringify(value) : value;

    db.run(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      [key, valueStr],
      (err) => {
        completed++;

        if (err) {
          console.error(`Error saving setting ${key}:`, err);
        }

        if (completed === total) {
          res.json({ success: true, message: 'Settings saved successfully' });
        }
      }
    );
  });
});

// GET /api/settings/:key - Get specific setting
router.get('/:key', (req, res) => {
  const { key } = req.params;

  db.get(
    'SELECT value FROM settings WHERE key = ?',
    [key],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!result) return res.status(404).json({ error: 'Setting not found' });

      try {
        res.json({ key, value: JSON.parse(result.value) });
      } catch {
        res.json({ key, value: result.value });
      }
    }
  );
});

// GET /api/settings/fbr/compliance - FBR compliance info
router.get('/fbr/compliance', (req, res) => {
  db.all(
    'SELECT key, value FROM settings WHERE key IN (?, ?, ?)',
    ['store_name', 'store_ntn', 'sales_tax_percent'],
    (err, settings) => {
      if (err) return res.status(500).json({ error: err.message });

      const compliance = {
        store_name: 'Pak Medical Store',
        store_ntn: '',
        sales_tax_percent: 17,
        fbr_compliant: false
      };

      settings.forEach(s => {
        try {
          compliance[s.key] = JSON.parse(s.value);
        } catch {
          compliance[s.key] = s.value;
        }
      });

      compliance.fbr_compliant = compliance.store_ntn && compliance.store_ntn.length > 0;

      res.json(compliance);
    }
  );
});

module.exports = router;
