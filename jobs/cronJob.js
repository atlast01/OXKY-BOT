const cron = require('node-cron');
const db = require('../config/database');
const { calculateAge, calculateDuration } = require('../utils/dateUtils');

function startCronJob(client) {
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
}

module.exports = startCronJob;