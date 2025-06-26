// socket/index.js
const { Server } = require("socket.io");
const WebSocket = require("ws");
const stocks = require("../controllers/stocks/stocks.js");

const FINNWS = `wss://ws.finnhub.io?token=${process.env.FINNHUB_API_KEY}`;

let io;
const clientSubscriptions = {};
const singleStockMap = {}; 
const alpacaConnections = {}; 
let ws;
let subscribedSymbols = new Set();

function connectAlpacaWS() {
  if (ws) return;
  ws = new WebSocket('wss://stream.data.alpaca.markets/v2/iex', {
    headers: {
      'APCA-API-KEY-ID': process.env.ALPACA_KEY,
      'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET
    }
  });

  ws.on("open", () => {
    ws.send(JSON.stringify({
      action: "auth",
      key: process.env.ALPACA_KEY,
      secret: process.env.ALPACA_SECRET,
    }));
  });

  ws.on("message", (raw) => {
    const msg = JSON.parse(raw);
    if (msg[0]?.T === "success" && msg[0]?.msg === "authenticated") {
      // Subscribe to all current symbols after auth
      if (subscribedSymbols.size > 0) {
        ws.send(JSON.stringify({ action: "subscribe", trades: Array.from(subscribedSymbols) }));
      }
    }
    if (msg[0]?.T === "t") {
      io.emit("alpaca-price-update", {
        symbol: msg[0].S,
        price: msg[0].p,
      });
    }
  });

  ws.on("error", (err) => {
    console.error("Alpaca WS Error:", err);
  });

  ws.on("close", () => {
    console.log("Alpaca WS closed");
    ws = null;
  });
}

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);
    clientSubscriptions[socket.id] = [];

    socket.on("subscribe-to-stock", (symbol) => {
      console.log(`🔔 Subscribing ${socket.id} to ${symbol} (card)`);
      socket.join(symbol);

      if (!clientSubscriptions[socket.id].includes(symbol)) {
        clientSubscriptions[socket.id].push(symbol);
      }

      if (!stocks.symbols.includes(symbol)) {
        stocks.symbols.push(symbol);
        if (global.finnhubSocket && global.finnhubSocket.readyState === 1) {
          global.finnhubSocket.send(
            JSON.stringify({ type: "subscribe", symbol })
          );
        }
      }
    });

  socket.on("subscribe-to-single", (symbol) => {
      console.log(`📥 ${socket.id} subscribing to SINGLE: ${symbol}`);

      // Overwrite with new symbol (only one at a time)
      singleStockMap[socket.id] = symbol;

      // Subscribe to the symbol on Finnhub WS if not already
      if (!stocks.symbols.includes(symbol)) {
        stocks.symbols.push(symbol);
        if (global.finnhubSocket && global.finnhubSocket.readyState === 1) {
          global.finnhubSocket.send(
            JSON.stringify({ type: "subscribe", symbol })
          );
        }
      }
    });

    socket.on("unsubscribe-from-single", () => {
      console.log(`🔌 ${socket.id} unsubscribed from single-stock`);
      delete singleStockMap[socket.id];
    });

    socket.on("subscribe-to-alpaca", (symbols) => {
    connectAlpacaWS();
    const newSymbols = new Set(symbols);

    // Subscribe to new symbols
    for (const symbol of newSymbols) {
      if (!subscribedSymbols.has(symbol)) {
        subscribedSymbols.add(symbol);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: "subscribe", trades: [symbol] }));
        }
      }
    }

    for (const symbol of subscribedSymbols) {
      if (!newSymbols.has(symbol)) {
        subscribedSymbols.delete(symbol);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: "unsubscribe", trades: [symbol] }));
        }
      }
    }
  });

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      delete singleStockMap[socket.id];
      delete clientSubscriptions[socket.id];
    });
  });

  connectFinnhub();
}

function connectFinnhub() {
  const ws = new WebSocket(FINNWS);
  global.finnhubSocket = ws;

  ws.on("open", () => {
    console.log("📡 Connected to Finnhub WebSocket");
    stocks.symbols.forEach((sym) => {
      ws.send(JSON.stringify({ type: "subscribe", symbol: sym }));
    });
  });

  ws.on("message", (raw) => {
    const msg = JSON.parse(raw);
    if (msg.type !== "trade") return;

    msg.data.forEach((tick) => {
      const { s: symbol, p: price } = tick;
      const card = stocks.updatePrice(symbol, price);
      if (card) io.emit("stock-update", card);
      Object.entries(singleStockMap).forEach(([socketId, subSymbol]) => {
        if (subSymbol === symbol) {
          const socket = io.sockets.sockets.get(socketId);
          if (socket) {
            socket.emit("stock-single-update", { symbol, price });
          }
        }
      });
    });
  });

  ws.on("close", () => {
    console.log("🔁 Finnhub WebSocket closed. Reconnecting...");
    setTimeout(connectFinnhub, 3000);
  });

  ws.on("error", (err) => {
    console.error("⚠️ Finnhub WS Error:", err.message);
    ws.close();
  });
}

module.exports = initSocket;
