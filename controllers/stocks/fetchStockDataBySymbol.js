const axios = require("axios");

const fetchStockDataBySymbol = async (req, res) => {
  const symbol = req.query.symbol;
  if (!symbol) return res.status(400).json({ error: "Symbol is required" });

  try {
    // 1. Fetch stock profile from Twelve Data
    const profileResponse = await axios.get("https://api.twelvedata.com/quotes", {
      params: {
        symbol:JSON.stringify(symbol),
        apikey: process.env.TWELVE_DATA_API_KEY,
      },
    });

    const profile = profileResponse.data;

    // 2. Return profile only (prices are sent through WebSocket)
    return res.status(200).json({ profile });

  } catch (err) {
    console.error("Error fetching stock data:", err.message);
    return res.status(500).json({ error: "Failed to fetch stock data" });
  }
};

module.exports = fetchStockDataBySymbol;
