const express = require("express");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, requireRole("Admin"), getAllUsers);
router.post("/", authMiddleware, requireRole("Admin"), createUser);
router.get("/:id", authMiddleware, getUserById);
router.put("/:id", authMiddleware, requireRole("Admin"), updateUser);
router.delete("/:id", authMiddleware, requireRole("Admin"), deleteUser);

module.exports = router;
