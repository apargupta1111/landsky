const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  user: process.env.DB_USER || "root",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "LANDSKY",
  password: process.env.DB_PASSWORD || "root",
  port: process.env.DB_PORT || 3306,
});

async function run() {
  try {
    const hash = await bcrypt.hash("password123", 10);
    
    // MySQL does not support RETURNING, so we UPDATE first...
    await pool.query(
      "UPDATE users SET password = ? WHERE username = 'superadmin'",
      [hash]
    );

    // ...then SELECT the updated record to match the original script's output
    const [rows] = await pool.query(
      "SELECT id, username, email FROM users WHERE username = 'superadmin'"
    );

    console.log("Updated superadmin password to 'password123'. DB output:", rows[0]);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

run();