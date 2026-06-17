const { verifyToken } = require("../utils/jwtUtils");
const { sendError } = require("../utils/responseHandler");

function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.auth_token || null;

    if (!token) {
      return sendError(res, "Authentication failed: missing token", 401);
    }

    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return sendError(res, `Authentication failed: ${error.message}`, 401);
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, "User not authenticated", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, "Insufficient permissions", 403);
    }

    next();
  };
}

module.exports = { authMiddleware, requireRole };
