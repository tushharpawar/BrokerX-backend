const Holdings = require("../../models/Holdings");
const Orders = require("../../models/Orders");
const User = require("../../models/User");
const axios = require('axios');

// Add or update holding after a BUY order
exports.addHolding = async (req, res) => {
  try {
    const { userId, symbol, quantity, price } = req.body;
    const totalCost = quantity * price;
  
    // Deduct funds from user's balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if ( user.balance < totalCost) {
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

    return res.status(200).json({ message: "Stock bought successfully", holding });
  } catch (err) {
    console.error("Error adding holding:", err);
    return res.status(500).json({ message: "Internal Server Error" });
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

    if (!holdings.length) {
      return res.status(200).json({ success: true, holdings: [] });
    }

    const apiKey = process.env.FINANCIAL_MODELING_PREP_API_KEY || "";

    // Fetch profile data for each symbol in parallel
    const profilePromises = holdings.map(h =>
      axios.get(`https://financialmodelingprep.com/api/v3/profile/${h.symbol}?apikey=${apiKey}`)
        .then(res => (Array.isArray(res.data) ? res.data[0] : null))
        .catch(() => null)
    );
    const profiles = await Promise.all(profilePromises);

    // Attach profile data (including logo) to each holding
    const newHoldings = holdings.map((h, i) => ({
      ...h.toObject(),
      profile: profiles[i] || {}
    }));

    return res.status(200).json({ success: true, holdings: newHoldings });
  } catch (err) {
    console.error("Error fetching holdings:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

