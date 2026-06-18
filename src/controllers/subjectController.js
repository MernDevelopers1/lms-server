const { sendSuccess, sendError } = require("../utils/responseHandler");
const { buildSortClause } = require("../utils/queryUtils");

async function getSubjects(req, res, next) {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 10);
    const search = (req.query.search || "").trim();
    const sortBy = String(req.query.sortBy || "").trim();
    const sortOrder = String(req.query.sortOrder || "asc").trim();
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`(name LIKE ? OR code LIKE ? OR description LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sortClause = buildSortClause(
      sortBy,
      sortOrder,
      {
        code: "code",
        name: "name",
        totalMarks: "total_marks",
        passingMarks: "passing_marks",
      },
      "id DESC",
    );

    const [rows] = await req.pool.query(
      `SELECT id, code, name, description, total_marks AS totalMarks, passing_marks AS passingMarks, created_at AS createdAt, updated_at AS updatedAt
       FROM subjects
       ${whereClause}
       ${sortClause}
       LIMIT ?
       OFFSET ?`,
      [...params, limit, offset],
    );

    const [countRows] = await req.pool.query(
      `SELECT COUNT(*) AS count FROM subjects ${whereClause}`,
      params,
    );

    sendSuccess(
      res,
      {
        subjects: rows,
        pagination: {
          total: Number(countRows[0].count || 0),
          page,
          limit,
          pages: Math.ceil(Number(countRows[0].count || 0) / limit),
        },
      },
      "Subjects retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
}

async function getSubjectById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await req.pool.query(
      `SELECT id, code, name, description, total_marks AS totalMarks, passing_marks AS passingMarks, created_at AS createdAt, updated_at AS updatedAt
       FROM subjects
       WHERE id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return sendError(res, "Subject not found", 404);
    }

    sendSuccess(res, rows[0], "Subject retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function createSubject(req, res, next) {
  try {
    const { code, name, description, totalMarks, passingMarks } = req.body;

    if (!code || !name) {
      return sendError(res, "Subject code and name are required", 400);
    }

    // Validate marks
    const total = totalMarks ?? 100;
    const passing = passingMarks ?? 0;

    if (isNaN(total) || total <= 0) {
      return sendError(res, "Total marks must be a positive number", 400);
    }

    if (isNaN(passing) || passing < 0 || passing > total) {
      return sendError(
        res,
        "Passing marks must be between 0 and total marks",
        400,
      );
    }

    // Check for duplicate code
    const [existingCode] = await req.pool.query(
      "SELECT id FROM subjects WHERE code = ?",
      [code],
    );

    if (existingCode.length > 0) {
      return sendError(res, "Subject code already exists", 400);
    }

    const [result] = await req.pool.query(
      `INSERT INTO subjects (code, name, description, total_marks, passing_marks)
       VALUES (?, ?, ?, ?, ?)`,
      [code, name, description || null, total, passing],
    );

    const [newSubjectRows] = await req.pool.query(
      `SELECT id, code, name, description, total_marks AS totalMarks, passing_marks AS passingMarks, created_at AS createdAt, updated_at AS updatedAt
       FROM subjects
       WHERE id = ?`,
      [result.insertId],
    );

    sendSuccess(res, newSubjectRows[0], "Subject created successfully", 201);
  } catch (error) {
    next(error);
  }
}

async function updateSubject(req, res, next) {
  try {
    const { id } = req.params;
    const { code, name, description, totalMarks, passingMarks } = req.body;

    const [existing] = await req.pool.query(
      "SELECT id FROM subjects WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return sendError(res, "Subject not found", 404);
    }

    // Validate marks if provided
    if (totalMarks !== undefined || passingMarks !== undefined) {
      const [currentSubject] = await req.pool.query(
        "SELECT total_marks, passing_marks FROM subjects WHERE id = ?",
        [id],
      );

      const total = totalMarks ?? currentSubject[0].total_marks;
      const passing = passingMarks ?? currentSubject[0].passing_marks;

      if (isNaN(total) || total <= 0) {
        return sendError(res, "Total marks must be a positive number", 400);
      }

      if (isNaN(passing) || passing < 0 || passing > total) {
        return sendError(
          res,
          "Passing marks must be between 0 and total marks",
          400,
        );
      }
    }

    // Check for duplicate code if updating code
    if (code !== undefined) {
      const [existingCode] = await req.pool.query(
        "SELECT id FROM subjects WHERE code = ? AND id != ?",
        [code, id],
      );

      if (existingCode.length > 0) {
        return sendError(res, "Subject code already exists", 400);
      }
    }

    const updates = [];
    const values = [];

    if (code !== undefined) {
      updates.push("code = ?");
      values.push(code);
    }
    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description || null);
    }
    if (totalMarks !== undefined) {
      updates.push("total_marks = ?");
      values.push(totalMarks);
    }
    if (passingMarks !== undefined) {
      updates.push("passing_marks = ?");
      values.push(passingMarks);
    }

    if (updates.length > 0) {
      values.push(id);
      await req.pool.query(
        `UPDATE subjects SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );
    }

    const [updatedSubject] = await req.pool.query(
      `SELECT id, code, name, description, total_marks AS totalMarks, passing_marks AS passingMarks, created_at AS createdAt, updated_at AS updatedAt
       FROM subjects
       WHERE id = ?`,
      [id],
    );

    sendSuccess(res, updatedSubject[0], "Subject updated successfully");
  } catch (error) {
    next(error);
  }
}

async function deleteSubject(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await req.pool.query(
      "SELECT id FROM subjects WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return sendError(res, "Subject not found", 404);
    }

    try {
      await req.pool.query("DELETE FROM subjects WHERE id = ?", [id]);
      sendSuccess(res, {}, "Subject deleted successfully");
    } catch (deleteError) {
      if (deleteError.code === "ER_ROW_IS_REFERENCED_2") {
        return sendError(
          res,
          "Cannot delete this subject. The subject is used in timetables, live classes, or other records. Please remove these associations first.",
          409,
        );
      }
      throw deleteError;
    }
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
};
