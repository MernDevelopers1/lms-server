const express = require("express");
const {
  login,
  logout,
  getCurrentUser,
  setupAdmin,
} = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, getCurrentUser);
router.post("/setup-admin", setupAdmin);

module.exports = router;
