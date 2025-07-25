const express = require('express');
const { addHolding, sellHolding, getHoldings } = require('../controllers/holdings/holdings');
const router = express.Router();

router.post('/buy',addHolding)
router.post('/sell',sellHolding)
router.get('/user/:userId',getHoldings)

module.exports = router;