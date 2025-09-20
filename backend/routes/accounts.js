const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Placeholder routes for chart of accounts
router.get('/', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Chart of Accounts routes - Coming soon' });
});

module.exports = router;
