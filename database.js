const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./oxky_database.db');

db.serialize(() => {
  // ตารางเก็บข้อมูลวันสำคัญ
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
  `);

  // ตารางใหม่: เก็บรายชื่อผู้ใช้ที่ผ่านการยืนยันตัวตนแล้ว (Whitelist)
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE
    )
  `);

  console.log('Database and tables ready.');
});

module.exports = db;