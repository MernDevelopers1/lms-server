const express = require("express");
const {
  getLiveClasses,
  getLiveClassById,
  createLiveClass,
  updateLiveClass,
  deleteLiveClass,
} = require("../controllers/liveClassController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, requireRole("Admin"), getLiveClasses);
router.get("/:id", authMiddleware, requireRole("Admin"), getLiveClassById);
router.post("/", authMiddleware, requireRole("Admin"), createLiveClass);
router.put("/:id", authMiddleware, requireRole("Admin"), updateLiveClass);
router.delete("/:id", authMiddleware, requireRole("Admin"), deleteLiveClass);

module.exports = router;
