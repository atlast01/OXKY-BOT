# 🤖 OXKY-BOT (Automated LINE Notification Bot)

OXKY-BOT is a LINE application bot designed to act as an automated assistant for important date notifications, such as birthdays and anniversaries. The system runs a background check every day at 00:01 AM and automatically sends personalized greeting messages, dynamically calculating ages or relationship durations. It also features a strict whitelist security system to prevent unauthorized access.

## ✨ Key Features

*   **Automated Cron Job Notifications:** Automatically checks the database and sends important date notifications every midnight.
*   **Dynamic Message Templates:** Supports dynamic calculations within greeting messages (e.g., calculating yearly age or monthly duration).
*   **Security & Whitelist System:** 
    *   Users must enter a Secret Code correctly on their first interaction to verify their identity (added to the Whitelist).
    *   If the code is incorrect, the user is permanently added to the Blocked List and cannot interact with the bot.
*   **Modular Architecture:** The codebase is cleanly structured (Config, Utils, Jobs, Handlers) to ensure maintainability, readability, and long-term stability.

## 🛠 Tech Stack & Tools

*   **[Node.js](https://nodejs.org/):** The runtime environment for the backend server.
*   **[Express.js](https://expressjs.com/):** Web framework used to create the server and handle Webhook events.
*   **[SQLite3](https://www.sqlite.org/):** A lightweight, embedded database used for storing events, users, and blocked accounts.
*   **[node-cron](https://www.npmjs.com/package/node-cron):** A task scheduler library used to trigger the daily notification process.
*   **[@line/bot-sdk](https://github.com/line/line-bot-sdk-nodejs):** The official SDK for integrating with the LINE Messaging API.
*   **[LINE Developers Console](https://developers.line.biz/):** The platform used to manage the bot's Channel and Webhook settings.
*   **[ngrok](https://ngrok.com/):** A cross-platform application that exposes local servers to the public internet (used for Webhook testing).

---

## 📂 Project Structure

This project follows a Modular Architecture to separate concerns effectively:

```text
OXKY-BOT/
├── config/
│   └── database.js         # SQLite database connection and table creation
├── handlers/
│   └── messageHandler.js   # Chat logic (Whitelist/Blocklist checks, message responses)
├── jobs/
│   └── cronJob.js          # Task scheduling and automated message delivery logic
├── utils/
│   └── dateUtils.js        # Helper functions for calculating dates, ages, and durations
├── .env                    # Environment variables (Tokens, Secrets, Port)
├── index.js                # Main server entry point
└── package.json            # Node.js dependencies and project metadata
```
