const axios = require('axios');

const searchStocks = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Using Finnhub symbol search API
    const searchResponse = await axios.get(`https://finnhub.io/api/v1/search`, {
      params: {
        q: query,
        token: process.env.FINNHUB_API_KEY
      }
    });

    const searchResults = searchResponse.data.result.slice(0, parseInt(limit));

    // Get detailed data for each stock (profile and quote)
    const stockPromises = searchResults.map(async (stock) => {
      try {
        const [profile, quote] = await Promise.all([
          axios.get(`https://finnhub.io/api/v1/stock/profile2`, { 
            params: { symbol: stock.symbol, token: process.env.FINNHUB_API_KEY } 
          }),
          axios.get(`https://finnhub.io/api/v1/quote`, { 
            params: { symbol: stock.symbol, token: process.env.FINNHUB_API_KEY } 
          }),
        ]);

        const price = quote.data.c || 0;
        const prevClose = quote.data.pc || quote.data.c || 0;
        const diff = price - prevClose;
        const pct = prevClose ? diff / prevClose : 0;

        // Format numbers like stocks.js
        const PLUS = Intl.NumberFormat("en-US", {
          signDisplay: "always",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        const PERCENT = Intl.NumberFormat("en-US", {
          signDisplay: "always",
          style: "percent",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        return {
          symbol: stock.symbol,
          companyName: profile.data.name || stock.description || stock.symbol,
          logo: profile.data.logo || "",
          price: price,
          prevClose: prevClose,
          change: PLUS.format(diff),
          percent: PERCENT.format(pct),
          changeRaw: diff,
          percentRaw: pct,
          category: "search", // Mark as search result
        };
      } catch (error) {
        console.error(`Error fetching data for ${stock.symbol}:`, error.message);
        return null;
      }
    });

    const results = await Promise.all(stockPromises);
    const validResults = results.filter(result => result !== null);

    res.status(200).json({
      success: true,
      query: query,
      results: validResults,
      count: validResults.length
    });
    
  } catch (error) {
    console.error('Error searching stocks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search stocks',
      error: error.message
    });
  }
};

const getStockProfile = async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol is required'
      });
    }

    // Get company profile from Finnhub
    const response = await axios.get(`https://finnhub.io/api/v1/stock/profile2`, {
      params: {
        symbol: symbol.toUpperCase(),
        token: process.env.FINNHUB_API_KEY
      }
    });

    if (!response.data || Object.keys(response.data).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stock profile not found for the given symbol'
      });
    }

    res.status(200).json({
      success: true,
      symbol: symbol.toUpperCase(),
      profile: response.data
    });
    
  } catch (error) {
    console.error('Error fetching stock profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock profile',
      error: error.message
    });
  }
};

const getStockQuote = async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: 'Stock symbol is required'
      });
    }

    // Get profile and quote data like stocks.js
    const [profile, quote] = await Promise.all([
      axios.get(`https://finnhub.io/api/v1/stock/profile2`, { 
        params: { symbol: symbol.toUpperCase(), token: process.env.FINNHUB_API_KEY } 
      }),
      axios.get(`https://finnhub.io/api/v1/quote`, { 
        params: { symbol: symbol.toUpperCase(), token: process.env.FINNHUB_API_KEY } 
      }),
    ]);

    if (!quote.data || quote.data.c === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quote not found for the given symbol'
      });
    }

    const price = quote.data.c || 0;
    const prevClose = quote.data.pc || quote.data.c || 0;
    const diff = price - prevClose;
    const pct = prevClose ? diff / prevClose : 0;

    // Format numbers exactly like stocks.js
    const PLUS = Intl.NumberFormat("en-US", {
      signDisplay: "always",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const PERCENT = Intl.NumberFormat("en-US", {
      signDisplay: "always",
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const stockData = {
      symbol: symbol.toUpperCase(),
      companyName: profile.data.name || symbol.toUpperCase(),
      logo: profile.data.logo || "",
      price: price,
      prevClose: prevClose,
      change: PLUS.format(diff),
      percent: PERCENT.format(pct),
      changeRaw: diff,
      percentRaw: pct,
      category: "quote",
    };

    res.status(200).json({
      success: true,
      quote: stockData
    });
    
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock quote',
      error: error.message
    });
  }
};

