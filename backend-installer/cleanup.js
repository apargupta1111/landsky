require('dotenv').config();
const pool = require('./src/config/db');

async function cleanup() {
  await pool.query("DELETE FROM pending_accounts WHERE email = 'agupta23_be22@thapar.edu'");
  console.log("Deleted pending account.");
  process.exit(0);
}

cleanup();
