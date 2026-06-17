const express = require("express");
const {
  login,
  logout,
  getCurrentUser,
} = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, getCurrentUser);

module.exports = router;
