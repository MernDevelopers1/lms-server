const { sendSuccess, sendError } = require("../utils/responseHandler");

async function getAcademicYears(req, res, next) {
  try {
    const [rows] = await req.pool.query(
      "SELECT * FROM academic_years ORDER BY start_date DESC",
    );
    sendSuccess(res, rows, "Academic years retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function createAcademicYear(req, res, next) {
  try {
    const { title, startDate, endDate, isActive } = req.body;

    if (!title || !startDate || !endDate) {
      return sendError(
        res,
        "Title, start date, and end date are required",
        400,
      );
    }

    const [result] = await req.pool.query(
      "INSERT INTO academic_years (title, start_date, end_date, is_active) VALUES (?, ?, ?, ?)",
      [title, startDate, endDate, isActive || false],
    );

    const [newYear] = await req.pool.query(
      "SELECT * FROM academic_years WHERE id = ?",
      [result.insertId],
    );

    sendSuccess(res, newYear[0], "Academic year created successfully", 201);
  } catch (error) {
    next(error);
  }
}

async function getClasses(req, res, next) {
  try {
    const { academicYearId } = req.query;
    let query = "SELECT * FROM classes";
    const params = [];

    if (academicYearId) {
      query += " WHERE academic_year_id = ?";
      params.push(academicYearId);
    }

    const [rows] = await req.pool.query(query, params);
    sendSuccess(res, rows, "Classes retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function createClass(req, res, next) {
  try {
    const { name, academicYearId, maxStudents } = req.body;

    if (!name || !academicYearId) {
      return sendError(res, "Class name and academic year are required", 400);
    }

    const [result] = await req.pool.query(
      "INSERT INTO classes (name, academic_year_id, max_students) VALUES (?, ?, ?)",
      [name, academicYearId, maxStudents || 50],
    );

    const [newClass] = await req.pool.query(
      "SELECT * FROM classes WHERE id = ?",
      [result.insertId],
    );

    sendSuccess(res, newClass[0], "Class created successfully", 201);
  } catch (error) {
    next(error);
  }
}

async function getSubjects(req, res, next) {
  try {
    const [rows] = await req.pool.query("SELECT * FROM subjects");
    sendSuccess(res, rows, "Subjects retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function createSubject(req, res, next) {
  try {
    const { name, code, description } = req.body;

    if (!name || !code) {
      return sendError(res, "Subject name and code are required", 400);
    }

    const [result] = await req.pool.query(
      "INSERT INTO subjects (name, code, description) VALUES (?, ?, ?)",
      [name, code, description || null],
    );

    const [newSubject] = await req.pool.query(
      "SELECT * FROM subjects WHERE id = ?",
      [result.insertId],
    );

    sendSuccess(res, newSubject[0], "Subject created successfully", 201);
  } catch (error) {
    next(error);
  }
}

async function getSections(req, res, next) {
  try {
    const { classId } = req.query;
    let query = "SELECT * FROM sections";
    const params = [];

    if (classId) {
      query += " WHERE class_id = ?";
      params.push(classId);
    }

    const [rows] = await req.pool.query(query, params);
    sendSuccess(res, rows, "Sections retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function createSection(req, res, next) {
  try {
    const { name, classId, maxStudents } = req.body;

    if (!name || !classId) {
      return sendError(res, "Section name and class are required", 400);
    }

    const [result] = await req.pool.query(
      "INSERT INTO sections (name, class_id, max_students) VALUES (?, ?, ?)",
      [name, classId, maxStudents || 40],
    );

    const [newSection] = await req.pool.query(
      "SELECT * FROM sections WHERE id = ?",
      [result.insertId],
    );

    sendSuccess(res, newSection[0], "Section created successfully", 201);
  } catch (error) {
    next(error);
  }
}

async function assignTeacherToSubject(req, res, next) {
  try {
    const { teacherId, subjectId, classId } = req.body;

    if (!teacherId || !subjectId || !classId) {
      return sendError(
        res,
        "Teacher ID, subject ID, and class ID are required",
        400,
      );
    }

    const [result] = await req.pool.query(
      "INSERT INTO teacher_subjects (teacher_id, subject_id, class_id) VALUES (?, ?, ?)",
      [teacherId, subjectId, classId],
    );

    sendSuccess(
      res,
      { id: result.insertId },
      "Teacher assigned to subject successfully",
      201,
    );
  } catch (error) {
    next(error);
  }
}

async function enrollStudentInClass(req, res, next) {
  try {
    const { studentId, classId, sectionId } = req.body;

    if (!studentId || !classId) {
      return sendError(res, "Student ID and class ID are required", 400);
    }

    const [result] = await req.pool.query(
      "INSERT INTO student_enrollments (student_id, class_id, section_id) VALUES (?, ?, ?)",
      [studentId, classId, sectionId || null],
    );

    sendSuccess(
      res,
      { id: result.insertId },
      "Student enrolled successfully",
      201,
    );
  } catch (error) {
    next(error);
  }
}

module.exports = {
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
};
