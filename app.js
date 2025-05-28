require("dotenv").config();
require("express-async-errors");

const express = require("express");
const connectDB = require("./config/connect");
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");
const cors = require('cors');

const app = express();
app.use(express.json());


app.use(cors({
  origin: '*', // Allow all origins; restrict as needed for security
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Routers
const authRouter = require("./routes/auth.js");

app.use("/oauth", authRouter);


// Middleware
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// Start the server
const start = async () => {
  const ip='192.168.1.2'
  try {
    const res = await connectDB(process.env.MONGO_URI);
    if(res) console.log('DB connected!!')
    app.listen(3000,ip,() =>
      console.log(`HTTP server is running on port ${process.env.PORT || 'http://192.168.1.2:3000'}`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
