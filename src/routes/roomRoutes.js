const express = require("express");
const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} = require("../controllers/roomController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, requireRole("Admin"), getRooms);
router.get("/:id", authMiddleware, requireRole("Admin"), getRoomById);
router.post("/", authMiddleware, requireRole("Admin"), createRoom);
router.put("/:id", authMiddleware, requireRole("Admin"), updateRoom);
router.delete("/:id", authMiddleware, requireRole("Admin"), deleteRoom);

module.exports = router;
