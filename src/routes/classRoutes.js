const express = require("express");
const {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
} = require("../controllers/classController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, requireRole("Admin"), getClasses);
router.get("/:id", authMiddleware, requireRole("Admin"), getClassById);
router.post("/", authMiddleware, requireRole("Admin"), createClass);
router.put("/:id", authMiddleware, requireRole("Admin"), updateClass);
router.delete("/:id", authMiddleware, requireRole("Admin"), deleteClass);

module.exports = router;
