const jwt = require('jsonwebtoken');

const verifyStaff = (req, res, next) => {
  const token = req.headers['x-staff-token'];

  if (!token) {
    return res.status(401).json({ error: 'Staff token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.staff = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired staff token' });
  }
};

module.exports = verifyStaff;
