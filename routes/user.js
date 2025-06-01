const express = require('express');
const { getProfile, updateProfile } = require('../controllers/user/user');
const router = express.Router();

router.route("/profile").get(getProfile).patch(updateProfile);

module.exports = router;