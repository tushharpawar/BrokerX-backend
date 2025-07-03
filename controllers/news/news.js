const axios = require('axios');

const getFinancialNews = async (req, res) => {
  try {
    const { category = 'general', limit = 20 } = req.query;
    
    // Using Finnhub API for general financial news
    const response = await axios.get(`https://finnhub.io/api/v1/news`, {
      params: {
        category: category,
        token: process.env.FINNHUB_API_KEY
      }
    });

    const news = response.data.slice(0, parseInt(limit));
    
    return res.status(200).json({
      success: true,
      news: news,
      category: category,
      count: news.length
    });
    
  } catch (error) {
    console.error('Error fetching financial news:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch financial news',
      error: error.message
    });
  }
};

const getStockNews = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { from, to, limit = 20 } = req.query;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol is required'
      });
    }

    // Default date range: last 7 days
    const defaultFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const defaultTo = new Date().toISOString().split('T')[0];

    const response = await axios.get(`https://finnhub.io/api/v1/company-news`, {
      params: {
        symbol: symbol.toUpperCase(),
        from: from || defaultFrom,
        to: to || defaultTo,
        token: process.env.FINNHUB_API_KEY
      }
    });

    const news = response.data.slice(0, parseInt(limit));

    res.status(200).json({
      success: true,
      news: news,
      symbol: symbol.toUpperCase(),
      dateRange: {
        from: from || defaultFrom,
        to: to || defaultTo
      },
      count: news.length
    });
    
  } catch (error) {
    console.error('Error fetching stock news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock news',
      error: error.message
    });
  }
};

const getMarketNews = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // Fetch market-specific news
    const response = await axios.get(`https://finnhub.io/api/v1/news`, {
      params: {
        category: 'forex',
        token: process.env.FINNHUB_API_KEY
      }
    });

    const news = response.data.slice(0, parseInt(limit));
    
    res.status(200).json({
      success: true,
      news: news,
      category: 'market',
      count: news.length
    });
    
  } catch (error) {
    console.error('Error fetching market news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market news',
      error: error.message
    });
  }
};

const getTrendingNews = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get general news and filter for trending topics
    const response = await axios.get(`https://finnhub.io/api/v1/news`, {
      params: {
        category: 'general',
        token: process.env.FINNHUB_API_KEY
      }
    });

    // Sort by datetime (most recent first) and take top articles
    const trendingNews = response.data
      .sort((a, b) => new Date(b.datetime * 1000) - new Date(a.datetime * 1000))
      .slice(0, parseInt(limit));
    
    return res.status(200).json({
      success: true,
      news: trendingNews,
      category: 'trending',
      count: trendingNews.length
    });
    
  } catch (error) {
    console.error('Error fetching trending news:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch trending news',
      error: error.message
    });
  }
};

module.exports = {
  getFinancialNews,
  getStockNews,
  getMarketNews,
  getTrendingNews
};
