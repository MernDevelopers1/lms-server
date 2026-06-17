const express = require("express");
const {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} = require("../controllers/teacherController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, requireRole("Admin"), getTeachers);
router.get("/:id", authMiddleware, requireRole("Admin"), getTeacherById);
router.post("/", authMiddleware, requireRole("Admin"), createTeacher);
router.put("/:id", authMiddleware, requireRole("Admin"), updateTeacher);
router.delete("/:id", authMiddleware, requireRole("Admin"), deleteTeacher);

module.exports = router;
