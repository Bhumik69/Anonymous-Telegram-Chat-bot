require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const { User, Chat, Report } = require("./models"); // Import models
const fs = require("fs");
const path = require("path");

const BOT_TOKEN = process.env.BOT_TOKEN;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

let waitingUsers = [];
let activeChats = {};
const chatLogsDir = path.join(__dirname, "chatLogs");
const REPORT_THRESHOLD = 9;

const MONGODB_URI = process.env.MONGODB_URI;
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

if (!fs.existsSync(chatLogsDir)) {
  fs.mkdirSync(chatLogsDir);
}

const sendMessage = async (chatId, text) => {
  try {
    await bot.sendMessage(chatId, text);
  } catch (error) {
    console.error(`Failed to send message to ${chatId}:`, error);
  }
};

const isUserBlocked = async (chatId) => {
  try {
    const chatMember = await bot.getChatMember(chatId, chatId);
    return chatMember.status === 'left'; // If the user is not in the chat, they have blocked the bot
  } catch (error) {
    // If there is an error (likely because the bot cannot check the user), return false
    console.error(`Error checking if user ${chatId} blocked the bot:`, error);
    return false;
  }
};

const deleteUserFromDatabase = async (chatId) => {
  try {
    // Remove the user from the database
    await User.deleteOne({ chatId });
    console.log(`User ${chatId} has been removed from the database.`);
  } catch (error) {
    console.error(`Error removing user ${chatId} from database:`, error);
  }
};

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || 'Unknown';

  try {
    const user = await User.findOneAndUpdate(
      { chatId },
      { username, chatId },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error(`Failed to save user ${chatId}:`, error);
  }

  await sendMessage(chatId, "Welcome to Anonymous Chat Bot! Type /chat to connect with a random person.  \n /help - View this help message");
});

bot.onText(/\/users/, async (msg) => {
  const chatId = msg.chat.id;

  const ADMIN_IDS = process.env.ADMIN_IDS.split(',').map(id => id.trim());
  if (!ADMIN_IDS.includes(chatId.toString())) {
    await sendMessage(chatId, "You do not have permission to view this list.");
    return;
  }

  try {
    const users = await User.find({}).select('chatId');
    const userIds = users.map(user => user.chatId);

    if (userIds.length > 0) {
      await sendMessage(chatId, `User IDs: \n${userIds.join('\n')}`);
    } else {
      await sendMessage(chatId, "No users have started the bot yet.");
    }
  } catch (error) {
    console.error("Error retrieving users:", error);
    await sendMessage(chatId, "An error occurred while retrieving user IDs.");
  }
});

bot.onText(/\/chat/, async (msg) => {
  const chatId = msg.chat.id;

  if (activeChats[chatId]) {
    await sendMessage(chatId, "You're already in a chat. Type /end to leave.");
    return;
  }

  const user = await User.findOne({ chatId });
  if (!user || user.banned) {
    await sendMessage(chatId, "You are banned or not approved to chat.");
    return;
  }

  if (!waitingUsers.includes(chatId)) {
    waitingUsers.push(chatId);
    await sendMessage(chatId, "Searching for a chat partner...");
  }

  // Check if the user has blocked the bot
  const isBlocked = await isUserBlocked(chatId);
  if (isBlocked) {
    // Remove the user from the waiting list and notify them
    waitingUsers = waitingUsers.filter((id) => id !== chatId);
    await sendMessage(chatId, "You have blocked the bot. You cannot use this service anymore.");

    // Remove the user from the database
    await deleteUserFromDatabase(chatId);
    return;
  }

  const partnerChatId = waitingUsers.find((id) => id !== chatId);
  if (partnerChatId) {
    waitingUsers = waitingUsers.filter(
      (id) => id !== chatId && id !== partnerChatId
    );
    activeChats[chatId] = partnerChatId;
    activeChats[partnerChatId] = chatId;

    await sendMessage(chatId, "You've been connected to a partner. Say hello!");
    await sendMessage(
      partnerChatId,
      "You've been connected to a partner. Say hello!"
    );

    try {
      await Chat.create({ user1: chatId, user2: partnerChatId });
    } catch (error) {
      console.error("Failed to save chat:", error);
    }
  } else {
    await sendMessage(chatId, "No partners available now. Please wait...");
  }
});

bot.onText(/\/report/, async (msg) => {
  const chatId = msg.chat.id;
  const partnerChatId = activeChats[chatId];

  if (!partnerChatId) {
    await sendMessage(chatId, "You're not in a chat.");
    return;
  }

  try {
    await Report.create({
      reportedBy: chatId,
      message: `Reported user ${partnerChatId}`,
    });

    const partnerUser = await User.findOne({ chatId: partnerChatId });
    if (partnerUser) {
      const reports = await Report.countDocuments({
        reportedBy: partnerChatId,
      });
      if (reports >= REPORT_THRESHOLD) {
        partnerUser.banned = true;
        await partnerUser.save();
        await sendMessage(
          partnerChatId,
          "You have been banned due to multiple reports."
        );
        delete activeChats[chatId];
        delete activeChats[partnerChatId];
      }
    }

    await sendMessage(
      chatId,
      "User reported. Thank you for helping keep the community safe."
    );
  } catch (error) {
    console.error("Failed to report user:", error);
  }
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const text = `
    Welcome to the Anonymous Chat Bot! 🤖

    **Available Commands:**
    - /start: Start the bot and register.
    - /chat: Connect with a random person for a chat.
    - /end: End the current chat.
    - /report: Report your current chat partner.
    - /users: View the list of user IDs (Admin only).
    
    **Support & Assistance:**
    - If you need assistance, feel free to reach out to our [Support Group](https://t.me/ChatBotSupport01). We're here to help you! 💬
    
    **Bot Creator:**
    - This bot is created by [@Bhumik_here01]. For any further inquiries or feedback, feel free to contact the creator. 🚀

    Thank you for using the Anonymous Chat Bot! 👋
  `;
  await sendMessage(chatId, text);
});

