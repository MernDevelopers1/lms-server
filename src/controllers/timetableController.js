const { sendSuccess, sendError } = require("../utils/responseHandler");

async function getTimetables(req, res, next) {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 10);
    const search = (req.query.search || "").trim();
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(
        `(sub.name LIKE ? OR sec.name LIKE ? OR cl.name LIKE ? OR ls.title LIKE ? OR r.room_name LIKE ?)`,
      );
      const searchParam = `%${search}%`;
      params.push(
        searchParam,
        searchParam,
        searchParam,
        searchParam,
        searchParam,
      );
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await req.pool.query(
      `SELECT t.id,
              t.section_id AS sectionId,
              sec.name AS sectionName,
              cl.name AS className,
              t.subject_id AS subjectId,
              sub.name AS subjectName,
              t.teacher_id AS teacherId,
              CONCAT(u.first_name, ' ', u.last_name) AS teacherName,
              t.room_id AS roomId, r.room_name AS roomName, t.lecture_slot_id AS lectureSlotId,
              ls.title AS lectureSlotTitle, ls.start_time AS startTime, ls.end_time AS endTime,
              t.day_of_week AS dayOfWeek
             FROM timetable t
             LEFT JOIN sections sec ON sec.id = t.section_id
             LEFT JOIN classes cl ON cl.id = sec.class_id
             LEFT JOIN subjects sub ON t.subject_id = sub.id
             LEFT JOIN teacher_profiles tp ON t.teacher_id = tp.id
             LEFT JOIN users u ON tp.user_id = u.id
             LEFT JOIN rooms r ON t.room_id = r.id
             LEFT JOIN lecture_slots ls ON t.lecture_slot_id = ls.id
             ${whereClause}
             ORDER BY t.id DESC
             LIMIT ?
             OFFSET ?`,
      [...params, limit, offset],
    );

    const [countRows] = await req.pool.query(
      `SELECT COUNT(*) AS count
       FROM timetable t
       LEFT JOIN sections sec ON sec.id = t.section_id
       LEFT JOIN classes cl ON cl.id = sec.class_id
       LEFT JOIN subjects sub ON t.subject_id = sub.id
       LEFT JOIN teacher_profiles tp ON t.teacher_id = tp.id
       LEFT JOIN users u ON tp.user_id = u.id
       LEFT JOIN rooms r ON t.room_id = r.id
       LEFT JOIN lecture_slots ls ON t.lecture_slot_id = ls.id
       ${whereClause}`,
      params,
    );

    sendSuccess(
      res,
      {
        timetables: rows,
        pagination: {
          total: Number(countRows[0].count || 0),
          page,
          limit,
          pages: Math.ceil(Number(countRows[0].count || 0) / limit),
        },
      },
      "Timetables retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
}

