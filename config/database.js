const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Resolve the database path to the root directory
const dbPath = path.resolve(__dirname, '../oxky_database.db');

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
  }
});

db.serialize(() => {
  // Table for storing important events (birthdays, anniversaries)
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_name TEXT,
      type TEXT,
      target_day INTEGER,
      target_month INTEGER,
      start_date TEXT,
      message_template TEXT
    )
  `, (err) => {if (err) console.error('Error creating events table:', err.message); });

  // Table for storing whitelisted users who passed verification
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE
    )
  `, (err) => {if (err) console.error('Error creating users table:', err.message); });

  // Table for storing blocked users who entered the wrong secret code
  db.run(`
    CREATE TABLE IF NOT EXISTS blocked_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE
    )
    `, (err) => {if (err) console.error('Error creating blocked_users table:', err.message); });

  console.log('✅ Database, users, and blocked_users tables ready.');
});

module.exports = db;