const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/hsn/search
// @desc    Search HSN codes using GST API
// @access  Private
router.get('/search', authenticateToken, validatePagination, async (req, res) => {
  try {
    const { q: searchQuery, page = 1, limit = 10 } = req.query;

    if (!searchQuery || searchQuery.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Call GST HSN API
    const hsnApiUrl = process.env.HSN_API_BASE_URL || 'https://services.gst.gov.in/commonservices/hsn/search/qsearch';
    
    const response = await axios.get(hsnApiUrl, {
      params: {
        q: searchQuery.trim(),
        page: page,
        limit: limit
      },
      timeout: 10000 // 10 second timeout
    });

    // Transform the response to match our API format
    const transformedData = {
      success: true,
      message: 'HSN codes retrieved successfully',
      data: {
        query: searchQuery,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: response.data.total || 0
        },
        hsnCodes: response.data.data || []
      }
    };

    res.json(transformedData);
  } catch (error) {
    console.error('HSN search error:', error);

    // Handle different types of errors
    if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        success: false,
        message: 'HSN API request timeout. Please try again.'
      });
    }

    if (error.response) {
      // API returned an error response
      return res.status(error.response.status).json({
        success: false,
        message: 'HSN API error',
        error: error.response.data?.message || 'External API error'
      });
    }

    if (error.request) {
      // Network error
      return res.status(503).json({
        success: false,
        message: 'Unable to connect to HSN API. Please try again later.'
      });
    }

    // Other errors
    res.status(500).json({
      success: false,
      message: 'Internal server error while searching HSN codes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// @route   GET /api/hsn/validate/:hsnCode
// @desc    Validate HSN code format
// @access  Private
router.get('/validate/:hsnCode', authenticateToken, (req, res) => {
  try {
    const { hsnCode } = req.params;
    
    // HSN code validation (4-8 digits)
    const hsnRegex = /^\d{4,8}$/;
    const isValid = hsnRegex.test(hsnCode);

    res.json({
      success: true,
      data: {
        hsnCode,
        isValid,
        message: isValid ? 'Valid HSN code format' : 'Invalid HSN code format. Must be 4-8 digits.'
      }
    });
  } catch (error) {
    console.error('HSN validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating HSN code',
      error: error.message
    });
  }
});

// @route   GET /api/hsn/popular
// @desc    Get popular HSN codes for quick selection
// @access  Private
router.get('/popular', authenticateToken, (req, res) => {
  try {
    // Popular HSN codes for furniture and general business
    const popularHsnCodes = [
      { code: '9401', description: 'Seats (whether or not convertible into beds) and parts thereof' },
      { code: '9403', description: 'Other furniture and parts thereof' },
      { code: '9404', description: 'Mattresses, cushions and similar stuffed furnishings' },
      { code: '9405', description: 'Lamps and lighting fittings' },
      { code: '8517', description: 'Electrical apparatus for line telephony or line telegraphy' },
      { code: '8518', description: 'Microphones, loudspeakers, headphones and earphones' },
      { code: '8519', description: 'Sound recording or reproducing apparatus' },
      { code: '8521', description: 'Video recording or reproducing apparatus' },
      { code: '8528', description: 'Monitors and projectors' },
      { code: '8536', description: 'Electrical apparatus for switching or protecting electrical circuits' }
    ];

    res.json({
      success: true,
      message: 'Popular HSN codes retrieved successfully',
      data: {
        hsnCodes: popularHsnCodes
      }
    });
  } catch (error) {
    console.error('Popular HSN codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving popular HSN codes',
      error: error.message
    });
  }
});

module.exports = router;
