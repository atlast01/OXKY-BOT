const db = require('./database');

// ฝัง LINE ID ของคุณไว้ที่นี่ถาวร
const myUserId = 'U465c7b1eeecf54b47b35cda82adb2003';

const args = process.argv.slice(2);
const action = args[0]; // คำสั่ง (list, clear, remove)
const targetUserId = args[1]; // LINE ID ที่ต้องการลบ (ถ้ามี)

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
  // ล้างข้อมูลทั้งหมดในระบบ
  db.serialize(() => {
    db.run(`DELETE FROM users`, (err) => {
      if (!err) console.log('🗑️ ล้างข้อมูล Whitelisted Users ทั้งหมดสำเร็จ');
    });
    db.run(`DELETE FROM blocked_users`, (err) => {
      if (!err) console.log('🗑️ ล้างข้อมูล Blocked Users ทั้งหมดสำเร็จ');
    });
  });
} else if (action === 'remove') {
  // ถ้าไม่ได้ใส่ไอดีต่อท้าย จะใช้ไอดีของคุณ (myUserId) อัตโนมัติ
  const idToRemove = targetUserId ? targetUserId : myUserId;

  db.serialize(() => {
    db.run(`DELETE FROM users WHERE user_id = ?`, [idToRemove], (err) => {
      if (!err) console.log(`🗑️ ลบ User ID: ${idToRemove} ออกจาก Whitelist แล้ว`);
    });
    db.run(`DELETE FROM blocked_users WHERE user_id = ?`, [idToRemove], (err) => {
      if (!err) console.log(`🔓 ปลดล็อก User ID: ${idToRemove} ออกจาก Blocked แล้ว`);
    });
  });
} else {
  console.log('=================================');
  console.log('คำสั่งใช้งาน test-whitelist.js:');
  console.log('  node test-whitelist.js list               -> ดูรายชื่อทั้งหมด');
  console.log('  node test-whitelist.js clear              -> ล้างข้อมูลทั้งหมด');
  console.log('  node test-whitelist.js remove             -> รีเซ็ต/ปลดล็อกไอดีของคุณคนเดียว');
  console.log('  node test-whitelist.js remove <USER_ID>   -> รีเซ็ต/ปลดล็อกไอดีอื่นๆ ตามที่ระบุ');
  console.log('=================================');
}