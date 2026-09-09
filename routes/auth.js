const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../database');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get(
    'SELECT id, username, password_hash, name, role FROM staff WHERE username = ? AND is_active = true',
    [username],
    (err, staff) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!staff) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Verify password
      bcrypt.compare(password, staff.password_hash, (err, isValid) => {
        if (err || !isValid) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
          { id: staff.id, username: staff.username, name: staff.name, role: staff.role },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '24h' }
        );

        res.json({
          success: true,
          message: `Welcome, ${staff.name}!`,
          token,
          staff: { id: staff.id, name: staff.name, role: staff.role }
        });
      });
    }
  );
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const token = req.headers['x-staff-token'];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    res.json({ success: true, staff: decoded });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
