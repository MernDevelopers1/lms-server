require("dotenv").config({ quiet: true });

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error("Usage: node src/scripts/run-sql-file.js <path-to-sql-file>");
  process.exit(1);
}

const resolvedPath = path.resolve(process.cwd(), sqlFile);

async function run() {
  const sql = fs.readFileSync(resolvedPath, "utf8");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });

  try {
    await connection.query(sql);
    console.log(`Executed SQL file: ${resolvedPath}`);
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error(`Failed to execute SQL file: ${resolvedPath}`);
  console.error(error.message || error);
  process.exit(1);
});
