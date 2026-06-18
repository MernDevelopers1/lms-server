const { sendSuccess, sendError } = require("../utils/responseHandler");
const { buildSortClause } = require("../utils/queryUtils");

async function getSections(req, res, next) {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 10);
    const search = (req.query.search || "").trim();
    const sortBy = String(req.query.sortBy || "").trim();
    const sortOrder = String(req.query.sortOrder || "asc").trim();
    const classId = req.query.classId ? parseInt(req.query.classId, 10) : null;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`(s.name LIKE ? OR c.name LIKE ?)`);
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    if (classId) {
      conditions.push(`s.class_id = ?`);
      params.push(classId);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sortClause = buildSortClause(
      sortBy,
      sortOrder,
      {
        name: "s.name",
        className: "c.name",
        academicYearTitle: "ay.title",
        capacity: "s.capacity",
      },
      "s.id DESC",
    );

    const [rows] = await req.pool.query(
      `SELECT s.id, s.name, s.capacity, s.class_id AS classId, c.name AS className, c.academic_year_id AS academicYearId, ay.title AS academicYearTitle
       FROM sections s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       ${whereClause}
       ${sortClause}
       LIMIT ?
       OFFSET ?`,
      [...params, limit, offset],
    );

    const [countRows] = await req.pool.query(
      `SELECT COUNT(*) AS count
       FROM sections s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       ${whereClause}`,
      params,
    );

    sendSuccess(
      res,
      {
        sections: rows,
        pagination: {
          total: Number(countRows[0].count || 0),
          page,
          limit,
          pages: Math.ceil(Number(countRows[0].count || 0) / limit),
        },
      },
      "Sections retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
}

async function getSectionById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await req.pool.query(
      `SELECT s.id, s.name, s.capacity, s.class_id AS classId, c.name AS className, c.academic_year_id AS academicYearId, ay.title AS academicYearTitle
       FROM sections s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE s.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return sendError(res, "Section not found", 404);
    }

    sendSuccess(res, rows[0], "Section retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function createSection(req, res, next) {
  try {
    const { name, classId, capacity } = req.body;

    if (!name || !classId) {
      return sendError(res, "Section name and class are required", 400);
    }

    if (capacity && (isNaN(capacity) || capacity <= 0)) {
      return sendError(res, "Capacity must be a positive number", 400);
    }

    // Check if class exists
    const [classes] = await req.pool.query(
      "SELECT id FROM classes WHERE id = ?",
      [classId],
    );

    if (classes.length === 0) {
      return sendError(res, "Class not found", 404);
    }

    // Check for duplicate section name in same class
    const [existingSection] = await req.pool.query(
      "SELECT id FROM sections WHERE name = ? AND class_id = ?",
      [name, classId],
    );

    if (existingSection.length > 0) {
      return sendError(
        res,
        "A section with this name already exists in the selected class",
        400,
      );
    }

    const [result] = await req.pool.query(
      "INSERT INTO sections (name, class_id, capacity) VALUES (?, ?, ?)",
      [name, classId, capacity || null],
    );

    const [newSectionRows] = await req.pool.query(
      `SELECT s.id, s.name, s.capacity, s.class_id AS classId, c.name AS className, c.academic_year_id AS academicYearId, ay.title AS academicYearTitle
       FROM sections s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE s.id = ?`,
      [result.insertId],
    );

    sendSuccess(res, newSectionRows[0], "Section created successfully", 201);
  } catch (error) {
    next(error);
  }
}

async function updateSection(req, res, next) {
  try {
    const { id } = req.params;
    const { name, classId, capacity } = req.body;

    const [existingSection] = await req.pool.query(
      "SELECT id FROM sections WHERE id = ?",
      [id],
    );

    if (existingSection.length === 0) {
      return sendError(res, "Section not found", 404);
    }

    if (classId) {
      const [classes] = await req.pool.query(
        "SELECT id FROM classes WHERE id = ?",
        [classId],
      );

      if (classes.length === 0) {
        return sendError(res, "Class not found", 404);
      }
    }

    if (
      capacity !== undefined &&
      capacity !== null &&
      (isNaN(capacity) || capacity <= 0)
    ) {
      return sendError(res, "Capacity must be a positive number", 400);
    }

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push("name = ?");
      values.push(name);
    }
    if (classId !== undefined) {
      updates.push("class_id = ?");
      values.push(classId);
    }
    if (capacity !== undefined) {
      updates.push("capacity = ?");
      values.push(capacity || null);
    }

    if (updates.length > 0) {
      values.push(id);
      await req.pool.query(
        `UPDATE sections SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );
    }

    const [updatedSection] = await req.pool.query(
      `SELECT s.id, s.name, s.capacity, s.class_id AS classId, c.name AS className, c.academic_year_id AS academicYearId, ay.title AS academicYearTitle
       FROM sections s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE s.id = ?`,
      [id],
    );

    sendSuccess(res, updatedSection[0], "Section updated successfully");
  } catch (error) {
    next(error);
  }
}

async function deleteSection(req, res, next) {
  try {
    const { id } = req.params;

    const [existingSection] = await req.pool.query(
      "SELECT id FROM sections WHERE id = ?",
      [id],
    );

    if (existingSection.length === 0) {
      return sendError(res, "Section not found", 404);
    }

    try {
      await req.pool.query("DELETE FROM sections WHERE id = ?", [id]);
      sendSuccess(res, {}, "Section deleted successfully");
    } catch (deleteError) {
      if (deleteError.code === "ER_ROW_IS_REFERENCED_2") {
        return sendError(
          res,
          "Cannot delete this section. The section has enrollments, timetable entries, or related records. Please remove these associations first.",
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
  getSections,
  getSectionById,
  createSection,
  updateSection,
  deleteSection,
};
