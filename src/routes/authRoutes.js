const express = require("express");
const {
  loginStudent,
  loginTeacher,
  loginAdmin,
  logout,
  getCurrentUser,
  setupAdmin,
} = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login/student", loginStudent);
router.post("/login/teacher", loginTeacher);
router.post("/login/admin", loginAdmin);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, getCurrentUser);
router.post("/setup-admin", setupAdmin);

module.exports = router;
