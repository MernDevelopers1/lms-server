const express = require("express");
const {
  getAssignments,
  createAssignment,
  submitAssignment,
  getSubmissions,
  gradeSubmission,
} = require("../controllers/assignmentController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getAssignments);
router.post(
  "/",
  authMiddleware,
  requireRole("Teacher", "Admin"),
  createAssignment,
);
router.post(
  "/submit",
  authMiddleware,
  requireRole("Student"),
  submitAssignment,
);
router.get("/submissions", authMiddleware, getSubmissions);
router.post(
  "/grade",
  authMiddleware,
  requireRole("Teacher", "Admin"),
  gradeSubmission,
);

module.exports = router;
