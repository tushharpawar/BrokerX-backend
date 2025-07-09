// Global logo cache to prevent redundant API calls
const logoCache = new Map();

// Cache for different API providers
const cacheKeys = {
  FINNHUB: 'finnhub',
  FINANCIAL_MODELING_PREP: 'fmp'
};

/**
 * Get logo from cache or fetch if not available
 * @param {string} symbol - Stock symbol
 * @param {string} provider - API provider ('finnhub' or 'fmp')
 * @param {Function} fetchFunction - Function to fetch logo data
 * @returns {Promise<string>} - Logo URL
 */
const getLogoWithCache = async (symbol, provider, fetchFunction) => {
  const cacheKey = `${symbol}_${provider}`;
  
  // Check if logo is already cached
  if (logoCache.has(cacheKey)) {
    return logoCache.get(cacheKey);
  }

  try {
    // Fetch logo if not in cache
    const logoUrl = await fetchFunction(symbol);
    
    // Cache the result (even if empty string)
    logoCache.set(cacheKey, logoUrl);
    
    return logoUrl;
  } catch (error) {
    console.error(`Error fetching logo for ${symbol}:`, error.message);
    // Cache empty string to avoid repeated failed requests
    logoCache.set(cacheKey, '');
    return '';
  }
};

/**
 * Batch fetch logos for multiple symbols, only fetching uncached ones
 * @param {Array<string>} symbols - Array of stock symbols
 * @param {string} provider - API provider ('finnhub' or 'fmp')
 * @param {Function} fetchFunction - Function to fetch logo data
 * @returns {Promise<Object>} - Object with symbol as key and logo URL as value
 */
const batchGetLogosWithCache = async (symbols, provider, fetchFunction) => {
  const results = {};
  const uncachedSymbols = [];

  // Check which symbols are not cached
  symbols.forEach(symbol => {
    const cacheKey = `${symbol}_${provider}`;
    if (logoCache.has(cacheKey)) {
      results[symbol] = logoCache.get(cacheKey);
    } else {
      uncachedSymbols.push(symbol);
    }
  });

  // Fetch only uncached symbols
  if (uncachedSymbols.length > 0) {
    console.log(`Fetching logos for ${uncachedSymbols.length} uncached symbols:`, uncachedSymbols);
    
    const fetchPromises = uncachedSymbols.map(async (symbol) => {
      try {
        const logoUrl = await fetchFunction(symbol);
        const cacheKey = `${symbol}_${provider}`;
        logoCache.set(cacheKey, logoUrl);
        results[symbol] = logoUrl;
      } catch (error) {
        console.error(`Error fetching logo for ${symbol}:`, error.message);
        const cacheKey = `${symbol}_${provider}`;
        logoCache.set(cacheKey, '');
        results[symbol] = '';
      }
    });

    await Promise.all(fetchPromises);
  }

  return results;
};

/**
 * Clear cache for specific symbols or entire cache
 * @param {Array<string>} symbols - Optional array of symbols to clear
 */
const clearCache = (symbols = null) => {
  if (symbols) {
    symbols.forEach(symbol => {
      logoCache.delete(`${symbol}_${cacheKeys.FINNHUB}`);
      logoCache.delete(`${symbol}_${cacheKeys.FINANCIAL_MODELING_PREP}`);
    });
  } else {
    logoCache.clear();
  }
};

/**
 * Get cache stats
 * @returns {Object} - Cache statistics
 */
const getCacheStats = () => {
  return {
    size: logoCache.size,
    keys: Array.from(logoCache.keys())
  };
};

module.exports = {
  getLogoWithCache,
  batchGetLogosWithCache,
  clearCache,
  getCacheStats,
  cacheKeys
};