const getPopularStocks = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // List of popular stocks to search for
    const popularSymbols = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 
      'META', 'NVDA', 'NFLX', 'AMD', 'INTC',
      'BABA', 'DIS', 'PYPL', 'ADBE', 'CRM',
      'UBER', 'SPOT', 'ZOOM', 'SQ', 'ROKU'
    ];

    const selectedSymbols = popularSymbols.slice(0, parseInt(limit));
    
    // Get detailed data for each stock like stocks.js
    const stockPromises = selectedSymbols.map(async (symbol) => {
      try {
        const [profile, quote] = await Promise.all([
          axios.get(`https://finnhub.io/api/v1/stock/profile2`, { 
            params: { symbol: symbol, token: process.env.FINNHUB_API_KEY } 
          }),
          axios.get(`https://finnhub.io/api/v1/quote`, { 
            params: { symbol: symbol, token: process.env.FINNHUB_API_KEY } 
          }),
        ]);

        const price = quote.data.c || 0;
        const prevClose = quote.data.pc || quote.data.c || 0;
        const diff = price - prevClose;
        const pct = prevClose ? diff / prevClose : 0;

        // Format numbers exactly like stocks.js
        const PLUS = Intl.NumberFormat("en-US", {
          signDisplay: "always",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        const PERCENT = Intl.NumberFormat("en-US", {
          signDisplay: "always",
          style: "percent",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        return {
          symbol: symbol,
          companyName: profile.data.name || symbol,
          logo: profile.data.logo || "",
          price: price,
          prevClose: prevClose,
          change: PLUS.format(diff),
          percent: PERCENT.format(pct),
          changeRaw: diff,
          percentRaw: pct,
          category: "popular",
        };
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error.message);
        return null;
      }
    });

    const results = await Promise.all(stockPromises);
    const validResults = results.filter(result => result !== null && result.price > 0);

    res.status(200).json({
      success: true,
      stocks: validResults,
      count: validResults.length
    });
    
  } catch (error) {
    console.error('Error fetching popular stocks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular stocks',
      error: error.message
    });
  }
};

const getSuggestions = async (req, res) => {
  try {
    const { query, limit = 5 } = req.query;
    
    if (!query || query.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 1 character long'
      });
    }

    // Get search suggestions
    const searchResponse = await axios.get(`https://finnhub.io/api/v1/search`, {
      params: {
        q: query,
        token: process.env.FINNHUB_API_KEY
      }
    });

    const searchResults = searchResponse.data.result.slice(0, parseInt(limit));

    // Get detailed data for each suggestion (profile and quote)
    const suggestionPromises = searchResults.map(async (stock) => {
      try {
        const [profile, quote] = await Promise.all([
          axios.get(`https://finnhub.io/api/v1/stock/profile2`, { 
            params: { symbol: stock.symbol, token: process.env.FINNHUB_API_KEY } 
          }),
          axios.get(`https://finnhub.io/api/v1/quote`, { 
            params: { symbol: stock.symbol, token: process.env.FINNHUB_API_KEY } 
          }),
        ]);

        const price = quote.data.c || 0;
        const prevClose = quote.data.pc || quote.data.c || 0;
        const diff = price - prevClose;
        const pct = prevClose ? diff / prevClose : 0;

        // Format numbers like stocks.js
        const PLUS = Intl.NumberFormat("en-US", {
          signDisplay: "always",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        const PERCENT = Intl.NumberFormat("en-US", {
          signDisplay: "always",
          style: "percent",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        return {
          symbol: stock.symbol,
          companyName: profile.data.name || stock.description || stock.symbol,
          logo: profile.data.logo || "",
          price: price,
          prevClose: prevClose,
          change: PLUS.format(diff),
          percent: PERCENT.format(pct),
          changeRaw: diff,
          percentRaw: pct,
          category: "suggestion",
          // Additional suggestion-specific fields
          displaySymbol: stock.displaySymbol,
          type: stock.type
        };
      } catch (error) {
        console.error(`Error fetching data for ${stock.symbol}:`, error.message);
        return null;
      }
    });

    const results = await Promise.all(suggestionPromises);
    const validSuggestions = results.filter(result => result !== null);

    res.status(200).json({
      success: true,
      query: query,
      suggestions: validSuggestions,
      count: validSuggestions.length
    });
    
  } catch (error) {
    console.error('Error getting stock suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stock suggestions',
      error: error.message
    });
  }
};

module.exports = {
  searchStocks,
  getStockProfile,
  getStockQuote,
  getPopularStocks,
  getSuggestions
};
