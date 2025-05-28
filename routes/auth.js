const express = require("express");
const router = express.Router();
const {
  signInWithOauth,
  refreshToken,
  signUpWithOauth,
} = require("../controllers/auth/auth");

router.post("/login", signInWithOauth);
router.post("/register", signUpWithOauth);
router.post("/refresh-token", refreshToken);

module.exports = router;
