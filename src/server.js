require("dotenv").config({ quiet: true });

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mysql = require("mysql2/promise");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const academicRoutes = require("./routes/academicRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const studentRoutes = require("./routes/studentRoutes");
const classRoutes = require("./routes/classRoutes");
const liveClassRoutes = require("./routes/liveClassRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const sectionRoutes = require("./routes/sectionRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const lectureSlotRoutes = require("./routes/lectureSlotRoutes");

const app = express();

const PORT = Number(process.env.PORT || 5000);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

function getMissingDbEnvVars() {
  return ["DB_HOST", "DB_NAME", "DB_USER"].filter((key) => !process.env[key]);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  namedPlaceholders: true,
});

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Middleware to attach pool to requests
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

app.get("/", (req, res) => {
  res.json({
    message: "School LMS API is running",
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health/db", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS server_time");

    res.json({
      status: "ok",
      database: "connected",
      driver: "mysql",
      serverTime: rows[0].server_time,
    });
  } catch (error) {
    next(error);
  }
});

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/lecture-slots", lectureSlotRoutes);
app.use("/api/live-classes", liveClassRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/academics", academicRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/attendance", attendanceRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    errors: error.errors || null,
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  try {
    const missingDbEnvVars = getMissingDbEnvVars();

    if (missingDbEnvVars.length > 0) {
      throw new Error(
        `Missing database environment variables: ${missingDbEnvVars.join(", ")}`,
      );
    }

    await pool.query("SELECT 1");

    app.listen(PORT, () => {
      console.log(`LMS server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MySQL.");
    console.error(error.message || error);
    console.error(
      "Check that XAMPP MySQL is running, the database exists, and lms-server/.env has the correct credentials.",
    );
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});

startServer();
