const express = require('express');
const { createTransaction, getTransactions } = require('../controllers/transactions/transactions');
const router = express.Router()

router.post('/create-transaction',createTransaction)
router.get('get-transactions/user/:userId',getTransactions)

module.exports = router;