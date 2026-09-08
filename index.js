const line = require('@line/bot-sdk');
const express = require('express');
const cron = require('node-cron');
const dotenv = require('dotenv');
const db = require('./database');

const env = dotenv.config().parsed;
const app = express();
const PORT = process.env.PORT || 5500;

const lineConfig = {
  channelAccessToken: env.CHANNEL_ACCESS_TOKEN,
  channelSecret: env.CHANNEL_SECRET
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: env.CHANNEL_ACCESS_TOKEN
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

// ฟังก์ชันตรวจสอบและส่งข้อความแจ้งเตือน
async function checkAndSendEvents() {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1; // เดือนใน JavaScript เริ่มจาก 0 (ม.ค. = 0)

  console.log(`[Cron Job] กำลังตรวจสอบวันสำคัญประจำวันที่ ${currentDay}/${currentMonth}...`);

  db.all(`SELECT * FROM events`, [], async (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return;
    }

    for (const event of rows) {
      let isMatch = false;

      if (event.type === 'yearly') {
        // วันเกิด: เช็กวันและเดือนให้ตรงกัน
        if (event.target_day === currentDay && event.target_month === currentMonth) {
          isMatch = true;
        }
      } else if (event.type === 'monthly') {
        // วันครบรอบ: เช็กแค่วันที่ตรงกันทุกเดือน
        if (event.target_day === currentDay) {
          isMatch = true;
        }
      }

      if (isMatch) {
        let messageText = event.message_template;

        if (event.type === 'yearly') {
          const age = calculateAge(event.start_date);
          messageText = messageText.replace('{age}', age);
        } else if (event.type === 'monthly') {
          const duration = calculateDuration(event.start_date);
          messageText = messageText.replace('{duration}', duration);
        }

        try {
          await client.pushMessage({
            to: event.user_id,
            messages: [{ type: 'text', text: messageText }]
          });
          console.log(`✅ ส่งข้อความอัตโนมัติสำเร็จ: "${event.event_name}"`);
        } catch (error) {
          console.error(`❌ ส่งข้อความไม่สำเร็จ:`, error.originalError?.response?.data || error);
        }
      }
    }
  });
}

// ตั้งเวลา Cron Job: ทำงานทุกวัน เวลา 00:01 น. (รูปแบบ: นาที ชั่วโมง วัน เดือน วันในสัปดาห์)
cron.schedule('1 0 * * *', () => {
  console.log('⏰ Cron Job เริ่มทำงานตามเวลาที่กำหนด (00:01 น.)');
  checkAndSendEvents();
});

// Webhook สำหรับรับข้อความทั่วไปจาก LINE
app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  try {
    const events = req.body.events;
    return events.length > 0 
      ? await Promise.all(events.map(item => handleEvent(item))) 
      : res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

const handleEvent = async (event) => {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }
  
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [{ type: 'text', text: `Echo: ${event.message.text}` }]
  });
};

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} and Cron Job is scheduled.`);
});