const express = require("express");
const {
  getAcademicYears,
  createAcademicYear,
  getClasses,
  createClass,
  getSubjects,
  createSubject,
  getSections,
  createSection,
  assignTeacherToSubject,
  enrollStudentInClass,
} = require("../controllers/academicController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

// Academic Years
router.get("/years", authMiddleware, getAcademicYears);
router.post("/years", authMiddleware, requireRole("Admin"), createAcademicYear);

// Classes
router.get("/classes", authMiddleware, getClasses);
router.post("/classes", authMiddleware, requireRole("Admin"), createClass);

// Subjects
router.get("/subjects", authMiddleware, getSubjects);
router.post("/subjects", authMiddleware, requireRole("Admin"), createSubject);

// Sections
router.get("/sections", authMiddleware, getSections);
router.post("/sections", authMiddleware, requireRole("Admin"), createSection);

// Assignments
router.post(
  "/assign-teacher",
  authMiddleware,
  requireRole("Admin"),
  assignTeacherToSubject,
);
router.post(
  "/enroll-student",
  authMiddleware,
  requireRole("Admin"),
  enrollStudentInClass,
);

module.exports = router;
