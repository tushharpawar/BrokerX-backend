const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  symbol: String,
  type: { type: String, enum: ["BUY", "SELL"] },
  quantity: Number,
  price: Number,         // price per share
  amount: Number,        // quantity * price
  profitOrLoss: Number,  // for SELL only (optional)
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Orders", orderSchema);