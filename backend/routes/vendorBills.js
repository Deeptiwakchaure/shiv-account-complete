const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Placeholder routes for vendor bills
router.get('/', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Vendor Bills routes - Coming soon' });
});

module.exports = router;
