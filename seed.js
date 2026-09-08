require('dotenv').config();
const db = require('./database');
const myUserId = process.env.MY_USER_ID;

db.serialize(() => {
  db.run(`DELETE FROM events`);

  const stmt = db.prepare(`
    INSERT INTO events (event_name, type, target_day, target_month, start_date, message_template, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // 1. วันเกิดแฟน: เก็บปีเกิด 2008
  const birthdayMsg = `แฮปปี้เบิร์ธเดย์นะค้าเด็กดื้อ! 🎂🎉 วันนี้อายุครบ {age} ปีแล้ว มีความสุขมากๆนะคะ ดูแลสุขภาพตัวเองด้วยนะระวังอ้วนน้าาา  รักขี้ดื้อที่สุดเลยยอิอิ! 💕`;
  stmt.run('วันเกิดแฟน', 'yearly', 25, 9, '2008-09-25', birthdayMsg, myUserId);

  // 2. วันครบรอบ: เก็บวันเริ่มคบ ม.ค. 2024
  const anniversaryMsg = `สุขสันต์วันครบรอบนะค้าาาา! 💕 ตอนนี้เราคบกันมา {duration} แล้วน้าาา อยู่ให้พี่รักค้าแบบนี้ไปนานๆ น้าดื้อๆน้อย 🥰`;
  stmt.run('วันครบรอบคบกัน', 'monthly', 1, 0, '2024-01-01', anniversaryMsg, myUserId);

  stmt.finalize();
  console.log('Inserted dynamic events successfully!');
});