async function getTimetableById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await req.pool.query(
      `SELECT t.id,
              t.section_id AS sectionId,
              sec.name AS sectionName,
              cl.name AS className,
              t.subject_id AS subjectId,
              sub.name AS subjectName,
              t.teacher_id AS teacherId,
              CONCAT(u.first_name, ' ', u.last_name) AS teacherName,
              t.room_id AS roomId, r.room_name AS roomName, t.lecture_slot_id AS lectureSlotId,
              ls.title AS lectureSlotTitle, ls.start_time AS startTime, ls.end_time AS endTime,
              t.day_of_week AS dayOfWeek
             FROM timetable t
             LEFT JOIN sections sec ON sec.id = t.section_id
             LEFT JOIN classes cl ON cl.id = sec.class_id
             LEFT JOIN subjects sub ON t.subject_id = sub.id
             LEFT JOIN teacher_profiles tp ON t.teacher_id = tp.id
             LEFT JOIN users u ON tp.user_id = u.id
             LEFT JOIN rooms r ON t.room_id = r.id
             LEFT JOIN lecture_slots ls ON t.lecture_slot_id = ls.id
             WHERE t.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return sendError(res, "Timetable entry not found", 404);
    }

    sendSuccess(res, rows[0], "Timetable entry retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function createTimetable(req, res, next) {
  try {
    const {
      sectionId,
      subjectId,
      teacherId,
      roomId,
      lectureSlotId,
      dayOfWeek,
    } = req.body;

    if (
      !sectionId ||
      !subjectId ||
      !teacherId ||
      !lectureSlotId ||
      !dayOfWeek
    ) {
      return sendError(
        res,
        "Section, subject, teacher, lecture slot, and day of week are required",
        400,
      );
    }

    if (dayOfWeek < 1 || dayOfWeek > 7) {
      return sendError(res, "Day of week must be between 1 and 7", 400);
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

    const [slots] = await req.pool.query(
      "SELECT id FROM lecture_slots WHERE id = ?",
      [lectureSlotId],
    );
    if (slots.length === 0) {
      return sendError(res, "Lecture slot not found", 404);
    }

    if (roomId) {
      const [rooms] = await req.pool.query(
        "SELECT id FROM rooms WHERE id = ?",
        [roomId],
      );
      if (rooms.length === 0) {
        return sendError(res, "Room not found", 404);
      }
    }

    const [result] = await req.pool.query(
      "INSERT INTO timetable (section_id, subject_id, teacher_id, room_id, lecture_slot_id, day_of_week) VALUES (?, ?, ?, ?, ?, ?)",
      [
        sectionId,
        subjectId,
        teacherId,
        roomId || null,
        lectureSlotId,
        dayOfWeek,
      ],
    );

    const [newTimetableRows] = await req.pool.query(
      `SELECT t.id,
              t.section_id AS sectionId,
              sec.name AS sectionName,
              cl.name AS className,
              t.subject_id AS subjectId,
              sub.name AS subjectName,
              t.teacher_id AS teacherId,
              CONCAT(u.first_name, ' ', u.last_name) AS teacherName,
              t.room_id AS roomId, r.room_name AS roomName, t.lecture_slot_id AS lectureSlotId,
              ls.title AS lectureSlotTitle, ls.start_time AS startTime, ls.end_time AS endTime,
              t.day_of_week AS dayOfWeek
             FROM timetable t
             LEFT JOIN sections sec ON sec.id = t.section_id
             LEFT JOIN classes cl ON cl.id = sec.class_id
             LEFT JOIN subjects sub ON t.subject_id = sub.id
             LEFT JOIN teacher_profiles tp ON t.teacher_id = tp.id
             LEFT JOIN users u ON tp.user_id = u.id
             LEFT JOIN rooms r ON t.room_id = r.id
             LEFT JOIN lecture_slots ls ON t.lecture_slot_id = ls.id
             WHERE t.id = ?`,
      [result.insertId],
    );

    sendSuccess(
      res,
      newTimetableRows[0],
      "Timetable entry created successfully",
      201,
    );
  } catch (error) {
    next(error);
  }
}

async function updateTimetable(req, res, next) {
  try {
    const { id } = req.params;
    const {
      sectionId,
      subjectId,
      teacherId,
      roomId,
      lectureSlotId,
      dayOfWeek,
    } = req.body;

    const [existingRows] = await req.pool.query(
      "SELECT id FROM timetable WHERE id = ?",
      [id],
    );

    if (existingRows.length === 0) {
      return sendError(res, "Timetable entry not found", 404);
    }

    if (dayOfWeek && (dayOfWeek < 1 || dayOfWeek > 7)) {
      return sendError(res, "Day of week must be between 1 and 7", 400);
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

    if (lectureSlotId !== undefined) {
      const [slots] = await req.pool.query(
        "SELECT id FROM lecture_slots WHERE id = ?",
        [lectureSlotId],
      );
      if (slots.length === 0) {
        return sendError(res, "Lecture slot not found", 404);
      }
      updates.push("lecture_slot_id = ?");
      values.push(lectureSlotId);
    }

    if (dayOfWeek !== undefined) {
      updates.push("day_of_week = ?");
      values.push(dayOfWeek);
    }

    if (roomId !== undefined) {
      if (roomId && roomId !== null) {
        const [rooms] = await req.pool.query(
          "SELECT id FROM rooms WHERE id = ?",
          [roomId],
        );
        if (rooms.length === 0) {
          return sendError(res, "Room not found", 404);
        }
      }
      updates.push("room_id = ?");
      values.push(roomId || null);
    }

    if (updates.length > 0) {
      values.push(id);
      await req.pool.query(
        `UPDATE timetable SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );
    }

    const [updatedRows] = await req.pool.query(
      `SELECT t.id,
              t.section_id AS sectionId,
              sec.name AS sectionName,
              cl.name AS className,
              t.subject_id AS subjectId,
              sub.name AS subjectName,
              t.teacher_id AS teacherId,
              CONCAT(u.first_name, ' ', u.last_name) AS teacherName,
              t.room_id AS roomId, r.room_name AS roomName, t.lecture_slot_id AS lectureSlotId,
              ls.title AS lectureSlotTitle, ls.start_time AS startTime, ls.end_time AS endTime,
              t.day_of_week AS dayOfWeek
       FROM timetable t
       LEFT JOIN sections sec ON sec.id = t.section_id
       LEFT JOIN classes cl ON cl.id = sec.class_id
       LEFT JOIN subjects sub ON t.subject_id = sub.id
       LEFT JOIN teacher_profiles tp ON t.teacher_id = tp.id
       LEFT JOIN users u ON tp.user_id = u.id
       LEFT JOIN rooms r ON t.room_id = r.id
       LEFT JOIN lecture_slots ls ON t.lecture_slot_id = ls.id
       WHERE t.id = ?`,
      [id],
    );

    sendSuccess(res, updatedRows[0], "Timetable entry updated successfully");
  } catch (error) {
    next(error);
  }
}

async function deleteTimetable(req, res, next) {
  try {
    const { id } = req.params;

    const [existingRows] = await req.pool.query(
      "SELECT id FROM timetable WHERE id = ?",
      [id],
    );

    if (existingRows.length === 0) {
      return sendError(res, "Timetable entry not found", 404);
    }

    try {
      await req.pool.query("DELETE FROM timetable WHERE id = ?", [id]);
      sendSuccess(res, {}, "Timetable entry deleted successfully");
    } catch (deleteError) {
      if (deleteError.code === "ER_ROW_IS_REFERENCED_2") {
        return sendError(
          res,
          "Cannot delete this timetable entry. It has related records.",
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
  getTimetables,
  getTimetableById,
  createTimetable,
  updateTimetable,
  deleteTimetable,
};
