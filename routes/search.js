const express = require('express');
const { 
  searchStocks,
  getStockProfile,
  getStockQuote,
  getPopularStocks,
  getSuggestions
} = require('../controllers/stocks/stockSearch');

const router = express.Router();

// Search for stocks by query
// GET /api/search/stocks?query=apple&limit=10
router.get('/stocks', searchStocks);

// Get stock profile/company information
// GET /api/search/profile/AAPL
router.get('/profile/:symbol', getStockProfile);

// Get real-time stock quote
// GET /api/search/quote/AAPL
router.get('/quote/:symbol', getStockQuote);

// Get popular stocks with current prices
// GET /api/search/popular?limit=20
router.get('/popular', getPopularStocks);

// Get stock suggestions for autocomplete
// GET /api/search/suggestions?query=app&limit=5
router.get('/suggestions', getSuggestions);

module.exports = router;
