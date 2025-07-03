const express = require('express');
const { 
  getFinancialNews, 
  getStockNews, 
  getMarketNews, 
  getTrendingNews 
} = require('../controllers/news/news');

const router = express.Router();

// Get general financial news
// GET /api/news?category=general&limit=20
router.get('/', getFinancialNews);

// Get news for specific stock symbol
// GET /api/news/stock/AAPL?from=2025-06-01&to=2025-07-01&limit=20
router.get('/stock/:symbol', getStockNews);

// Get market news
// GET /api/news/market?limit=20
router.get('/market', getMarketNews);

// Get trending news
// GET /api/news/trending?limit=10
router.get('/trending', getTrendingNews);

module.exports = router;
