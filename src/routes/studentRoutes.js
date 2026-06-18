const express = require("express");
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, requireRole("Admin"), getStudents);
router.get("/:id", authMiddleware, requireRole("Admin"), getStudentById);
router.post("/", authMiddleware, requireRole("Admin"), createStudent);
router.put("/:id", authMiddleware, requireRole("Admin"), updateStudent);
router.delete("/:id", authMiddleware, requireRole("Admin"), deleteStudent);

module.exports = router;
