const db = require('./database');

// ฝัง LINE ID ของคุณไว้ที่นี่ถาวร
const myUserId = 'U465c7b1eeecf54b47b35cda82adb2003';

const args = process.argv.slice(2);
const action = args[0]; // คำสั่งย่อย (list หรือ clear)

if (action === 'list') {
  // ดูรายชื่อทั้งหมดในระบบ
  db.all(`SELECT * FROM users`, [], (err, users) => {
    console.log('=================================');
    console.log('🟢 Whitelisted Users (ผ่านแล้ว):');
    console.log(users.length > 0 ? users : 'ไม่มีข้อมูล');
    
    db.all(`SELECT * FROM blocked_users`, [], (blockErr, blocked) => {
      console.log('---------------------------------');
      console.log('🔴 Blocked Users (ถูกบล็อก):');
      console.log(blocked.length > 0 ? blocked : 'ไม่มีข้อมูล');
      console.log('=================================');
    });
  });
} else if (action === 'clear') {
  // ล้างข้อมูลทั้งหมดเพื่อเริ่มเทสใหม่ตั้งแต่ต้น
  db.serialize(() => {
    db.run(`DELETE FROM users`, (err) => {
      if (!err) console.log('🗑️ ล้างข้อมูล Whitelisted Users สำเร็จ');
    });
    db.run(`DELETE FROM blocked_users`, (err) => {
      if (!err) console.log('🗑️ ล้างข้อมูล Blocked Users สำเร็จ');
    });
  });
} else {
  console.log('=================================');
  console.log('คำสั่งใช้งาน test-whitelist.js:');
  console.log('  node test-whitelist.js list   -> ดูรายชื่อ Whitelist และ Block ทั้งหมด');
  console.log('  node test-whitelist.js clear  -> ล้างข้อมูลทั้งหมดเพื่อเริ่มเทสใหม่');
  console.log('=================================');
}