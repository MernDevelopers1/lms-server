const { sendSuccess, sendError } = require("../utils/responseHandler");
const { hashPassword } = require("../utils/passwordUtils");
const { buildSortClause } = require("../utils/queryUtils");

async function getTeacherRoleId(req) {
  const [roles] = await req.pool.query("SELECT id FROM roles WHERE name = ?", [
    "Teacher",
  ]);

  if (roles.length > 0) {
    return roles[0].id;
  }

  const [result] = await req.pool.query(
    "INSERT INTO roles (name, description, created_at) VALUES (?, ?, NOW())",
    ["Teacher", "Teacher role"],
  );

  return result.insertId;
}

async function getTeachers(req, res, next) {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 10);
    const search = (req.query.search || "").trim();
    const sortBy = String(req.query.sortBy || "").trim();
    const sortOrder = String(req.query.sortOrder || "asc").trim();
    const offset = (page - 1) * limit;

    const conditions = ["r.name = ?"];
    const params = ["Teacher"];

    if (search) {
      conditions.push(
        `(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR tp.employee_no LIKE ? OR tp.designation LIKE ?)`,
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

    const sortClause = buildSortClause(
      sortBy,
      sortOrder,
      {
        firstName: "u.first_name",
        lastName: "u.last_name",
        email: "u.email",
        employeeNo: "tp.employee_no",
        designation: "tp.designation",
        status: "u.status",
      },
      "u.id DESC",
    );

    const [rows] = await req.pool.query(
      `SELECT u.id, tp.id AS profileId, u.first_name AS firstName, u.last_name AS lastName, u.email, u.phone, u.status, tp.employee_no AS employeeNo, tp.designation, tp.qualification, tp.joining_date AS joiningDate, tp.address
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
       ${whereClause}
       ${sortClause}
       LIMIT ?
       OFFSET ?`,
      [...params, limit, offset],
    );

    const [countRows] = await req.pool.query(
      `SELECT COUNT(*) AS count
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
       ${whereClause}`,
      params,
    );

    sendSuccess(
      res,
      {
        teachers: rows,
        pagination: {
          total: Number(countRows[0].count || 0),
          page,
          limit,
          pages: Math.ceil(Number(countRows[0].count || 0) / limit),
        },
      },
      "Teachers retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
}

async function getTeacherById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await req.pool.query(
      `SELECT u.id, tp.id AS profileId, u.first_name AS firstName, u.last_name AS lastName, u.email, u.phone, u.status, tp.employee_no AS employeeNo, tp.designation, tp.qualification, tp.joining_date AS joiningDate, tp.address
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
       WHERE u.id = ? AND r.name = ?`,
      [id, "Teacher"],
    );

    if (rows.length === 0) {
      return sendError(res, "Teacher not found", 404);
    }

    sendSuccess(res, rows[0], "Teacher retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function createTeacher(req, res, next) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      employeeNo,
      designation,
      qualification,
      joiningDate,
      address,
      status = "active",
    } = req.body;

    if (!firstName || !lastName || !email || !password || !employeeNo) {
      return sendError(
        res,
        "First name, last name, email, password, and employee number are required",
        400,
      );
    }

    const [existingUser] = await req.pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existingUser.length > 0) {
      return sendError(res, "Email already exists", 400);
    }

    const [existingProfile] = await req.pool.query(
      "SELECT id FROM teacher_profiles WHERE employee_no = ?",
      [employeeNo],
    );

    if (existingProfile.length > 0) {
      return sendError(res, "Employee number already exists", 400);
    }

    const passwordHash = hashPassword(password);

    const [result] = await req.pool.query(
      "INSERT INTO users (first_name, last_name, email, password_hash, phone, status) VALUES (?, ?, ?, ?, ?, ?)",
      [firstName, lastName, email, passwordHash, phone || null, status],
    );

    const userId = result.insertId;
    const roleId = await getTeacherRoleId(req);

    await req.pool.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
      [userId, roleId],
    );

    await req.pool.query(
      "INSERT INTO teacher_profiles (user_id, employee_no, designation, qualification, joining_date, address) VALUES (?, ?, ?, ?, ?, ?)",
      [
        userId,
        employeeNo,
        designation || null,
        qualification || null,
        joiningDate || null,
        address || null,
      ],
    );

    const [newTeacherRows] = await req.pool.query(
      `SELECT u.id, u.first_name AS firstName, u.last_name AS lastName, u.email, u.phone, u.status, tp.employee_no AS employeeNo, tp.designation, tp.qualification, tp.joining_date AS joiningDate, tp.address
       FROM users u
       LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
       WHERE u.id = ?`,
      [userId],
    );

    sendSuccess(res, newTeacherRows[0], "Teacher created successfully", 201);
  } catch (error) {
    next(error);
  }
}

