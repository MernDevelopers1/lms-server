const { sendSuccess, sendError } = require("../utils/responseHandler");

async function getAssignments(req, res, next) {
  try {
    const { classId, subjectId, teacherId } = req.query;
    let query = "SELECT * FROM assignments";
    const params = [];
    const conditions = [];

    if (classId) {
      conditions.push("class_id = ?");
      params.push(classId);
    }
    if (subjectId) {
      conditions.push("subject_id = ?");
      params.push(subjectId);
    }
    if (teacherId) {
      conditions.push("teacher_id = ?");
      params.push(teacherId);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY due_date DESC";

    const [rows] = await req.pool.query(query, params);
    sendSuccess(res, rows, "Assignments retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function createAssignment(req, res, next) {
  try {
    const {
      title,
      description,
      classId,
      subjectId,
      teacherId,
      dueDate,
      totalMarks,
    } = req.body;

    if (!title || !classId || !subjectId || !teacherId || !dueDate) {
      return sendError(
        res,
        "Title, class, subject, teacher, and due date are required",
        400,
      );
    }

    const [result] = await req.pool.query(
      "INSERT INTO assignments (title, description, class_id, subject_id, teacher_id, due_date, total_marks) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        title,
        description || null,
        classId,
        subjectId,
        teacherId,
        dueDate,
        totalMarks || 10,
      ],
    );

    const [newAssignment] = await req.pool.query(
      "SELECT * FROM assignments WHERE id = ?",
      [result.insertId],
    );

    sendSuccess(res, newAssignment[0], "Assignment created successfully", 201);
  } catch (error) {
    next(error);
  }
}

async function submitAssignment(req, res, next) {
  try {
    const { assignmentId, studentId, content, attachmentUrl } = req.body;

    if (!assignmentId || !studentId) {
      return sendError(res, "Assignment ID and student ID are required", 400);
    }

    const [result] = await req.pool.query(
      "INSERT INTO assignment_submissions (assignment_id, student_id, content, attachment_url, submitted_at) VALUES (?, ?, ?, ?, NOW())",
      [assignmentId, studentId, content || null, attachmentUrl || null],
    );

    const [submission] = await req.pool.query(
      "SELECT * FROM assignment_submissions WHERE id = ?",
      [result.insertId],
    );

    sendSuccess(res, submission[0], "Assignment submitted successfully", 201);
  } catch (error) {
    next(error);
  }
}

async function getSubmissions(req, res, next) {
  try {
    const { assignmentId, studentId } = req.query;
    let query = "SELECT * FROM assignment_submissions";
    const params = [];
    const conditions = [];

    if (assignmentId) {
      conditions.push("assignment_id = ?");
      params.push(assignmentId);
    }
    if (studentId) {
      conditions.push("student_id = ?");
      params.push(studentId);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    const [rows] = await req.pool.query(query, params);
    sendSuccess(res, rows, "Submissions retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function gradeSubmission(req, res, next) {
  try {
    const { submissionId, marksObtained, feedback } = req.body;

    if (submissionId === undefined || marksObtained === undefined) {
      return sendError(
        res,
        "Submission ID and marks obtained are required",
        400,
      );
    }

    await req.pool.query(
      "UPDATE assignment_submissions SET marks_obtained = ?, feedback = ?, graded_at = NOW() WHERE id = ?",
      [marksObtained, feedback || null, submissionId],
    );

    const [updatedSubmission] = await req.pool.query(
      "SELECT * FROM assignment_submissions WHERE id = ?",
      [submissionId],
    );

    sendSuccess(res, updatedSubmission[0], "Submission graded successfully");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAssignments,
  createAssignment,
  submitAssignment,
  getSubmissions,
  gradeSubmission,
};
