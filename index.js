const line = require('@line/bot-sdk');
const express = require('express');
const dotenv = require('dotenv');

// Import separated modules
const startCronJob = require('./jobs/cronJob'); 
const handleEvent = require('./handlers/messageHandler');

// Load environment variables for local testing
dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 5500;

// Configure LINE SDK using environment variables
const lineConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

// Start the Cron Job immediately and pass the LINE client
startCronJob(client);

// Webhook endpoint for receiving messages from LINE
app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  try {
    const events = req.body.events;
    
    // Process all events if there are any
    if (events.length > 0) {
      await Promise.all(events.map(item => handleEvent(item, client)));
    }
    
    // ALWAYS send 200 OK back to LINE server to acknowledge receipt
    res.status(200).send("OK");
  } catch (error) {
    console.error('❌ Webhook Error:', error);
    res.status(500).end();
  }
});

// Health check endpoint for keep-alive services (e.g., cron-job.org)
app.get('/', (req, res) => {
  res.status(200).send("Bot is alive!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT} and Cron Job is scheduled.`);
});