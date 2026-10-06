// Helper function to get current date components in Asia/Bangkok timezone
function getBangkokDate() {
  const now = new Date();
  return {
    year: parseInt(now.toLocaleDateString('en-GB', { timeZone: 'Asia/Bangkok', year: 'numeric' })),
    month: parseInt(now.toLocaleDateString('en-GB', { timeZone: 'Asia/Bangkok', month: 'numeric' })) - 1, // Subtract 1 to match JS 0-indexed months
    day: parseInt(now.toLocaleDateString('en-GB', { timeZone: 'Asia/Bangkok', day: 'numeric' }))
  };
}

// Function to calculate exact age in years based on birthdate
function calculateAge(birthDateStr) {
  const birthDate = new Date(birthDateStr);
  const today = getBangkokDate();
  
  let age = today.year - birthDate.getFullYear();
  const m = today.month - birthDate.getMonth();
  
  // Decrease age by 1 if the current month/day is before the birth month/day
  if (m < 0 || (m === 0 && today.day < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Function to calculate relationship duration in years and months
function calculateDuration(startDateStr) {
  const start = new Date(startDateStr);
  const today = getBangkokDate();
  
  let years = today.year - start.getFullYear();
  let months = today.month - start.getMonth();
  
  // Adjust months if the current day is before the start day
  if (today.day < start.getDate()) {
    months--;
  }
  
  // Adjust years if months become negative
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return `${years} ปี ${months} เดือน`;
}

// Export functions to be used in other files
module.exports = {
  calculateAge,
  calculateDuration
};