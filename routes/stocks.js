const express = require("express");
const fetchStockDataBySymbol = require("../controllers/stocks/fetchStockDataBySymbol");
const getFinancials = require("../controllers/stocks/getFinancialData");
const router = express.Router();

router.get("/fetch", fetchStockDataBySymbol);
router.get("/financials",getFinancials);

module.exports = router;
