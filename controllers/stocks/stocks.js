// stocks.js
const axios = require("axios");

const TOKEN   = process.env.FINNHUB_API_KEY;
const REST    = "https://finnhub.io/api/v1";
const symbols = [               // choose ≤50 on free tier
  "AAPL","MSFT","NVDA","TSLA","AMZN","META",
  "GOOGL","AMD","NFLX","UBER"
];
module.exports.symbols = symbols;

const cache = new Map();        // symbol → { ...card }

/* fetch static company info + yesterday’s close */
(async function bootstrap () {
  await Promise.all(symbols.map(async (sym) => {
    const [profile, quote] = await Promise.all([
      axios.get(`${REST}/stock/profile2`, { params:{ symbol:sym, token:TOKEN }}),
      axios.get(`${REST}/quote`,         { params:{ symbol:sym, token:TOKEN }})
    ]);

    cache.set(sym, {
      symbol      : sym,
      companyName : profile.data.name         || sym,
      logo        : profile.data.logo         || "",
      price       : quote.data.c              || 0,
      prevClose   : quote.data.pc             || quote.data.c,
      change      : 0,
      percent     : "0.00%",
    });
  }));
  console.log("🗄️  cache primed");
})();

/* called every tick */
const DECIMALS = 2;        // change to 3 if you want finer %
const PLUS     = Intl.NumberFormat("en-US", { signDisplay: "always", minimumFractionDigits: DECIMALS, maximumFractionDigits: DECIMALS });
const PERCENT  = new Intl.NumberFormat("en-US", { signDisplay: "always", style: "percent", minimumFractionDigits: DECIMALS, maximumFractionDigits: DECIMALS });

function updatePrice(symbol, rawPrice) {

    console.log("Function called")
  const p = Number(rawPrice);          // ensure numeric
  if (!Number.isFinite(p)) return null;

  const row = cache.get(symbol);
  if (!row) return null;

  const prev = Number(row.prevClose);  // make sure it’s numeric
  const diff = p - prev;
  const pct  = prev ? diff / prev : 0;

  Object.assign(row, {
    price   : p,
    change  : diff,
    percent : pct
  });

  /* return formatted AND raw numbers */
  return {
    symbol      : symbol,
    companyName : row.companyName,
    logo        : row.logo,
    price       : p,
    change      : PLUS.format(diff),       // e.g. "+3.12"
    percent     : PERCENT.format(pct),     // e.g. "+1.65%"
    changeRaw   : diff,
    percentRaw  : pct
  };
}

module.exports.updatePrice = updatePrice;
module.exports.snapshot    = () => Array.from(cache.values());
