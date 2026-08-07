const bcrypt = require("bcrypt");
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "LANDSKY",
  password: process.env.DB_PASSWORD || "postgres",
  port: process.env.DB_PORT || 5432,
});

async function run() {
  try {
    const hash = await bcrypt.hash("password123", 10);
    const res = await pool.query(
      "UPDATE users SET password = $1 WHERE username = 'superadmin' RETURNING id, username, email",
      [hash]
    );
    console.log("Updated superadmin password to 'password123'. DB output:", res.rows[0]);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

run();
