const { sendSuccess, sendError } = require("../utils/responseHandler");

async function markAttendance(req, res, next) {
  try {
    const { classId, sectionId, subjectId, attendanceDate, records } = req.body;

    if (!classId || !attendanceDate || !records || records.length === 0) {
      return sendError(
        res,
        "Class ID, attendance date, and attendance records are required",
        400,
      );
    }

    const insertPromises = records.map((record) =>
      req.pool.query(
        "INSERT INTO attendance (student_id, class_id, section_id, subject_id, attendance_date, status) VALUES (?, ?, ?, ?, ?, ?)",
        [
          record.studentId,
          classId,
          sectionId || null,
          subjectId || null,
          attendanceDate,
          record.status || "present",
        ],
      ),
    );

    await Promise.all(insertPromises);

    sendSuccess(
      res,
      { recordsInserted: records.length },
      "Attendance marked successfully",
      201,
    );
  } catch (error) {
    next(error);
  }
}

async function getAttendance(req, res, next) {
  try {
    const { studentId, classId, fromDate, toDate, status } = req.query;
    let query = "SELECT * FROM attendance WHERE 1=1";
    const params = [];

    if (studentId) {
      query += " AND student_id = ?";
      params.push(studentId);
    }
    if (classId) {
      query += " AND class_id = ?";
      params.push(classId);
    }
    if (fromDate) {
      query += " AND attendance_date >= ?";
      params.push(fromDate);
    }
    if (toDate) {
      query += " AND attendance_date <= ?";
      params.push(toDate);
    }
    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY attendance_date DESC";

    const [rows] = await req.pool.query(query, params);
    sendSuccess(res, rows, "Attendance records retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function getAttendanceSummary(req, res, next) {
  try {
    const { studentId, classId } = req.query;

    if (!studentId) {
      return sendError(res, "Student ID is required", 400);
    }

    const [rows] = await req.pool.query(
      `SELECT 
        status, 
        COUNT(*) as count 
       FROM attendance 
       WHERE student_id = ? ${classId ? "AND class_id = ?" : ""}
       GROUP BY status`,
      classId ? [studentId, classId] : [studentId],
    );

    const summary = {};
    rows.forEach((row) => {
      summary[row.status] = row.count;
    });

    sendSuccess(res, summary, "Attendance summary retrieved successfully");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  markAttendance,
  getAttendance,
  getAttendanceSummary,
};