bot.onText(/\/end/, async (msg) => {
  const chatId = msg.chat.id;
  const partnerChatId = activeChats[chatId];

  if (!partnerChatId) {
    await sendMessage(chatId, "You're not in a chat.");
    return;
  }

  delete activeChats[chatId];
  delete activeChats[partnerChatId];

  await sendMessage(chatId, "Chat ended.");
  await sendMessage(partnerChatId, "Chat ended.");
});

bot.onText(/\/ban/, async (msg) => {
  const chatId = msg.chat.id;
  const ADMIN_IDS = process.env.ADMIN_IDS.split(',').map(id => id.trim());
  if (!ADMIN_IDS.includes(chatId.toString())) {
    await sendMessage(chatId, "You do not have permission to ban users.");
    return;
  }

  const userId = msg.text.split(' ')[1];
  if (!userId) {
    await sendMessage(chatId, "Please specify a user ID to ban.");
    return;
  }

  try {
    const user = await User.findOne({ chatId: userId });
    if (user) {
      user.banned = true;
      await user.save();
      await sendMessage(chatId, `User ${userId} banned.`);
    } else {
      await sendMessage(chatId, `User ${userId} not found.`);
    }
  } catch (error) {
    console.error("Failed to ban user:", error);
  }
});

bot.onText(/\/unban/, async (msg) => {
  const chatId = msg.chat.id;
  const ADMIN_IDS = process.env.ADMIN_IDS.split(',').map(id => id.trim());
  if (!ADMIN_IDS.includes(chatId.toString())) {
    await sendMessage(chatId, "You do not have permission to unban users.");
    return;
  }

  const userId = msg.text.split(' ')[1];
  if (!userId) {
    await sendMessage(chatId, "Please specify a user ID to unban.");
    return;
  }

  try {
    const user = await User.findOne({ chatId: userId });
    if (user) {
      user.banned = false;
      await user.save();
      await sendMessage(chatId, `User ${userId} unbanned.`);
    } else {
      await sendMessage(chatId, `User ${userId} not found.`);
    }
  } catch (error) {
    console.error("Failed to unban user:", error);
  }
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;

  if (msg.text && msg.text.startsWith("/")) return;

  const partnerChatId = activeChats[chatId];
  if (!partnerChatId) {
    await sendMessage(chatId, "Type /chat to connect with a random person.");
    return;
  }

  try {
    if (msg.text) {
      const chat = await Chat.findOne({
        $or: [
          { user1: chatId, user2: partnerChatId },
          { user1: partnerChatId, user2: chatId },
        ],
      });

      if (chat) {
        chat.messages.push({ sender: chatId, message: msg.text });
        await chat.save();
      }

      await bot.sendMessage(partnerChatId, msg.text);
    }

    if (msg.sticker) {
      const chat = await Chat.findOne({
        $or: [
          { user1: chatId, user2: partnerChatId },
          { user1: partnerChatId, user2: chatId },
        ],
      });

      if (chat) {
        chat.messages.push({
          sender: chatId,
          message: `Sticker: ${msg.sticker.file_id}`,
        });
        await chat.save();
      }

      await bot.sendSticker(partnerChatId, msg.sticker.file_id);
    }

    if (msg.photo) {
      const chat = await Chat.findOne({
        $or: [
          { user1: chatId, user2: partnerChatId },
          { user1: partnerChatId, user2: chatId },
        ],
      });

      if (chat) {
        chat.messages.push({
          sender: chatId,
          message: `Photo: ${msg.photo[0].file_id}`,
        });
        await chat.save();
      }

      await bot.sendPhoto(partnerChatId, msg.photo[0].file_id);
    }

    if (msg.video) {
      const chat = await Chat.findOne({
        $or: [
          { user1: chatId, user2: partnerChatId },
          { user1: partnerChatId, user2: chatId },
        ],
      });

      if (chat) {
        chat.messages.push({
          sender: chatId,
          message: `Video: ${msg.video.file_id}`,
        });
        await chat.save();
      }

      await bot.sendVideo(partnerChatId, msg.video.file_id);
    }

    if (msg.document) {
      const chat = await Chat.findOne({
        $or: [
          { user1: chatId, user2: partnerChatId },
          { user1: partnerChatId, user2: chatId },
        ],
      });

      if (chat) {
        chat.messages.push({
          sender: chatId,
          message: `Document: ${msg.document.file_id}`,
        });
        await chat.save();
      }

      await bot.sendDocument(partnerChatId, msg.document.file_id);
    }
  } catch (error) {
    console.error("Error handling message:", error);
  }
});