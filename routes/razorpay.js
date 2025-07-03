
const express = require("express");
const router = express.Router();
const {
  createOrderRP,
  verifyPayment,
  withdrawMoney
} = require("../controllers/razorpay/addmoney");

router.post("/create-order", createOrderRP);
router.post("/verify-order", verifyPayment);
router.post("/withdraw", withdrawMoney);

module.exports = router;
