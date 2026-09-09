require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const verifyLicenseKey = require('./middleware/verifyLicenseKey');
const verifyStaff = require('./middleware/verifyStaff');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// License key validation for all /api routes
app.use('/api', verifyLicenseKey);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/licenses', require('./routes/licenses'));
app.use('/api/settings', require('./routes/settings'));

// Health check (no license needed)
app.get('/health', (req, res) => {
  res.json({ status: 'Server running', timestamp: new Date() });
});

// Dashboard - serve index.html for all non-API routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🏥 Abuzar Medical Store Management System running on port ${PORT}`);
  console.log(`Dashboard: http://localhost:${PORT}`);
});
