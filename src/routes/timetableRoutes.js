const express = require("express");
const {
  getTimetables,
  getTimetableById,
  createTimetable,
  updateTimetable,
  deleteTimetable,
} = require("../controllers/timetableController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, requireRole("Admin"), getTimetables);
router.get("/:id", authMiddleware, requireRole("Admin"), getTimetableById);
router.post("/", authMiddleware, requireRole("Admin"), createTimetable);
router.put("/:id", authMiddleware, requireRole("Admin"), updateTimetable);
router.delete("/:id", authMiddleware, requireRole("Admin"), deleteTimetable);

module.exports = router;
