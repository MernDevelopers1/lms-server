const { sendSuccess, sendError } = require("../utils/responseHandler");

async function getClasses(req, res, next) {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 10);
    const search = (req.query.search || "").trim();
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`(c.name LIKE ? OR c.description LIKE ? OR ay.title LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await req.pool.query(
      `SELECT c.id, c.name, c.description, c.academic_year_id AS academicYearId, ay.title AS academicYearTitle
       FROM classes c
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       ${whereClause}
       ORDER BY c.id DESC
       LIMIT ?
       OFFSET ?`,
      [...params, limit, offset],
    );

    const [countRows] = await req.pool.query(
      `SELECT COUNT(*) AS count
       FROM classes c
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       ${whereClause}`,
      params,
    );

    sendSuccess(
      res,
      {
        classes: rows,
        pagination: {
          total: Number(countRows[0].count || 0),
          page,
          limit,
          pages: Math.ceil(Number(countRows[0].count || 0) / limit),
        },
      },
      "Classes retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
}

async function getClassById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await req.pool.query(
      `SELECT c.id, c.name, c.description, c.academic_year_id AS academicYearId, ay.title AS academicYearTitle
       FROM classes c
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE c.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return sendError(res, "Class not found", 404);
    }

    sendSuccess(res, rows[0], "Class retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function createClass(req, res, next) {
  try {
    const { name, description, academicYearId } = req.body;

    if (!name || !academicYearId) {
      return sendError(
        res,
        "Class name and academic year are required",
        400,
      );
    }

    // Check if academic year exists
    const [academicYears] = await req.pool.query(
      "SELECT id FROM academic_years WHERE id = ?",
      [academicYearId],
    );

    if (academicYears.length === 0) {
      return sendError(res, "Academic year not found", 404);
    }

    // Check for duplicate class name in same academic year
    const [existingClass] = await req.pool.query(
      "SELECT id FROM classes WHERE name = ? AND academic_year_id = ?",
      [name, academicYearId],
    );

    if (existingClass.length > 0) {
      return sendError(
        res,
        "A class with this name already exists in the selected academic year",
        400,
      );
    }

    const [result] = await req.pool.query(
      "INSERT INTO classes (name, description, academic_year_id) VALUES (?, ?, ?)",
      [name, description || null, academicYearId],
    );

    const [newClassRows] = await req.pool.query(
      `SELECT c.id, c.name, c.description, c.academic_year_id AS academicYearId, ay.title AS academicYearTitle
       FROM classes c
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE c.id = ?`,
      [result.insertId],
    );

    sendSuccess(res, newClassRows[0], "Class created successfully", 201);
  } catch (error) {
    next(error);
  }
}

async function updateClass(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, academicYearId } = req.body;

    const [existingClass] = await req.pool.query(
      "SELECT id FROM classes WHERE id = ?",
      [id],
    );

    if (existingClass.length === 0) {
      return sendError(res, "Class not found", 404);
    }

    if (academicYearId) {
      const [academicYears] = await req.pool.query(
        "SELECT id FROM academic_years WHERE id = ?",
        [academicYearId],
      );

      if (academicYears.length === 0) {
        return sendError(res, "Academic year not found", 404);
      }
    }

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description || null);
    }
    if (academicYearId !== undefined) {
      updates.push("academic_year_id = ?");
      values.push(academicYearId);
    }

    if (updates.length > 0) {
      values.push(id);
      await req.pool.query(
        `UPDATE classes SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );
    }

    const [updatedClass] = await req.pool.query(
      `SELECT c.id, c.name, c.description, c.academic_year_id AS academicYearId, ay.title AS academicYearTitle
       FROM classes c
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE c.id = ?`,
      [id],
    );

    sendSuccess(res, updatedClass[0], "Class updated successfully");
  } catch (error) {
    next(error);
  }
}

async function deleteClass(req, res, next) {
  try {
    const { id } = req.params;

    const [existingClass] = await req.pool.query(
      "SELECT id FROM classes WHERE id = ?",
      [id],
    );

    if (existingClass.length === 0) {
      return sendError(res, "Class not found", 404);
    }

    try {
      await req.pool.query("DELETE FROM classes WHERE id = ?", [id]);
      sendSuccess(res, {}, "Class deleted successfully");
    } catch (deleteError) {
      if (deleteError.code === "ER_ROW_IS_REFERENCED_2") {
        return sendError(
          res,
          "Cannot delete this class. The class has sections, enrollments, or related records. Please remove these associations first.",
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
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
};
