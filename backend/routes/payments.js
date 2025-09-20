const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Placeholder routes for payments
router.get('/', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Payments routes - Coming soon' });
});

module.exports = router;
