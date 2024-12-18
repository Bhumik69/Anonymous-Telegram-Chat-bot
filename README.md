# Anonymous Chat Bot 🤖

An **Anonymous Chat Bot** for Telegram, built with **Node.js**, **MongoDB**, and **node-telegram-bot-api**. This bot connects random users for anonymous conversations while ensuring user safety through features like reporting and banning.

---

## 🌟 Features
- **Anonymous Chatting**: Connects users randomly for private, anonymous conversations.
- **Media Sharing**: Supports sharing stickers, photos, videos, and documents during chats.
- **Admin Controls**:
  - View active users.
  - Ban/unban users.
- **Dynamic User Management**: Automatically tracks active and banned users in MongoDB.
- **Reporting System**: 
  - Users can report inappropriate chat partners.
  - Automatic banning for users with multiple reports.
- **Chat Logging**: Stores chat messages in a database for moderation.
- **User-Friendly Commands**: Simple and intuitive commands for easy interaction.

---

## 🚀 Commands

### User Commands
| Command      | Description                                       |
|--------------|---------------------------------------------------|
| `/start`     | Start the bot and register as a user.             |
| `/chat`      | Connect with a random user for a conversation.    |
| `/end`       | End the current chat session.                     |
| `/report`    | Report your chat partner for inappropriate behavior. |
| `/help`      | View available commands and bot information.      |

### Admin Commands
| Command      | Description                                       |
|--------------|---------------------------------------------------|
| `/users`     | View all registered user IDs.                     |
| `/ban [userId]`  | Ban a user by their Telegram chat ID.          |
| `/unban [userId]`| Unban a user by their Telegram chat ID.        |

---

## 🛠 Installation and Setup

### Prerequisites
- **Node.js** (v14 or higher recommended)
- **MongoDB** (local or cloud instance)
- **Telegram Bot Token** (get it from [BotFather](https://core.telegram.org/bots#botfather))

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/Anonymous-Telegram-Chat-bot.git
cd Anonymous-Telegram-Chat-bot
```

### Step 2: Install Dependencies
```
npm install
npm install dotenv mongodb mongoose node-telegram-bot-api
```

### Step 3: Configure Environment Variables

Open the `.env` file in your project folder and set the following variables:

```env
BOT_TOKEN=
ADMIN_IDS=123456789
MONGODB_URI=mongodb+srv://username:password@cluster0.jseqv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
Replace BOT_TOKEN= with your actual bot token.
The ADMIN_IDS field can include one or more admin IDs (separate multiple IDs with commas if needed).
Replace username and password in the MONGODB_URI field with your actual MongoDB credentials.
Update the .env file with the following details:
```
BOT_TOKEN=your-telegram-bot-token
MONGODB_URI=your-mongodb-connection-string
ADMIN_IDS=comma,separated,admin,ids
```

### Step 4: Start the Bot
```
node app.js
```

🌐 Environment Variables :- 
Variable	Description
BOT_TOKEN	The token for your Telegram bot (from BotFather).
MONGODB_URI	MongoDB connection string.
ADMIN_IDS	Comma-separated list of admin Telegram user IDs.

📜 License
This project is licensed under the MIT License.

📞 Contact and Support
Creator: @Bhumik_here01
Support Group: https://t.me/ChatBotSupport01
