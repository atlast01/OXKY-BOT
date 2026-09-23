const db = require('../config/database');

const handleEvent = async (event, client) => {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  const userText = event.message.text.trim();

  console.log(`Incoming message from ${userId}: "${userText}"`);

  // 1. ตรวจสอบก่อนว่าผู้ใช้นี้ถูกบล็อกอยู่หรือไม่
  db.get(`SELECT * FROM blocked_users WHERE user_id = ?`, [userId], async (blockErr, blockedRow) => {
    if (blockErr) {
      console.error('Database error:', blockErr);
      return;
    }

    if (blockedRow) {
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: '❌ บัญชีของคุณถูกระงับการใช้งานเนื่องจากกรอกรหัสไม่ถูกต้อง กรุณาติดต่อผู้พัฒนาเพื่อปลดล็อก' }]
      });
    }

    // 2. ตรวจสอบว่าผ่านการยืนยันตัวตน (Whitelist) แล้วหรือยัง
    db.get(`SELECT * FROM users WHERE user_id = ?`, [userId], async (userErr, userRow) => {
      if (userErr) {
        console.error('Database error:', userErr);
        return;
      }

      if (userRow) {
        return client.replyMessage({
          replyToken: event.replyToken,
          messages: [{ type: 'text', text: `Echo: ${userText}` }]
        });
      }

      // 3. เป็นผู้ใช้ใหม่: ตรวจสอบรหัสลับ
      if (userText === '25/09/2008') {
        db.run(`INSERT OR IGNORE INTO users (user_id) VALUES (?)`, [userId], (insErr) => {
          if (!insErr) {
            console.log(`✅ ยืนยันตัวตนสำเร็จสำหรับ User: ${userId}`);
          }
        });

        return client.replyMessage({
          replyToken: event.replyToken,
          messages: [{ type: 'text', text: '🎉 ยืนยันตัวตนสำเร็จ! ตอนนี้คุณเชื่อมต่อกับบอทแจ้งเตือนเรียบร้อยแล้วครับ' }]
        });
      } else {
        db.run(`INSERT OR IGNORE INTO blocked_users (user_id) VALUES (?)`, [userId], (lockErr) => {
          if (!lockErr) {
            console.log(`🚨 กรอกรหัสผิด! ล็อก User: ${userId} เข้าสู่ตาราง blocked_users เรียบร้อย`);
          }
        });

        return client.replyMessage({
          replyToken: event.replyToken,
          messages: [{ type: 'text', text: '❌ รหัสลับไม่ถูกต้อง! บัญชีของคุณถูกล็อกการใช้งานถาวรแล้ว กรุณาติดต่อผู้พัฒนา' }]
        });
      }
    });
  });
};

module.exports = handleEvent;