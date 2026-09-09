const db = require('../database');

// CRITICAL: License key validation middleware for all API requests
// This ensures software stops working when license expires (recurring revenue model)
const verifyLicenseKey = (req, res, next) => {
  // Extract license key from Authorization header: "Bearer ABUZAR-STORE-XXXXX"
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'License key required. Add: Authorization: Bearer YOUR_LICENSE_KEY' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid authorization format. Use: Authorization: Bearer LICENSE_KEY' });
  }

  const licenseKey = parts[1];

  // Validate license key against database
  db.get(
    `SELECT id, store_name, expiry_date, is_active FROM licenses
     WHERE license_key = ? AND is_active = true`,
    [licenseKey],
    (err, license) => {
      if (err) {
        console.error('License validation error:', err);
        return res.status(500).json({ error: 'License validation failed' });
      }

      if (!license) {
        return res.status(401).json({ error: 'Invalid or inactive license key' });
      }

      // Check if license has expired
      const today = new Date();
      const expiryDate = new Date(license.expiry_date);

      if (expiryDate < today) {
        const daysExpired = Math.floor((today - expiryDate) / (1000 * 60 * 60 * 24));

        // Grace period: 7 days after expiry (read-only mode)
        if (daysExpired > 7) {
          return res.status(403).json({
            error: 'License expired and grace period exceeded',
            message: `Your license expired on ${license.expiry_date}. Please renew immediately.`,
            renew_url: 'https://abuzarmedical.pk/renew'
          });
        }

        // Within grace period - allow read-only access
        console.warn(`⚠️ License ${license.store_name} expired ${daysExpired} days ago (grace period)`);
        req.licenseWarning = `License expired on ${license.expiry_date}. Please renew soon.`;
      }

      // Check if expiring soon (30 days remaining)
      const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        req.renewalWarning = `Your license expires in ${daysUntilExpiry} days`;
      }

      // License is valid - attach to request
      req.license = license;
      req.licenseKey = licenseKey;

      next();
    }
  );
};

module.exports = verifyLicenseKey;
