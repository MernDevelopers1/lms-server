const { sendSuccess, sendError } = require("../utils/responseHandler");
const { hashPassword } = require("../utils/passwordUtils");

async function getAllUsers(req, res, next) {
  try {
    const { page = 1, limit = 10, role, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT u.*, r.name as role FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id LEFT JOIN roles r ON ur.role_id = r.id`;
    const params = [];

    const conditions = [];
    if (role) {
      conditions.push("r.name = ?");
      params.push(role);
    }
    if (status) {
      conditions.push("u.status = ?");
      params.push(status);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [rows] = await req.pool.query(query, params);
    const [countRows] = await req.pool.query(
      "SELECT COUNT(*) as count FROM users",
    );

    sendSuccess(
      res,
      {
        users: rows,
        pagination: {
          total: countRows[0].count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(countRows[0].count / limit),
        },
      },
      "Users retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await req.pool.query(
      `SELECT u.*, r.name as role FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       LEFT JOIN roles r ON ur.role_id = r.id 
       WHERE u.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return sendError(res, "User not found", 404);
    }

    // Get profile based on role
    const user = rows[0];
    let profile = null;

    if (user.role === "Teacher") {
      const [profileRows] = await req.pool.query(
        "SELECT * FROM teacher_profiles WHERE user_id = ?",
        [id],
      );
      profile = profileRows[0];
    } else if (user.role === "Student") {
      const [profileRows] = await req.pool.query(
        "SELECT * FROM student_profiles WHERE user_id = ?",
        [id],
      );
      profile = profileRows[0];
    } else if (user.role === "Parent") {
      const [profileRows] = await req.pool.query(
        "SELECT * FROM parent_profiles WHERE user_id = ?",
        [id],
      );
      profile = profileRows[0];
    }

    sendSuccess(res, { ...user, profile }, "User retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const { firstName, lastName, email, password, phone, roleId } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return sendError(
        res,
        "First name, last name, email, and password are required",
        400,
      );
    }

    // Check if email already exists
    const [existingUsers] = await req.pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existingUsers.length > 0) {
      return sendError(res, "Email already exists", 400);
    }

    const passwordHash = hashPassword(password);

    const [result] = await req.pool.query(
      "INSERT INTO users (first_name, last_name, email, password_hash, phone, status) VALUES (?, ?, ?, ?, ?, ?)",
      [firstName, lastName, email, passwordHash, phone || null, "active"],
    );

    const userId = result.insertId;

    if (roleId) {
      await req.pool.query(
        "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
        [userId, roleId],
      );
    }

    const [newUser] = await req.pool.query(
      `SELECT u.*, r.name as role FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       LEFT JOIN roles r ON ur.role_id = r.id 
       WHERE u.id = ?`,
      [userId],
    );

    sendSuccess(res, newUser[0], "User created successfully", 201);
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, status, roleId } = req.body;

    const [existingUser] = await req.pool.query(
      "SELECT id FROM users WHERE id = ?",
      [id],
    );

    if (existingUser.length === 0) {
      return sendError(res, "User not found", 404);
    }

    const updates = [];
    const values = [];

    if (firstName !== undefined) {
      updates.push("first_name = ?");
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push("last_name = ?");
      values.push(lastName);
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
    }

    if (updates.length > 0) {
      values.push(id);
      await req.pool.query(
        `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );
    }

    if (roleId !== undefined) {
      await req.pool.query("DELETE FROM user_roles WHERE user_id = ?", [id]);
      await req.pool.query(
        "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
        [id, roleId],
      );
    }

    const [updatedUser] = await req.pool.query(
      `SELECT u.*, r.name as role FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       LEFT JOIN roles r ON ur.role_id = r.id 
       WHERE u.id = ?`,
      [id],
    );

    sendSuccess(res, updatedUser[0], "User updated successfully");
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    const [existingUser] = await req.pool.query(
      "SELECT id FROM users WHERE id = ?",
      [id],
    );

    if (existingUser.length === 0) {
      return sendError(res, "User not found", 404);
    }

    await req.pool.query("DELETE FROM users WHERE id = ?", [id]);

    sendSuccess(res, {}, "User deleted successfully");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
