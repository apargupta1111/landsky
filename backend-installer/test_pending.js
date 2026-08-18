require('dotenv').config();
const pool = require('./src/config/db');

async function testPending() {
  try {
    const [rows] = await pool.query("SELECT id, email, username, first_name, last_name, phone, role, parent_email, created_at FROM pending_accounts WHERE parent_email = 'apargupta.02@gmail.com' ORDER BY created_at DESC");
    console.log("Pending rows:", rows);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

testPending();
