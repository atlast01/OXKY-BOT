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

// ส่งออกฟังก์ชันเพื่อให้ไฟล์อื่นสามารถดึงไปใช้งานได้
module.exports = {
  calculateAge,
  calculateDuration
};