const axios = require('axios');

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

const getFinancials = async (req, res) => {
    console.log("Calling getFinancials with query:", req.query);
  const { symbol, statement = 'ic', freq = 'quarter' } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  try {
    const url = `https://financialmodelingprep.com/api/v3/income-statement/${symbol}?limit=4&apikey=${process.env.FINANCIAL_MODELING_PREP_API_KEY}`;
    const response = await axios.get(url);

    return res.status(200).json(response.data);
  } catch (err) {
    console.error(`❌ Error fetching financials for ${symbol}:`, err.message);
    return res.status(500).json({ error: 'Failed to fetch financial data' });
  }
};

module.exports = getFinancials;
