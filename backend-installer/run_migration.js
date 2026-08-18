require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./src/config/db');

async function runMigration() {
  const migrationFileName = process.argv[2] || 'src/migrations/002_create_pending_accounts.sql';
  const sqlFile = path.resolve(process.cwd(), migrationFileName);
  const sql = fs.readFileSync(sqlFile, 'utf8');

  // Split by statements (very basic split by semicolon, not robust but works for simple schemas)
  const statements = sql.split(';').filter(stmt => stmt.trim() !== '');

  for (let stmt of statements) {
    if (stmt.trim()) {
      console.log('Executing:', stmt.trim());
      try {
        await pool.query(stmt);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log('Field already exists, skipping...');
        } else {
          console.error('Error:', err.message);
        }
      }
    }
  }

  console.log('Migration complete.');
  process.exit(0);
}

runMigration();
