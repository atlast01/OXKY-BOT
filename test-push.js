require('dotenv').config();
const line = require('@line/bot-sdk');
const db = require('./database');

// สร้าง Client สำหรับส่ง Push Message
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

// ฟังก์ชันคำนวณอายุ (สำหรับวันเกิด)
function calculateAge(birthDateStr) {
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// ฟังก์ชันคำนวณระยะเวลาคบกัน (สำหรับวันครบรอบ)
function calculateDuration(startDateStr) {
  const start = new Date(startDateStr);
  const today = new Date();
  
  let years = today.getFullYear() - start.getFullYear();
  let months = today.getMonth() - start.getMonth();
  
  if (today.getDate() < start.getDate()) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return `${years} ปี ${months} เดือน`;
}

// ดึงข้อมูลทั้งหมดจากฐานข้อมูลมาทดสอบส่ง
db.all(`SELECT * FROM events WHERE type = 'monthly'`, [], async (err, rows) => {
  if (err) {
    console.error('Database error:', err);
    return;
  }

  for (const event of rows) {
    let messageText = event.message_template;

    // แทนที่คำว่า {age} หรือ {duration} ด้วยข้อมูลจริง
    if (event.type === 'yearly') {
      const age = calculateAge(event.start_date);
      messageText = messageText.replace('{age}', age);
    } else if (event.type === 'monthly') {
      const duration = calculateDuration(event.start_date);
      messageText = messageText.replace('{duration}', duration);
    }

    console.log(`กำลังส่งข้อความ: "${messageText}"...`);

    try {
      await client.pushMessage({
        to: event.user_id,
        messages: [{ type: 'text', text: messageText }]
      });
      console.log(`✅ ส่งข้อความ "${event.event_name}" สำเร็จเรียบร้อย!`);
    } catch (error) {
      console.error(`❌ ส่งไม่สำเร็จ:`, error.originalError?.response?.data || error);
    }
  }
});