async function updateTeacher(req, res, next) {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      status,
      employeeNo,
      designation,
      qualification,
      joiningDate,
      address,
    } = req.body;

    const [existingRows] = await req.pool.query(
      `SELECT u.id, u.email
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       WHERE u.id = ? AND r.name = ?`,
      [id, "Teacher"],
    );

    if (existingRows.length === 0) {
      return sendError(res, "Teacher not found", 404);
    }

    const userRecord = existingRows[0];

    if (email && email !== userRecord.email) {
      const [duplicateEmail] = await req.pool.query(
        "SELECT id FROM users WHERE email = ? AND id != ?",
        [email, id],
      );
      if (duplicateEmail.length > 0) {
        return sendError(res, "Email already exists", 400);
      }
    }

    const userUpdates = [];
    const userValues = [];

    if (firstName !== undefined) {
      userUpdates.push("first_name = ?");
      userValues.push(firstName);
    }
    if (lastName !== undefined) {
      userUpdates.push("last_name = ?");
      userValues.push(lastName);
    }
    if (email !== undefined) {
      userUpdates.push("email = ?");
      userValues.push(email);
    }
    if (password !== undefined && password !== "") {
      userUpdates.push("password_hash = ?");
      userValues.push(hashPassword(password));
    }
    if (phone !== undefined) {
      userUpdates.push("phone = ?");
      userValues.push(phone || null);
    }
    if (status !== undefined) {
      userUpdates.push("status = ?");
      userValues.push(status);
    }

    if (userUpdates.length > 0) {
      userValues.push(id);
      await req.pool.query(
        `UPDATE users SET ${userUpdates.join(", ")} WHERE id = ?`,
        userValues,
      );
    }

    const profileUpdates = [];
    const profileValues = [];

    if (employeeNo !== undefined) {
      profileUpdates.push("employee_no = ?");
      profileValues.push(employeeNo);
    }
    if (designation !== undefined) {
      profileUpdates.push("designation = ?");
      profileValues.push(designation || null);
    }
    if (qualification !== undefined) {
      profileUpdates.push("qualification = ?");
      profileValues.push(qualification || null);
    }
    if (joiningDate !== undefined) {
      profileUpdates.push("joining_date = ?");
      profileValues.push(joiningDate || null);
    }
    if (address !== undefined) {
      profileUpdates.push("address = ?");
      profileValues.push(address || null);
    }

    if (profileUpdates.length > 0) {
      profileValues.push(id);
      await req.pool.query(
        `UPDATE teacher_profiles SET ${profileUpdates.join(", ")} WHERE user_id = ?`,
        profileValues,
      );
    }

    const [updatedRows] = await req.pool.query(
      `SELECT u.id, u.first_name AS firstName, u.last_name AS lastName, u.email, u.phone, u.status, tp.employee_no AS employeeNo, tp.designation, tp.qualification, tp.joining_date AS joiningDate, tp.address
       FROM users u
       LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
       WHERE u.id = ?`,
      [id],
    );

    sendSuccess(res, updatedRows[0], "Teacher updated successfully");
  } catch (error) {
    next(error);
  }
}

async function deleteTeacher(req, res, next) {
  try {
    const { id } = req.params;

    const [existingRows] = await req.pool.query(
      `SELECT u.id
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       WHERE u.id = ? AND r.name = ?`,
      [id, "Teacher"],
    );

    if (existingRows.length === 0) {
      return sendError(res, "Teacher not found", 404);
    }

    try {
      await req.pool.query("DELETE FROM users WHERE id = ?", [id]);
      sendSuccess(res, {}, "Teacher deleted successfully");
    } catch (deleteError) {
      if (deleteError.code === "ER_ROW_IS_REFERENCED_2") {
        return sendError(
          res,
          "Cannot delete this teacher. The teacher is assigned to classes, subjects, or has related assignments. Please remove these associations first.",
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
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
};
