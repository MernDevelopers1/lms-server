const crypto = require("crypto");

// Simple password hashing utility (in production, use bcrypt)
function hashPassword(password) {
  return crypto
    .pbkdf2Sync(password, "salt", 1000, 64, "sha512")
    .toString("hex");
}

function verifyPassword(password, hash) {
  const newHash = hashPassword(password);
  return newHash === hash;
}

module.exports = { hashPassword, verifyPassword };
