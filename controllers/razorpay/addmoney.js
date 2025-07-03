const Razorpay = require("razorpay");
const User = require("../../models/User");
const Transactions = require("../../models/Transactions");
const { createTransaction } = require("../transactions/transactions");

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_CLIENT_SECRET,
});

const createOrderRP = async (req, res) => {
  try {
    const { amount } = await req.body;
    const options = {
      amount: amount * 100,
      currency: "USD",
    };

    const orders = await razorpayInstance.orders.create(options);

    if (orders) {
      return res.status(201).json(orders);
    }
  } catch (error) {
    console.log("Error while creating order razorpay", error);
  }
};

const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    userId,
    amount,
  } = req.body;

  const secret = razorpayInstance.key_secret;
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  try {
    const isValidSignature = Razorpay.validateWebhookSignature(
      body,
      razorpay_signature,
      secret
    );
    if (isValidSignature) {
      const user = await User.findById(userId);
      if (!user) {
        console.log("User not found");
        return res.status(404).json({ status: 404, message: "User not found" });
      }
      // Update user's wallet balance
      user.balance = (user.balance || 0) + parseFloat(amount);
      await user.save();
      const transaction = new Transactions({
        userId: user._id,
        type:"ADD_FUNDS",
        amount: parseFloat(amount),
        note: "Funds added to wallet",
      });
      await transaction.save();
      console.log("Payment verified! && transaction created");
      console.log(`User ${userId} balance updated to ${user.balance}`);
      return res
      .status(200)
      .json({
        status: 201,
        success: true,
        message: "Payment verified and user balance updated",
      });
    } else {
      console.log("Not verified!");
      return res
        .status(401)
        .json({ status: 401, success: false, message: "Not verified" });
    }
  } catch (error) {
    console.log("Error while verifying order", error);
  }
};

const withdrawMoney = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    // Validate required fields
    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: "User ID and amount are required"
      });
    }

    // Validate amount
    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0"
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user has sufficient balance
    const currentBalance = user.balance || 0;
    if (currentBalance < withdrawAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
        currentBalance,
        requestedAmount: withdrawAmount
      });
    }

    // Deduct amount from user's balance
    user.balance = currentBalance - withdrawAmount;
    await user.save();

    // Create withdrawal transaction record
    const transaction = new Transactions({
      userId: user._id,
      type: "WITHDRAW",
      amount: withdrawAmount,
      note: "Funds withdrawn from wallet"
    });
    await transaction.save();

    console.log(`Withdrawal successful for user ${userId}. Amount: ${withdrawAmount}, New balance: ${user.balance}`);
    
    return res.status(200).json({
      success: true,
      message: "Withdrawal successful",
      transaction: {
        id: transaction._id,
        amount: withdrawAmount,
        type: "WITHDRAW",
        timestamp: transaction.createdAt
      },
      newBalance: user.balance
    });

  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while processing withdrawal"
    });
  }
};

module.exports = {
  createOrderRP,
  verifyPayment,
  withdrawMoney,
};
