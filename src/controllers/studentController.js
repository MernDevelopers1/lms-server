const { sendSuccess, sendError } = require("../utils/responseHandler");
const { hashPassword } = require("../utils/passwordUtils");

async function getStudentRoleId(req) {
  const [roles] = await req.pool.query("SELECT id FROM roles WHERE name = ?", [
    "Student",
  ]);

  if (roles.length > 0) {
    return roles[0].id;
  }

  const [result] = await req.pool.query(
    "INSERT INTO roles (name, description, created_at) VALUES (?, ?, NOW())",
    ["Student", "Student role"],
  );

  return result.insertId;
}

async function getStudents(req, res, next) {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 10);
    const search = (req.query.search || "").trim();
    const offset = (page - 1) * limit;

    const conditions = ["r.name = ?"];
    const params = ["Student"];

    if (search) {
      conditions.push(
        `(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR sp.registration_no LIKE ? OR sp.admission_no LIKE ?)`,
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
      `SELECT u.id, u.first_name AS firstName, u.last_name AS lastName, u.email, u.phone, u.status, 
              sp.registration_no AS registrationNo, sp.admission_no AS admissionNo, sp.gender, 
              sp.date_of_birth AS dateOfBirth, sp.admission_date AS admissionDate, sp.address
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       ${whereClause}
       ORDER BY u.id DESC
       LIMIT ?
       OFFSET ?`,
      [...params, limit, offset],
    );

    const [countRows] = await req.pool.query(
      `SELECT COUNT(*) AS count
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       ${whereClause}`,
      params,
    );

    sendSuccess(
      res,
      {
        students: rows,
        pagination: {
          total: Number(countRows[0].count || 0),
          page,
          limit,
          pages: Math.ceil(Number(countRows[0].count || 0) / limit),
        },
      },
      "Students retrieved successfully",
    );
  } catch (error) {
    next(error);
  }
}

async function getStudentById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await req.pool.query(
      `SELECT u.id, u.first_name AS firstName, u.last_name AS lastName, u.email, u.phone, u.status, 
              sp.registration_no AS registrationNo, sp.admission_no AS admissionNo, sp.gender, 
              sp.date_of_birth AS dateOfBirth, sp.admission_date AS admissionDate, sp.address
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.id = ? AND r.name = ?`,
      [id, "Student"],
    );

    if (rows.length === 0) {
      return sendError(res, "Student not found", 404);
    }

    sendSuccess(res, rows[0], "Student retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function createStudent(req, res, next) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      registrationNo,
      admissionNo,
      gender,
      dateOfBirth,
      admissionDate,
      address,
      status = "active",
    } = req.body;

    if (!firstName || !lastName || !email || !password || !registrationNo) {
      return sendError(
        res,
        "First name, last name, email, password, and registration number are required",
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
      "SELECT id FROM student_profiles WHERE registration_no = ?",
      [registrationNo],
    );

    if (existingProfile.length > 0) {
      return sendError(res, "Registration number already exists", 400);
    }

    if (admissionNo) {
      const [existingAdmission] = await req.pool.query(
        "SELECT id FROM student_profiles WHERE admission_no = ?",
        [admissionNo],
      );

      if (existingAdmission.length > 0) {
        return sendError(res, "Admission number already exists", 400);
      }
    }

    const passwordHash = hashPassword(password);

    const [result] = await req.pool.query(
      "INSERT INTO users (first_name, last_name, email, password_hash, phone, status) VALUES (?, ?, ?, ?, ?, ?)",
      [firstName, lastName, email, passwordHash, phone || null, status],
    );

    const userId = result.insertId;
    const roleId = await getStudentRoleId(req);

    await req.pool.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)",
      [userId, roleId],
    );

    await req.pool.query(
      "INSERT INTO student_profiles (user_id, registration_no, admission_no, gender, date_of_birth, admission_date, address) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        userId,
        registrationNo,
        admissionNo || null,
        gender || null,
        dateOfBirth || null,
        admissionDate || null,
        address || null,
      ],
    );

    const [newStudentRows] = await req.pool.query(
      `SELECT u.id, u.first_name AS firstName, u.last_name AS lastName, u.email, u.phone, u.status, 
              sp.registration_no AS registrationNo, sp.admission_no AS admissionNo, sp.gender, 
              sp.date_of_birth AS dateOfBirth, sp.admission_date AS admissionDate, sp.address
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.id = ?`,
      [userId],
    );

    sendSuccess(res, newStudentRows[0], "Student created successfully", 201);
  } catch (error) {
    next(error);
  }
}

async function updateStudent(req, res, next) {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      status,
      registrationNo,
      admissionNo,
      gender,
      dateOfBirth,
      admissionDate,
      address,
    } = req.body;

    const [existingRows] = await req.pool.query(
      `SELECT u.id, u.email
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       WHERE u.id = ? AND r.name = ?`,
      [id, "Student"],
    );

    if (existingRows.length === 0) {
      return sendError(res, "Student not found", 404);
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

    if (registrationNo !== undefined) {
      profileUpdates.push("registration_no = ?");
      profileValues.push(registrationNo);
    }
    if (admissionNo !== undefined) {
      profileUpdates.push("admission_no = ?");
      profileValues.push(admissionNo || null);
    }
    if (gender !== undefined) {
      profileUpdates.push("gender = ?");
      profileValues.push(gender || null);
    }
    if (dateOfBirth !== undefined) {
      profileUpdates.push("date_of_birth = ?");
      profileValues.push(dateOfBirth || null);
    }
    if (admissionDate !== undefined) {
      profileUpdates.push("admission_date = ?");
      profileValues.push(admissionDate || null);
    }
    if (address !== undefined) {
      profileUpdates.push("address = ?");
      profileValues.push(address || null);
    }

    if (profileUpdates.length > 0) {
      profileValues.push(id);
      await req.pool.query(
        `UPDATE student_profiles SET ${profileUpdates.join(", ")} WHERE user_id = ?`,
        profileValues,
      );
    }

    const [updatedRows] = await req.pool.query(
      `SELECT u.id, u.first_name AS firstName, u.last_name AS lastName, u.email, u.phone, u.status, 
              sp.registration_no AS registrationNo, sp.admission_no AS admissionNo, sp.gender, 
              sp.date_of_birth AS dateOfBirth, sp.admission_date AS admissionDate, sp.address
       FROM users u
       LEFT JOIN student_profiles sp ON sp.user_id = u.id
       WHERE u.id = ?`,
      [id],
    );

    sendSuccess(res, updatedRows[0], "Student updated successfully");
  } catch (error) {
    next(error);
  }
}

async function deleteStudent(req, res, next) {
  try {
    const { id } = req.params;

    const [existingRows] = await req.pool.query(
      `SELECT u.id
       FROM users u
       JOIN user_roles ur ON u.id = ur.user_id
       JOIN roles r ON ur.role_id = r.id
       WHERE u.id = ? AND r.name = ?`,
      [id, "Student"],
    );

    if (existingRows.length === 0) {
      return sendError(res, "Student not found", 404);
    }

    try {
      await req.pool.query("DELETE FROM users WHERE id = ?", [id]);
      sendSuccess(res, {}, "Student deleted successfully");
    } catch (deleteError) {
      if (deleteError.code === "ER_ROW_IS_REFERENCED_2") {
        return sendError(
          res,
          "Cannot delete this student. The student has enrollments, submissions, or related records. Please remove these associations first.",
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
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};
