const express = require("express");
const {
  getLectureSlots,
  getLectureSlotById,
  createLectureSlot,
  updateLectureSlot,
  deleteLectureSlot,
} = require("../controllers/lectureSlotController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, requireRole("Admin"), getLectureSlots);
router.get("/:id", authMiddleware, requireRole("Admin"), getLectureSlotById);
router.post("/", authMiddleware, requireRole("Admin"), createLectureSlot);
router.put("/:id", authMiddleware, requireRole("Admin"), updateLectureSlot);
router.delete("/:id", authMiddleware, requireRole("Admin"), deleteLectureSlot);

module.exports = router;
