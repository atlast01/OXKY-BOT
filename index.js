const line = require('@line/bot-sdk');
const express = require('express');
const dotenv = require('dotenv');

// นำเข้าโมดูลที่เราแยกไว้
const startCronJob = require('./jobs/cronJob'); 
const handleEvent = require('./handlers/messageHandler');

// โหลด dotenv เฉพาะตอนรันบนเครื่อง Local (บน Render จะอ่านจากระบบอัตโนมัติ)
dotenv.config(); 

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

// เริ่มการทำงานของ Cron Job ทันทีโดยส่ง client ไปให้ด้วย
startCronJob(client);

app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  try {
    const events = req.body.events;
    return events.length > 0 
      // โยน event และตัวแปร client ไปให้ไฟล์ messageHandler จัดการ
      ? await Promise.all(events.map(item => handleEvent(item, client))) 
      : res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} and Cron Job is scheduled.`);
});