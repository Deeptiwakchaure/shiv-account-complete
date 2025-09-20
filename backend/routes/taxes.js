const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Placeholder routes for tax management
router.get('/', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Tax routes - Coming soon' });
});

module.exports = router;
