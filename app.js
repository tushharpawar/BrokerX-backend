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
const initSocket = require("./socket/index.js");
const FINNWS= `wss://ws.finnhub.io?token=${process.env.FINNHUB_API_KEY}`;

const app = express();
app.use(express.json());

const server = http.createServer(app);

initSocket(server); 

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
app.use("/api/stock", require("./routes/stocks"));
app.use("/api/razorpay",require("./routes/razorpay.js"));
app.use("/api/orders",require("./routes/orders.js"))
app.use("/api/holdings",require("./routes/holdings.js"));
app.use("/api/transactions",require("./routes/transactions.js"));
app.use("/api/news", require("./routes/news.js"));
app.use("/api/search", require("./routes/search.js"));

// Middleware
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);


// Start the server and connect to the database
const start = async () => {
  const ip='192.168.31.195'
  try {
    const res = await connectDB(process.env.MONGO_URI);
    if(res) console.log('DB connected!!')
    server.listen(5000,ip,() =>
      console.log(`HTTP server is running on port ${process.env.PORT || 'http://localhost:5000'}`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
