const { sendSuccess, sendError } = require("../utils/responseHandler");
const { buildSortClause } = require("../utils/queryUtils");

const LIVE_CLASS_STATUSES = ["scheduled", "live", "completed", "cancelled"];

async function getLiveClasses(req, res, next) {
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
      conditions.push(
        `(lc.title LIKE ? OR lc.description LIKE ? OR sec.name LIKE ? OR sub.name LIKE ? OR CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR lc.status LIKE ?)`,
      );
      const searchParam = `%${search}%`;
      params.push(
        searchParam,
        searchParam,
        searchParam,
        searchParam,
        searchParam,
        searchParam,
      );
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sortClause = buildSortClause(
      sortBy,
      sortOrder,
      {
        title: "lc.title",
        sectionName: "sec.name",
        className: "cl.name",
        subjectName: "sub.name",
        teacherName: "teacherName",
        startTime: "lc.start_time",
        status: "lc.status",
      },
      "lc.id DESC",
    );

    const [rows] = await req.pool.query(
      `SELECT lc.id,
              lc.section_id AS sectionId,
              sec.name AS sectionName,
              sec.class_id AS classId,
              cl.name AS className,
              lc.subject_id AS subjectId,
              sub.name AS subjectName,
              lc.teacher_id AS teacherId,
              CONCAT(u.first_name, ' ', u.last_name) AS teacherName,
              lc.title,
              lc.description,
              lc.zoom_meeting_id AS zoomMeetingId,
              lc.zoom_join_url AS zoomJoinUrl,
              lc.zoom_start_url AS zoomStartUrl,
              lc.start_time AS startTime,
              lc.duration_minutes AS durationMinutes,
              lc.recording_url AS recordingUrl,
              lc.status
         FROM live_classes lc
         LEFT JOIN sections sec ON sec.id = lc.section_id
         LEFT JOIN classes cl ON cl.id = sec.class_id
         LEFT JOIN subjects sub ON sub.id = lc.subject_id
         LEFT JOIN teacher_profiles tp ON tp.id = lc.teacher_id
         LEFT JOIN users u ON tp.user_id = u.id
         ${whereClause}
         ${sortClause}
         LIMIT ?
         OFFSET ?`,
      [...params, limit, offset],
    );

    const [countRows] = await req.pool.query(
      `SELECT COUNT(*) AS count
       FROM live_classes lc
       LEFT JOIN sections sec ON sec.id = lc.section_id
       LEFT JOIN classes cl ON cl.id = sec.class_id
       LEFT JOIN subjects sub ON sub.id = lc.subject_id
       LEFT JOIN teacher_profiles tp ON tp.id = lc.teacher_id
       LEFT JOIN users u ON tp.user_id = u.id
       ${whereClause}`,
      params,
    );

    sendSuccess(
      res,
      {
        liveClasses: rows,
        pagination: {
          total: Number(countRows[0].count || 0),
          page,
          limit,
          pages: Math.ceil(Number(countRows[0].count || 0) / limit),
        },
      },
      "Live classes retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
}

async function getLiveClassById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await req.pool.query(
      `SELECT lc.id,
              lc.section_id AS sectionId,
              sec.name AS sectionName,
              sec.class_id AS classId,
              cl.name AS className,
              lc.subject_id AS subjectId,
              sub.name AS subjectName,
              lc.teacher_id AS teacherId,
              CONCAT(u.first_name, ' ', u.last_name) AS teacherName,
              lc.title,
              lc.description,
              lc.zoom_meeting_id AS zoomMeetingId,
              lc.zoom_join_url AS zoomJoinUrl,
              lc.zoom_start_url AS zoomStartUrl,
              lc.start_time AS startTime,
              lc.duration_minutes AS durationMinutes,
              lc.recording_url AS recordingUrl,
              lc.status
         FROM live_classes lc
         LEFT JOIN sections sec ON sec.id = lc.section_id
         LEFT JOIN classes cl ON cl.id = sec.class_id
         LEFT JOIN subjects sub ON sub.id = lc.subject_id
         LEFT JOIN teacher_profiles tp ON tp.id = lc.teacher_id
         LEFT JOIN users u ON tp.user_id = u.id
         WHERE lc.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return sendError(res, "Live class not found", 404);
    }

    sendSuccess(res, rows[0], "Live class retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function createLiveClass(req, res, next) {
  try {
    const {
      sectionId,
      subjectId,
      teacherId,
      title,
      description,
      zoomMeetingId,
      zoomJoinUrl,
      zoomStartUrl,
      startTime,
      durationMinutes,
      recordingUrl,
      status,
    } = req.body;

    if (
      !sectionId ||
      !subjectId ||
      !teacherId ||
      !title ||
      !startTime ||
      !durationMinutes
    ) {
      return sendError(
        res,
        "Section, subject, teacher, title, start time, and duration are required",
        400,
      );
    }

    const normalizedStartTime = String(startTime).replace("T", " ");
    // Ensure format is YYYY-MM-DD HH:mm:ss (add :00 if only HH:mm)
    const formattedStartTime =
      normalizedStartTime.includes(":") &&
      normalizedStartTime.split(":").length === 2
        ? `${normalizedStartTime}:00`
        : normalizedStartTime;

    if (Number.isNaN(new Date(formattedStartTime).getTime())) {
      return sendError(res, "A valid start time is required", 400);
    }

    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
      return sendError(res, "Duration must be a positive integer", 400);
    }

    if (status && !LIVE_CLASS_STATUSES.includes(status)) {
      return sendError(
        res,
        `Status must be one of: ${LIVE_CLASS_STATUSES.join(", ")}`,
        400,
      );
    }

    const [sections] = await req.pool.query(
      "SELECT id FROM sections WHERE id = ?",
      [sectionId],
    );
    if (sections.length === 0) {
      return sendError(res, "Section not found", 404);
    }

    const [subjects] = await req.pool.query(
      "SELECT id FROM subjects WHERE id = ?",
      [subjectId],
    );
    if (subjects.length === 0) {
      return sendError(res, "Subject not found", 404);
    }

    const [teachers] = await req.pool.query(
      "SELECT id FROM teacher_profiles WHERE id = ?",
      [teacherId],
    );
    if (teachers.length === 0) {
      return sendError(res, "Teacher not found", 404);
    }

    const [result] = await req.pool.query(
      `INSERT INTO live_classes
         (section_id, subject_id, teacher_id, title, description, zoom_meeting_id, zoom_join_url, zoom_start_url, start_time, duration_minutes, recording_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sectionId,
        subjectId,
        teacherId,
        title,
        description || null,
        zoomMeetingId || null,
        zoomJoinUrl || null,
        zoomStartUrl || null,
        formattedStartTime,
        durationMinutes,
        recordingUrl || null,
        status || "scheduled",
      ],
    );

    const [newLiveClassRows] = await req.pool.query(
      `SELECT lc.id,
              lc.section_id AS sectionId,
              sec.name AS sectionName,
              sec.class_id AS classId,
              cl.name AS className,
              lc.subject_id AS subjectId,
              sub.name AS subjectName,
              lc.teacher_id AS teacherId,
              CONCAT(u.first_name, ' ', u.last_name) AS teacherName,
              lc.title,
              lc.description,
              lc.zoom_meeting_id AS zoomMeetingId,
              lc.zoom_join_url AS zoomJoinUrl,
              lc.zoom_start_url AS zoomStartUrl,
              lc.start_time AS startTime,
              lc.duration_minutes AS durationMinutes,
              lc.recording_url AS recordingUrl,
              lc.status
         FROM live_classes lc
         LEFT JOIN sections sec ON sec.id = lc.section_id
         LEFT JOIN classes cl ON cl.id = sec.class_id
         LEFT JOIN subjects sub ON sub.id = lc.subject_id
         LEFT JOIN teacher_profiles tp ON tp.id = lc.teacher_id
         LEFT JOIN users u ON tp.user_id = u.id
         WHERE lc.id = ?`,
      [result.insertId],
    );

    sendSuccess(
      res,
      newLiveClassRows[0],
      "Live class created successfully",
      201,
    );
  } catch (error) {
    next(error);
  }
}

