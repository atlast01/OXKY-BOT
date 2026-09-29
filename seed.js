require('dotenv').config();
const db = require('./config/database');

db.serialize(() => {
  // 1. --- ล็อก User ID ถาวร (เพิ่มโค้ดส่วนนี้เข้ามา) ---
  const myUsers = [
    "U465c7b1eeecf54b47b35cda82adb2003", // ไอดีของคุณ
    "U271b46725cdb53d138ea4d55a860e0de"     // นำไอดีของแฟนมาวางแทนข้อความนี้
  ];

  myUsers.forEach(userId => {
    // ใช้ INSERT OR IGNORE เพื่อป้องกันการ Error หากมีไอดีนี้อยู่แล้ว
    db.run(`INSERT OR IGNORE INTO users (user_id) VALUES (?)`, [userId], (err) => {
      if (err) {
        console.error(`❌ เกิดข้อผิดพลาดในการล็อก User ID: ${userId}`, err);
      } else {
        console.log(`✅ ล็อก User ID: ${userId} ลงฐานข้อมูลแล้ว`);
      }
    });
  });

  // 2. --- จัดการข้อมูล Events (โค้ดเดิมของคุณ) ---
  db.run(`DELETE FROM events`);

  const stmt = db.prepare(`
    INSERT INTO events (event_name, type, target_day, target_month, start_date, message_template)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // วันเกิดแฟน (รายปี)
  const birthdayMsg = `แฮปปี้เบิร์ธเดย์ที่รัก! 🎂🎉 วันนี้ครบ {age} ปีแล้ว มีความสุขมากๆ นะคะ จะอยู่แฮปปี้เบิร์ธเดย์ด้วยกันทุกปีเลย รักเธอที่สุด! 💕`;
  stmt.run('วันเกิดแฟน', 'yearly', 25, 9, '2008-09-25', birthdayMsg);

  // วันครบรอบ (รายเดือน)
  const anniversaryMsg = `สุขสันต์วันครบรอบนะเค้า! 💕 ตอนนี้เราคบกันมา {duration} แล้วนะ รักเค้าแบบนี้ไปนานๆ น้า 🥰`;
  stmt.run('วันครบรอบคบกัน', 'monthly', 1, 0, '2024-01-01', anniversaryMsg);

  stmt.finalize();
  console.log('✅ Inserted events successfully!');
});