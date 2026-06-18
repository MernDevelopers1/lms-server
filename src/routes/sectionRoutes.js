const express = require("express");
const {
  getSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
} = require("../controllers/sectionController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, requireRole("Admin"), getSections);
router.get("/:id", authMiddleware, requireRole("Admin"), getSectionById);
router.post("/", authMiddleware, requireRole("Admin"), createSection);
router.put("/:id", authMiddleware, requireRole("Admin"), updateSection);
router.delete("/:id", authMiddleware, requireRole("Admin"), deleteSection);

module.exports = router;
