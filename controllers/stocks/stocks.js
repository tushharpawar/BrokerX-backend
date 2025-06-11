// stocks.js
const axios = require("axios");

const TOKEN = process.env.FINNHUB_API_KEY;
const REST  = "https://finnhub.io/api/v1";

const categories = {
  trending: [
    "NVDA", "AAPL", "TSLA", "META",
    "MSFT", "GOOGL", "UBER",
  ],
  largeCap: [
    "BRK.B", "JNJ", "V", "PG", "JPM", "MA", "WMT",
  ],
  midCap: [
    "ROKU", "DDOG", "TEAM", "TWLO", "ZS", "BILL",
  ],
  smallCap: [
    "FUBO", "BIGC", "LMND", "PLUG", "SOFI", "SNDL",
  ],
};


const symbols = Object.values(categories).flat(); 
module.exports.symbols     = symbols;
module.exports.categories  = categories;

const cache = new Map(); 

(async function bootstrap() {
  await Promise.all(
    symbols.map(async (sym) => {
      const [profile, quote] = await Promise.all([
        axios.get(`${REST}/stock/profile2`, { params: { symbol: sym, token: TOKEN } }),
        axios.get(`${REST}/quote`,         { params: { symbol: sym, token: TOKEN } }),
      ]);


      const cat = Object.keys(categories).find((c) => categories[c].includes(sym));

      cache.set(sym, {
        symbol: sym,
        companyName: profile.data.name || sym,
        logo: profile.data.logo || "",
        price: quote.data.c || 0,
        prevClose: quote.data.pc || quote.data.c,
        change: 0,
        percent: "0.00%",
        category: cat || "misc",
      });
    }),
  );
  console.log("🗄️  cache symbols");
})();


const DECIMALS = 2;
const PLUS     = Intl.NumberFormat("en-US", {
  signDisplay: "always",
  minimumFractionDigits: DECIMALS,
  maximumFractionDigits: DECIMALS,
});
const PERCENT  = Intl.NumberFormat("en-US", {
  signDisplay: "always",
  style: "percent",
  minimumFractionDigits: DECIMALS,
  maximumFractionDigits: DECIMALS,
});

function updatePrice(symbol, rawPrice) {
  const p = Number(rawPrice);
  if (!Number.isFinite(p)) return null;

  const row = cache.get(symbol);
  if (!row) return null;

  const prev = Number(row.prevClose);
  const diff = p - prev;
  const pct  = prev ? diff / prev : 0;

  Object.assign(row, { price: p, change: diff, percent: pct });

  return {
    symbol,
    companyName: row.companyName,
    logo: row.logo,
    price: p,
    prevClose: prev,
    change: PLUS.format(diff),
    percent: PERCENT.format(pct),
    changeRaw: diff,
    percentRaw: pct,
    category: row.category,
  };
}

module.exports.updatePrice = updatePrice;
module.exports.snapshot    = () => Array.from(cache.values());
