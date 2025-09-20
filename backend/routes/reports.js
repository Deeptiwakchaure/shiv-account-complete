const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Placeholder routes for reports
router.get('/', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Reports routes - Coming soon' });
});

module.exports = router;
