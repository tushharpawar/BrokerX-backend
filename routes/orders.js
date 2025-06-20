const express = require("express");
const getUserOrders = require("../controllers/orders/orders");
const router = express.Router();

router.get("/user/:userId",getUserOrders)

module.exports = router;