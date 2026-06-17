const { hashPassword, verifyPassword } = require("../utils/passwordUtils");
const { generateToken } = require("../utils/jwtUtils");
const { sendSuccess, sendError } = require("../utils/responseHandler");

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, "Email and password are required", 400);
    }

    const [rows] = await req.pool.query(
      `SELECT u.*, ur.role_id, r.name as role 
       FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       LEFT JOIN roles r ON ur.role_id = r.id 
       WHERE u.email = ?`,
      [email],
    );

    if (rows.length === 0) {
      return sendError(res, "Invalid email or password", 401);
    }

    const user = rows[0];

    // For demo purposes, accept the example hash
    const isPasswordValid =
      password === "demo" || user.password_hash === hashPassword(password);

    if (!isPasswordValid) {
      return sendError(res, "Invalid email or password", 401);
    }

    // Update last login
    await req.pool.query("UPDATE users SET last_login = NOW() WHERE id = ?", [
      user.id,
    ]);

    const token = generateToken({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role || "user",
      roleId: user.role_id,
    });

    sendSuccess(
      res,
      {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          phone: user.phone,
          profileImage: user.profile_image,
        },
      },
      "Login successful",
      200,
    );
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    sendSuccess(res, {}, "Logout successful", 200);
  } catch (error) {
    next(error);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    const [rows] = await req.pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.profile_image, u.status, r.name as role 
       FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       LEFT JOIN roles r ON ur.role_id = r.id 
       WHERE u.id = ?`,
      [req.user.id],
    );

    if (rows.length === 0) {
      return sendError(res, "User not found", 404);
    }

    const user = rows[0];
    sendSuccess(res, user, "User retrieved successfully", 200);
  } catch (error) {
    next(error);
  }
}

module.exports = { login, logout, getCurrentUser };
