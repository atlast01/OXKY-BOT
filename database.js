const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./oxky_database.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_name TEXT,
      type TEXT,
      target_day INTEGER,
      target_month INTEGER,
      start_date TEXT,      -- เพิ่ม: เก็บวันเกิด/วันเริ่มคบ (YYYY-MM-DD)
      message_template TEXT, -- เปลี่ยน: เก็บข้อความที่มี {age} และ {duration}
      user_id TEXT
    )
  `);
  console.log('Database and table ready.');
});

module.exports = db;