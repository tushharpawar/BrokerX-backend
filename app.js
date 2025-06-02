require("dotenv").config();
require("express-async-errors");

const express = require("express");
const connectDB = require("./config/connect");
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");
const cors = require('cors');
const http = require("http");
const { Server }= require("socket.io");
const WebSocket = require("ws");
const stocks = require("./controllers/stocks/stocks.js"); 
const FINNWS= `wss://ws.finnhub.io?token=${process.env.FINNHUB_API_KEY}`;

const app = express();
app.use(express.json());

const server = http.createServer(app);
const io     = new Server(server, { cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  } });

io.on("connection", (socket) => {
  console.log(`Frontend client connected: ${socket.id}`);
});


app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Routers
const authRouter = require("./routes/auth.js");

app.use("/oauth", authRouter);
app.use("/user", require("./routes/user.js"));
app.get("/api/stocks", (_req, res) => {
  res.json(stocks.snapshot());
});


// Middleware
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

//WEb socket server

function connectFinnhub() {
  const ws = new WebSocket(FINNWS);

  ws.on("open", () => {
    console.log("✅ connected to Finnhub");
    stocks.symbols.forEach(sym => ws.send(JSON.stringify({ type:"subscribe", symbol:sym })));
  });

  ws.on("message", raw => {
    const msg = JSON.parse(raw);
    if (msg.type !== "trade") return;

    msg.data.forEach(tick => {
      const card = stocks.updatePrice(tick.s, tick.p);
      //Send the updated stock data to all connected clients
      if (card) io.emit("stock-update", card);          
    });
  });

  ws.on("close", () => {
    console.log("🔄 WS closed – reconnecting…");
    setTimeout(connectFinnhub, 3000);
  });

  ws.on("error", err => {
    console.error("Finnhub WS error", err.message);
    ws.close();
  });
}
connectFinnhub();

// Start the server and connect to the database
const start = async () => {
  const ip='192.168.1.2'
  try {
    const res = await connectDB(process.env.MONGO_URI);
    if(res) console.log('DB connected!!')
    server.listen(3000,ip,() =>
      console.log(`HTTP server is running on port ${process.env.PORT || 'http://192.168.1.2:3000'}`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