async function updateLiveClass(req, res, next) {
  try {
    const { id } = req.params;
    const {
      sectionId,
      subjectId,
      teacherId,
      title,
      description,
      zoomMeetingId,
      zoomJoinUrl,
      zoomStartUrl,
      startTime,
      durationMinutes,
      recordingUrl,
      status,
    } = req.body;

    const [existing] = await req.pool.query(
      "SELECT id FROM live_classes WHERE id = ?",
      [id],
    );
    if (existing.length === 0) {
      return sendError(res, "Live class not found", 404);
    }

    const updates = [];
    const values = [];

    if (sectionId !== undefined) {
      const [sections] = await req.pool.query(
        "SELECT id FROM sections WHERE id = ?",
        [sectionId],
      );
      if (sections.length === 0) {
        return sendError(res, "Section not found", 404);
      }
      updates.push("section_id = ?");
      values.push(sectionId);
    }

    if (subjectId !== undefined) {
      const [subjects] = await req.pool.query(
        "SELECT id FROM subjects WHERE id = ?",
        [subjectId],
      );
      if (subjects.length === 0) {
        return sendError(res, "Subject not found", 404);
      }
      updates.push("subject_id = ?");
      values.push(subjectId);
    }

    if (teacherId !== undefined) {
      const [teachers] = await req.pool.query(
        "SELECT id FROM teacher_profiles WHERE id = ?",
        [teacherId],
      );
      if (teachers.length === 0) {
        return sendError(res, "Teacher not found", 404);
      }
      updates.push("teacher_id = ?");
      values.push(teacherId);
    }

    if (title !== undefined) {
      updates.push("title = ?");
      values.push(title);
    }

    if (description !== undefined) {
      updates.push("description = ?");
      values.push(description || null);
    }

    if (zoomMeetingId !== undefined) {
      updates.push("zoom_meeting_id = ?");
      values.push(zoomMeetingId || null);
    }

    if (zoomJoinUrl !== undefined) {
      updates.push("zoom_join_url = ?");
      values.push(zoomJoinUrl || null);
    }

    if (zoomStartUrl !== undefined) {
      updates.push("zoom_start_url = ?");
      values.push(zoomStartUrl || null);
    }

    if (startTime !== undefined) {
      const normalizedStartTime = String(startTime).replace("T", " ");
      // Ensure format is YYYY-MM-DD HH:mm:ss (add :00 if only HH:mm)
      const formattedStartTime =
        normalizedStartTime.includes(":") &&
        normalizedStartTime.split(":").length === 2
          ? `${normalizedStartTime}:00`
          : normalizedStartTime;

      if (Number.isNaN(new Date(formattedStartTime).getTime())) {
        return sendError(res, "A valid start time is required", 400);
      }
      updates.push("start_time = ?");
      values.push(formattedStartTime);
    }

    if (durationMinutes !== undefined) {
      if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
        return sendError(res, "Duration must be a positive integer", 400);
      }
      updates.push("duration_minutes = ?");
      values.push(durationMinutes);
    }

    if (recordingUrl !== undefined) {
      updates.push("recording_url = ?");
      values.push(recordingUrl || null);
    }

    if (status !== undefined) {
      if (!LIVE_CLASS_STATUSES.includes(status)) {
        return sendError(
          res,
          `Status must be one of: ${LIVE_CLASS_STATUSES.join(", ")}`,
          400,
        );
      }
      updates.push("status = ?");
      values.push(status);
    }

    if (updates.length > 0) {
      values.push(id);
      await req.pool.query(
        `UPDATE live_classes SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );
    }

    const [updatedRows] = await req.pool.query(
      `SELECT lc.id,
              lc.section_id AS sectionId,
              sec.name AS sectionName,
              sec.class_id AS classId,
              cl.name AS className,
              lc.subject_id AS subjectId,
              sub.name AS subjectName,
              lc.teacher_id AS teacherId,
              CONCAT(u.first_name, ' ', u.last_name) AS teacherName,
              lc.title,
              lc.description,
              lc.zoom_meeting_id AS zoomMeetingId,
              lc.zoom_join_url AS zoomJoinUrl,
              lc.zoom_start_url AS zoomStartUrl,
              lc.start_time AS startTime,
              lc.duration_minutes AS durationMinutes,
              lc.recording_url AS recordingUrl,
              lc.status
         FROM live_classes lc
         LEFT JOIN sections sec ON sec.id = lc.section_id
         LEFT JOIN classes cl ON cl.id = sec.class_id
         LEFT JOIN subjects sub ON sub.id = lc.subject_id
         LEFT JOIN teacher_profiles tp ON tp.id = lc.teacher_id
         LEFT JOIN users u ON tp.user_id = u.id
         WHERE lc.id = ?`,
      [id],
    );

    sendSuccess(res, updatedRows[0], "Live class updated successfully");
  } catch (error) {
    next(error);
  }
}

async function deleteLiveClass(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await req.pool.query(
      "SELECT id FROM live_classes WHERE id = ?",
      [id],
    );
    if (existing.length === 0) {
      return sendError(res, "Live class not found", 404);
    }

    try {
      await req.pool.query("DELETE FROM live_classes WHERE id = ?", [id]);
      sendSuccess(res, {}, "Live class deleted successfully");
    } catch (deleteError) {
      if (deleteError.code === "ER_ROW_IS_REFERENCED_2") {
        return sendError(
          res,
          "Cannot delete this live class because it has associated attendance records.",
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
  getLiveClasses,
  getLiveClassById,
  createLiveClass,
  updateLiveClass,
  deleteLiveClass,
};
