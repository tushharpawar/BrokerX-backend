
const express = require("express");
const router = express.Router();
const {
  createOrderRP,
  verifyPayment
} = require("../controllers/razorpay/addmoney");

router.post("/create-order", createOrderRP);
router.post("/verify-order", verifyPayment);

module.exports = router;
