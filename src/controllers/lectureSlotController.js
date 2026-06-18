const { sendSuccess, sendError } = require("../utils/responseHandler");

async function getLectureSlots(req, res, next) {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 10);
    const search = (req.query.search || "").trim();
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push("(title LIKE ?)");
      params.push(`%${search}%`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await req.pool.query(
      `SELECT id, title, start_time AS startTime, end_time AS endTime, created_at AS createdAt
       FROM lecture_slots
       ${whereClause}
       ORDER BY start_time ASC
       LIMIT ?
       OFFSET ?`,
      [...params, limit, offset],
    );
    console.log("rows :>> ", rows);
    const [countRows] = await req.pool.query(
      `SELECT COUNT(*) AS count FROM lecture_slots ${whereClause}`,
      params,
    );

    sendSuccess(
      res,
      {
        lectureSlots: rows,
        pagination: {
          total: Number(countRows[0].count || 0),
          page,
          limit,
          pages: Math.ceil(Number(countRows[0].count || 0) / limit),
        },
      },
      "Lecture slots retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
}

async function getLectureSlotById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await req.pool.query(
      `SELECT id, title, start_time AS startTime, end_time AS endTime, created_at AS createdAt
       FROM lecture_slots
       WHERE id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return sendError(res, "Lecture slot not found", 404);
    }

    sendSuccess(res, rows[0], "Lecture slot retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function createLectureSlot(req, res, next) {
  try {
    const { title, startTime, endTime } = req.body;

    if (!title || !startTime || !endTime) {
      return sendError(
        res,
        "Title, start time, and end time are required",
        400,
      );
    }

    // Validate time format (HH:MM:SS or HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return sendError(res, "Invalid time format. Use HH:MM or HH:MM:SS", 400);
    }

    // Validate that end_time > start_time
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);

    if (end <= start) {
      return sendError(res, "End time must be after start time", 400);
    }

    // Check for duplicate title
    const [existing] = await req.pool.query(
      "SELECT id FROM lecture_slots WHERE title = ?",
      [title],
    );

    if (existing.length > 0) {
      return sendError(res, "Lecture slot with this title already exists", 400);
    }

    // Insert lecture slot
    const [result] = await req.pool.query(
      "INSERT INTO lecture_slots (title, start_time, end_time) VALUES (?, ?, ?)",
      [title, startTime, endTime],
    );

    const [newSlotRows] = await req.pool.query(
      `SELECT id, title, start_time AS startTime, end_time AS endTime, created_at AS createdAt
       FROM lecture_slots
       WHERE id = ?`,
      [result.insertId],
    );

    sendSuccess(res, newSlotRows[0], "Lecture slot created successfully", 201);
  } catch (error) {
    next(error);
  }
}

async function updateLectureSlot(req, res, next) {
  try {
    const { id } = req.params;
    const { title, startTime, endTime } = req.body;

    const [existing] = await req.pool.query(
      "SELECT id FROM lecture_slots WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return sendError(res, "Lecture slot not found", 404);
    }

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (title !== undefined) {
      // Check for duplicate title
      const [titleExists] = await req.pool.query(
        "SELECT id FROM lecture_slots WHERE title = ? AND id != ?",
        [title, id],
      );

      if (titleExists.length > 0) {
        return sendError(
          res,
          "Lecture slot with this title already exists",
          400,
        );
      }

      updates.push("title = ?");
      values.push(title);
    }

    if (startTime !== undefined) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (!timeRegex.test(startTime)) {
        return sendError(
          res,
          "Invalid start time format. Use HH:MM or HH:MM:SS",
          400,
        );
      }

      updates.push("start_time = ?");
      values.push(startTime);
    }

    if (endTime !== undefined) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (!timeRegex.test(endTime)) {
        return sendError(
          res,
          "Invalid end time format. Use HH:MM or HH:MM:SS",
          400,
        );
      }

      updates.push("end_time = ?");
      values.push(endTime);
    }

    if (updates.length === 0) {
      return sendError(res, "No valid fields to update", 400);
    }

    // Get current values for time validation
    const [current] = await req.pool.query(
      "SELECT start_time, end_time FROM lecture_slots WHERE id = ?",
      [id],
    );

    const finalStartTime = startTime || current[0].start_time;
    const finalEndTime = endTime || current[0].end_time;

    // Validate time constraint
    const start = new Date(`2000-01-01 ${finalStartTime}`);
    const end = new Date(`2000-01-01 ${finalEndTime}`);

    if (end <= start) {
      return sendError(res, "End time must be after start time", 400);
    }

    values.push(id);
    const query = `UPDATE lecture_slots SET ${updates.join(", ")} WHERE id = ?`;

    await req.pool.query(query, values);

    const [updatedRows] = await req.pool.query(
      `SELECT id, title, start_time AS startTime, end_time AS endTime, created_at AS createdAt
       FROM lecture_slots
       WHERE id = ?`,
      [id],
    );

    sendSuccess(res, updatedRows[0], "Lecture slot updated successfully");
  } catch (error) {
    next(error);
  }
}

async function deleteLectureSlot(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await req.pool.query(
      "SELECT id FROM lecture_slots WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return sendError(res, "Lecture slot not found", 404);
    }

    // Check for foreign key constraints (timetable references)
    const [references] = await req.pool.query(
      "SELECT COUNT(*) as count FROM timetable WHERE lecture_slot_id = ?",
      [id],
    );

    if (references[0].count > 0) {
      return sendError(
        res,
        "Cannot delete lecture slot: it is referenced in timetables",
        409,
      );
    }

    await req.pool.query("DELETE FROM lecture_slots WHERE id = ?", [id]);

    sendSuccess(res, { id }, "Lecture slot deleted successfully");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getLectureSlots,
  getLectureSlotById,
  createLectureSlot,
  updateLectureSlot,
  deleteLectureSlot,
};
