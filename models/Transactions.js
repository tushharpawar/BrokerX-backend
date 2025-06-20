const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String, enum: ["ADD_FUNDS", "WITHDRAW", "ADJUSTMENT"] },
  amount: Number,
  note: String,
}, { timestamps: true });

module.exports = mongoose.model("Transactions", transactionSchema);