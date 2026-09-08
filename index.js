const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios').default; // ลบ s ออก
const dotenv = require('dotenv');

const env = dotenv.config().parsed;
const app = express();

// 1. ดึงชื่อตัวแปรให้ตรงกับที่ตั้งไว้ในไฟล์ .env
const lineconfig = {
  channelAccessToken: env.CHANNEL_ACCESS_TOKEN,
  channelSecret: env.CHANNEL_SECRET
};

// 2. สร้าง Client สำหรับใช้ตอบข้อความกลับ
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: env.CHANNEL_ACCESS_TOKEN
});

app.post('/webhook', line.middleware(lineconfig), async (req, res) => {
  try {
    const events = req.body.events;
    console.log('events=>>>>', events);
    
    // 3. ใช้ Promise.all เพื่อให้ประมวลผลข้อความพร้อมกันได้ถูกต้อง
    return events.length > 0 
      ? await Promise.all(events.map(item => handleEvent(item))) 
      : res.status(200).send("OK");

  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

const handleEvent = async (event) => {
  console.log(event); 
  
  // ป้องกันเซิร์ฟเวอร์พังหากมี Event อื่นที่ไม่ใช่ข้อความส่งเข้ามา
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }
  
  // 4. ปรับโครงสร้างการ Reply ให้ตรงกับ SDK เวอร์ชันล่าสุด
  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [{ type: 'text', text: 'Test' }]
  });
};

app.listen(5500, () => {
  console.log('listening on 5500');
});