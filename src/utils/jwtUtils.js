const crypto = require("crypto");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

function generateToken(payload, expiresIn = 86400) {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + expiresIn;

  const encodedPayload = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: issuedAt,
      exp: expiresAt,
    }),
  ).toString("base64");

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64");
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(data)
    .digest("base64");

  return `${data}.${signature}`;
}

function verifyToken(token) {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split(".");

    if (!encodedHeader || !encodedPayload || !signature) {
      throw new Error("Invalid token format");
    }

    const data = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(data)
      .digest("base64");

    if (signature !== expectedSignature) {
      throw new Error("Invalid token signature");
    }

    const payloadJson = Buffer.from(encodedPayload, "base64").toString();
    const payload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error("Token expired");
    }

    return payload;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

module.exports = { generateToken, verifyToken };
