const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');


const router = express.Router();

// @route   GET /api/hsn/search
// @desc    Search HSN codes using GST API
// @access  Private
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { inputText, selectedType = 'byDesc', category = 'P' } = req.query;

    if (!inputText || inputText.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search text must be at least 2 characters long'
      });
    }

    // Determine search type and category based on input
    const isNumeric = /^\d+$/.test(inputText.trim());
    const searchType = isNumeric ? 'byCode' : 'byDesc';
    const searchCategory = isNumeric ? 'null' : (category || 'P');

    // Call GST HSN API
    const hsnApiUrl = 'https://services.gst.gov.in/commonservices/hsn/search/qsearch';
    
    const response = await axios.get(hsnApiUrl, {
      params: {
        inputText: inputText.trim(),
        selectedType: searchType,
        category: searchCategory
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Transform the response to match our API format
    const hsnCodes = response.data?.data || [];
    const transformedCodes = hsnCodes.map(item => ({
      code: item.c,
      description: item.n
    }));

    res.json({
      success: true,
      message: 'HSN codes retrieved successfully',
      data: {
        query: inputText,
        searchType,
        category: searchCategory,
        hsnCodes: transformedCodes
      }
    });
  } catch (error) {
    console.error('HSN search error:', error);

    // Fallback to mock data if API fails
    const mockData = [
      { code: '9401', description: 'Seats (whether or not convertible into beds)' },
      { code: '9403', description: 'Other furniture and parts thereof' },
      { code: '9404', description: 'Mattresses, cushions and similar stuffed furnishings' }
    ];

    res.json({
      success: true,
      message: 'HSN codes retrieved (fallback data)',
      data: {
        query: req.query.inputText,
        searchType: 'fallback',
        hsnCodes: mockData
      }
    });
  }
});

// @route   GET /api/hsn/validate/:hsnCode
// @desc    Validate HSN code format
// @access  Private
router.get('/validate/:hsnCode', authenticateToken, (req, res) => {
  try {
    const { hsnCode } = req.params;
    
    // HSN code validation (4-8 digits for goods, 9999 for services)
    const hsnRegex = /^(\d{4,8}|9999)$/;
    const isValid = hsnRegex.test(hsnCode);
    
    let category = 'Unknown';
    if (hsnCode === '9999') {
      category = 'Services';
    } else if (/^\d{4,8}$/.test(hsnCode)) {
      category = 'Goods';
    }

    res.json({
      success: true,
      data: {
        hsnCode,
        isValid,
        category,
        message: isValid ? `Valid HSN code for ${category}` : 'Invalid HSN code format. Must be 4-8 digits for goods or 9999 for services.'
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
      { code: '4409', description: 'Wood (including strips and friezes for parquet flooring)' },
      { code: '4418', description: 'Builders joinery and carpentry of wood' },
      { code: '7326', description: 'Other articles of iron or steel' },
      { code: '3926', description: 'Other articles of plastics' },
      { code: '6302', description: 'Bed linen, table linen, toilet linen and kitchen linen' },
      { code: '9999', description: 'Services' }
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
