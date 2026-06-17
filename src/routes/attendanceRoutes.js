const express = require("express");
const {
  markAttendance,
  getAttendance,
  getAttendanceSummary,
} = require("../controllers/attendanceController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/mark",
  authMiddleware,
  requireRole("Teacher", "Admin"),
  markAttendance,
);
router.get("/", authMiddleware, getAttendance);
router.get("/summary", authMiddleware, getAttendanceSummary);

module.exports = router;
