const express = require("express");
const {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} = require("../controllers/subjectController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, requireRole("Admin"), getSubjects);
router.get("/:id", authMiddleware, requireRole("Admin"), getSubjectById);
router.post("/", authMiddleware, requireRole("Admin"), createSubject);
router.put("/:id", authMiddleware, requireRole("Admin"), updateSubject);
router.delete("/:id", authMiddleware, requireRole("Admin"), deleteSubject);

module.exports = router;
