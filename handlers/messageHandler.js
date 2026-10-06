const db = require('../config/database');

const handleEvent = async (event, client) => {
  // Ignore non-message events or non-text messages
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  const userText = event.message.text.trim();

  console.log(`Incoming message from ${userId}: "${userText}"`);

  // 1. Check if the user is in the blocked list
  db.get(`SELECT * FROM blocked_users WHERE user_id = ?`, [userId], async (blockErr, blockedRow) => {
    if (blockErr) {
      console.error('❌ Database error (checking blocked_users):', blockErr);
      return;
    }

    if (blockedRow) {
      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: '❌ บัญชีของคุณถูกระงับการใช้งานเนื่องจากกรอกรหัสไม่ถูกต้อง กรุณาติดต่อผู้พัฒนาเพื่อปลดล็อก' }]
      });
    }

    // 2. Check if the user is already verified (Whitelisted)
    db.get(`SELECT * FROM users WHERE user_id = ?`, [userId], async (userErr, userRow) => {
      if (userErr) {
        console.error('❌ Database error (checking users):', userErr);
        return;
      }

      if (userRow) {
        // Standard reply for verified users
        return client.replyMessage({
          replyToken: event.replyToken,
          messages: [{ type: 'text', text: `Echo: ${userText}` }]
        });
      }

      // 3. New user: Validate the secret code
      if (userText === '25/09/2008') {
        db.run(`INSERT OR IGNORE INTO users (user_id) VALUES (?)`, [userId], (insErr) => {
          if (!insErr) {
            console.log(`✅ Verification successful. Added User: ${userId} to whitelist.`);
          }
        });

        return client.replyMessage({
          replyToken: event.replyToken,
          messages: [{ type: 'text', text: '🎉 ยืนยันตัวตนสำเร็จ! ตอนนี้คุณเชื่อมต่อกับบอทแจ้งเตือนเรียบร้อยแล้วครับ' }]
        });
      } else {
        db.run(`INSERT OR IGNORE INTO blocked_users (user_id) VALUES (?)`, [userId], (lockErr) => {
          if (!lockErr) {
            console.log(`🚨 Incorrect code entered. User: ${userId} has been blocked.`);
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