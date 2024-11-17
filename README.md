Anonymous Chat Bot 🤖
An Anonymous Chat Bot for Telegram, built with Node.js, MongoDB, and node-telegram-bot-api. The bot connects random users for anonymous conversations while ensuring user safety with reporting and banning features.

Features
Anonymous Chatting: Users can chat anonymously with random people.
Media Sharing: Support for stickers, photos, videos, and documents during chats.
Admin Controls:
View active users.
Ban/unban users.
Dynamic User Management: Automatically tracks active and banned users in MongoDB.
Reporting System: Users can report inappropriate chat partners. Bans are triggered when a user is reported multiple times.
Chat Logging: Chat messages are logged in a database for moderation purposes.
User-Friendly Commands: Simple and intuitive commands for users.


Commands
User Commands
/start - Start the bot and register as a user.
/chat - Connect with a random user for a conversation.
/end - End the current chat session.
/report - Report your chat partner for inappropriate behavior.
/help - View available commands and bot information.
Admin Commands
/users - View all registered user IDs.
/ban [userId] - Ban a user by their Telegram chat ID.
/unban [userId] - Unban a user by their Telegram chat ID.


Installation and Setup
Prerequisites
Node.js (v14 or higher recommended)
MongoDB (local or cloud instance)
A Telegram Bot Token (get it from BotFather)

Step 1: Clone the Repository

git clone https://github.com/your-username/anonymous-chat-bot.git
cd anonymous-chat-bot

Step 2: Install Dependencies

npm install

npm install dotenv mongodb mongoose node-telegram-bot-api

Step 3: Configure Environment Variables
Create a .env file:

cp .env.example .env
Update the .env file with the following details:

BOT_TOKEN=your-telegram-bot-token
MONGODB_URI=your-mongodb-connection-string
ADMIN_IDS=comma,separated,admin,ids


Step 4: Start the Bot
Run the following command to start the bot:

node index.js

Environment Variables  :- Variable Description

BOT_TOKEN The token for your Telegram bot (from BotFather).

MONGODB_URI MongoDB connection string.

ADMIN_IDS Comma-separated list of admin Telegram user IDs.
Example .env file:


BOT_TOKEN=your-telegram-bot-token
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbName
ADMIN_IDS=123456789,987654321

Database Structure
The bot uses MongoDB to store user data, chat logs, and reports.

Collections
Users

chatId: Telegram chat ID of the user.
username: Telegram username.
banned: Boolean indicating if the user is banned.
Chats

user1: Chat ID of the first user.
user2: Chat ID of the second user.
messages: Array of messages exchanged between users.
Reports

reportedBy: Chat ID of the reporting user.
message: Reason or context for the report.
Admin Controls
Admins can manage users via these commands:

/users - View all registered user IDs.
/ban [userId] - Ban a user by their Telegram chat ID.
/unban [userId] - Unban a user by their Telegram chat ID.
Reporting System
Users can report inappropriate behavior with /report. If a user accumulates enough reports (configurable via REPORT_THRESHOLD), they will be automatically banned.

Future Enhancements
Improve matchmaking algorithms for better chat pairings.
Add support for group chats.
Implement rate-limiting to prevent spam and abuse.
Build a web dashboard for admins to manage the bot.
Contributing
Contributions are welcome! Feel free to fork the repository, submit pull requests, or report issues.

License
This project is licensed under the MIT License.

Contact and Support
If you need assistance or have feedback, contact the bot creator:

Creator: @Bhumik_here01
Support Group: Telegram ChatBot Support
