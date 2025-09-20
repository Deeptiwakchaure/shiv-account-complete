const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Placeholder routes for purchase orders
router.get('/', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Purchase Orders routes - Coming soon' });
});

module.exports = router;
