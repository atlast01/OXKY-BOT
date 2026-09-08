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

async function checkAndSendEvents() {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth() + 1; 

  console.log(`[Cron Job] กำลังตรวจสอบวันสำคัญประจำวันที่ ${currentDay}/${currentMonth}...`);

  db.all(`SELECT * FROM users`, [], (userErr, users) => {
    if (userErr || users.length === 0) return;

    db.all(`SELECT * FROM events`, [], async (eventErr, events) => {
      if (eventErr) return;

      for (const event of events) {
        let isMatch = false;

        if (event.type === 'yearly') {
          if (event.target_day === currentDay && event.target_month === currentMonth) {
            isMatch = true;
          }
        } else if (event.type === 'monthly') {
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

          for (const user of users) {
            try {
              await client.pushMessage({
                to: user.user_id,
                messages: [{ type: 'text', text: messageText }]
              });
              console.log(`✅ ส่งข้อความอัตโนมัติสำเร็จไปยัง ${user.user_id}: "${event.event_name}"`);
            } catch (error) {
              console.error(`❌ ส่งข้อความไม่สำเร็จ:`, error.originalError?.response?.data || error);
            }
          }
        }
      }
    });
  });
}

cron.schedule('1 0 * * *', () => {
  console.log('⏰ Cron Job เริ่มทำงานตามเวลาที่กำหนด (00:01 น.)');
  checkAndSendEvents();
});

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

  const userId = event.source.userId;
  const userText = event.message.text.trim();

  console.log(`Incoming message from ${userId}: "${userText}"`);

  db.get(`SELECT * FROM users WHERE user_id = ?`, [userId], async (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return;
    }

    if (!row) {
      if (userText === '25/09/2008') {
        db.run(`INSERT OR IGNORE INTO users (user_id) VALUES (?)`, [userId], (insErr) => {
          if (!insErr) {
            console.log(`✅ ยืนยันตัวตนสำเร็จสำหรับ User: ${userId}`);
          }
        });

        return client.replyMessage({
          replyToken: event.replyToken,
          messages: [{ type: 'text', text: '🎉 ยืนยันตัวตนสำเร็จ! ตอนนี้คุณเชื่อมต่อกับบอทรักษาความปลอดภัยและแจ้งเตือนเรียบร้อยแล้วครับ' }]
        });
      } else {
        return client.replyMessage({
          replyToken: event.replyToken,
          messages: [{ type: 'text', text: 'ขออภัยครับ บอทนี้ใช้งานเฉพาะบุคคล กรุณากรอกรหัสลับให้ถูกต้องเพื่อเข้าใช้งาน' }]
        });
      }
    }

    return client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: 'text', text: `Echo: ${userText}` }]
    });
  });
};

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} and Cron Job is scheduled.`);
});