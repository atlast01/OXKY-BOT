// Import required modules
const cron = require('node-cron');
const db = require('../config/database');
const { calculateAge, calculateDuration } = require('../utils/dateUtils');

// Main function to initialize and start the cron job
function startCronJob(client) {

  // Core function to check database events and send notifications 
  async function checkAndSendEvents() {
    // Get current date, day, and month
    const now = new Date();
    const currentDay = parseInt(now.toLocaleDateString('en-GB', { timeZone: 'Asia/Bangkok', day: 'numeric'}));
    const currentMonth = parseInt(now.toLocaleDateString('en-GB', { timeZone:'Asia/Bangkok', month: 'numeric'}));

    console.log(`[Cron Job] Checking events for date: ${currentDay}/${currentMonth}...`);

    // Step 1: Fetch all users from the database
    db.all(`SELECT * FROM users`, [], (userErr, users) => {
      if (userErr || users.length === 0) return;

      // Step 2: Fetch all scheduled events
      db.all(`SELECT * FROM events`, [], async (eventErr, events) => {
        if (eventErr) return;

        // Step 3: Loop through each event to find a motch for today
        for (const event of events) {
          let isMatch = false;

          // Match logic based on event type (yearly vs monthly)
          if (event.type === 'yearly') {
            if (event.target_day === currentDay && event.target_month === currentMonth) {
              isMatch = true;
            }
          } else if (event.type === 'monthly') {
            if (event.target_day === currentDay) {
              isMatch = true;
            }
          }

          // Step 4: If today matches the event date, prepare the message 
          if (isMatch) {
            let messageText = event.message_template;

            // Replace dinamic placeholders ({age} or {duration}) in the message
            if (event.type === 'yearly') {
              const age = calculateAge(event.start_date);
              messageText = messageText.replace('{age}', age);
            } else if (event.type === 'monthly') {
              const duration = calculateDuration(event.start_date);
              messageText = messageText.replace('{duration}', duration);
            }

            // Step 5: Send the prepared message to all registered users
            for (const user of users) {
              try {
                await client.pushMessage({
                  to: user.user_id,
                  messages: [{ type: 'text', text: messageText }]
                });
                console.log(`✅ Successfully sent message to ${user.user_id}: "${event.event_name}"`);
              } catch (error) {
                console.error(`❌ Failed to send message:`, error.originalError?.response?.data || error);
              }
            }
          }
        }
      });
    });
  }

  // Schedule the job to run daily at 00:01 (1 minute past midnight) in Asia/Bangkok timezone
  cron.schedule('1 0 * * *', () => {
    console.log('⏰ Cron Job triggered at  triggered at scheduled time (00:01).');
    checkAndSendEvents();
  }, {
    scheduled: true,
    timezone: "Asia/Bangkok"
  });
}

// Export the function to be used in index.js
module.exports = startCronJob;