const { sendSuccess, sendError } = require("../utils/responseHandler");

async function getRooms(req, res, next) {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 10);
    const search = (req.query.search || "").trim();
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push("(room_no LIKE ? OR room_name LIKE ? OR building LIKE ?)");
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await req.pool.query(
      `SELECT id,
              room_no AS roomNo,
              room_name AS roomName,
              building,
              capacity
       FROM rooms
       ${whereClause}
       ORDER BY id DESC
       LIMIT ?
       OFFSET ?`,
      [...params, limit, offset],
    );

    const [countRows] = await req.pool.query(
      `SELECT COUNT(*) AS count
       FROM rooms
       ${whereClause}`,
      params,
    );

    sendSuccess(
      res,
      {
        rooms: rows,
        pagination: {
          total: Number(countRows[0].count || 0),
          page,
          limit,
          pages: Math.ceil(Number(countRows[0].count || 0) / limit),
        },
      },
      "Rooms retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
}

async function getRoomById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await req.pool.query(
      `SELECT id,
              room_no AS roomNo,
              room_name AS roomName,
              building,
              capacity
       FROM rooms
       WHERE id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return sendError(res, "Room not found", 404);
    }

    sendSuccess(res, rows[0], "Room retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function createRoom(req, res, next) {
  try {
    const { roomNo, roomName, building, capacity } = req.body;

    if (!roomNo || !roomNo.trim()) {
      return sendError(res, "Room number is required", 400);
    }

    if (capacity !== undefined && capacity !== null) {
      const capacityValue = Number(capacity);
      if (Number.isNaN(capacityValue) || capacityValue <= 0) {
        return sendError(res, "Capacity must be a positive number", 400);
      }
    }

    const [existingRooms] = await req.pool.query(
      "SELECT id FROM rooms WHERE room_no = ?",
      [roomNo],
    );

    if (existingRooms.length > 0) {
      return sendError(res, "Room number already exists", 400);
    }

    const [result] = await req.pool.query(
      "INSERT INTO rooms (room_no, room_name, building, capacity) VALUES (?, ?, ?, ?)",
      [roomNo.trim(), roomName || null, building || null, capacity || null],
    );

    const [newRoomRows] = await req.pool.query(
      `SELECT id,
              room_no AS roomNo,
              room_name AS roomName,
              building,
              capacity
       FROM rooms
       WHERE id = ?`,
      [result.insertId],
    );

    sendSuccess(res, newRoomRows[0], "Room created successfully", 201);
  } catch (error) {
    next(error);
  }
}

async function updateRoom(req, res, next) {
  try {
    const { id } = req.params;
    const { roomNo, roomName, building, capacity } = req.body;

    const [existingRoom] = await req.pool.query(
      "SELECT id FROM rooms WHERE id = ?",
      [id],
    );

    if (existingRoom.length === 0) {
      return sendError(res, "Room not found", 404);
    }

    const updates = [];
    const values = [];

    if (roomNo !== undefined) {
      if (!roomNo || !roomNo.trim()) {
        return sendError(res, "Room number cannot be empty", 400);
      }

      const [duplicateRoom] = await req.pool.query(
        "SELECT id FROM rooms WHERE room_no = ? AND id != ?",
        [roomNo, id],
      );
      if (duplicateRoom.length > 0) {
        return sendError(res, "Room number already exists", 400);
      }
      updates.push("room_no = ?");
      values.push(roomNo.trim());
    }

    if (roomName !== undefined) {
      updates.push("room_name = ?");
      values.push(roomName || null);
    }
    if (building !== undefined) {
      updates.push("building = ?");
      values.push(building || null);
    }
    if (capacity !== undefined) {
      if (capacity !== null && capacity !== "") {
        const capacityValue = Number(capacity);
        if (Number.isNaN(capacityValue) || capacityValue <= 0) {
          return sendError(res, "Capacity must be a positive number", 400);
        }
        values.push(capacityValue);
      } else {
        values.push(null);
      }
      updates.push("capacity = ?");
    }

    if (updates.length > 0) {
      values.push(id);
      await req.pool.query(`UPDATE rooms SET ${updates.join(", ")} WHERE id = ?`, values);
    }

    const [updatedRows] = await req.pool.query(
      `SELECT id,
              room_no AS roomNo,
              room_name AS roomName,
              building,
              capacity
       FROM rooms
       WHERE id = ?`,
      [id],
    );

    sendSuccess(res, updatedRows[0], "Room updated successfully");
  } catch (error) {
    next(error);
  }
}

async function deleteRoom(req, res, next) {
  try {
    const { id } = req.params;

    const [existingRoom] = await req.pool.query(
      "SELECT id FROM rooms WHERE id = ?",
      [id],
    );

    if (existingRoom.length === 0) {
      return sendError(res, "Room not found", 404);
    }

    try {
      await req.pool.query("DELETE FROM rooms WHERE id = ?", [id]);
      sendSuccess(res, {}, "Room deleted successfully");
    } catch (deleteError) {
      if (deleteError.code === "ER_ROW_IS_REFERENCED_2") {
        return sendError(
          res,
          "Cannot delete this room. It is referenced by other records.",
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
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
};
