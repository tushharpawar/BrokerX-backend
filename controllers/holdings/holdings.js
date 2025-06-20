const Holdings = require("../../models/Holdings");
const Orders = require("../../models/Orders");
const User = require("../../models/User");

// Add or update holding after a BUY order
exports.addHolding = async (req, res) => {
  try {
    const { userId, symbol, quantity, price } = req.body;
    const totalCost = quantity * price;

    // Deduct funds from user's balance
    const user = await User.findById(userId);
    if (!user || user.balance < totalCost) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    user.balance -= totalCost;
    await user.save();

    let holding = await Holdings.findOne({ userId, symbol });

    if (holding) {
      const totalQty = holding.quantity + quantity;
      const newAvg = ((holding.avgPrice * holding.quantity) + (price * quantity)) / totalQty;

      holding.quantity = totalQty;
      holding.avgPrice = newAvg;
    } else {
      holding = new Holdings({ userId, symbol, quantity, avgPrice: price });
    }

    await holding.save();

    // Save order to history
    await Orders.create({
      userId,
      symbol,
      type: "BUY",
      quantity,
      price,
      amount: totalCost,
    });

    res.status(200).json({ message: "Stock bought successfully", holding });
  } catch (err) {
    console.error("Error adding holding:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Sell holding and calculate P&L
exports.sellHolding = async (req, res) => {
  try {
    const { userId, symbol, quantity, price } = req.body;
    const holding = await Holdings.findOne({ userId, symbol });

    if (!holding || holding.quantity < quantity) {
      return res.status(400).json({ message: "Insufficient quantity" });
    }

    const saleValue = quantity * price;
    const costPrice = quantity * holding.avgPrice;
    const profitOrLoss = saleValue - costPrice;

    holding.quantity -= quantity;
    if (holding.quantity === 0) await holding.deleteOne();
    else await holding.save();

    // Update user's balance
    await User.findByIdAndUpdate(userId, { $inc: { balance: saleValue } });

    await Orders.create({
      userId,
      symbol,
      type: "SELL",
      quantity,
      price,
      amount: saleValue,
      profitOrLoss,
    });

    res.status(200).json({ message: "Stock sold", profitOrLoss });
  } catch (err) {
    console.error("Error selling holding:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get all holdings for a user
exports.getHoldings = async (req, res) => {
  try {
    const { userId } = req.params;
    const holdings = await Holdings.find({ userId });
    res.status(200).json(holdings);
  } catch (err) {
    console.error("Error fetching holdings:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
