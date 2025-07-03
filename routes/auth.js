const express = require("express");
const router = express.Router();
const {
  signInWithOauth,
  refreshToken,
  signUpWithOauth,
  logout,
  logoutAll,
} = require("../controllers/auth/auth");

router.post("/login", signInWithOauth);
router.post("/register", signUpWithOauth);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/logout-all", logoutAll);

module.exports = router;
