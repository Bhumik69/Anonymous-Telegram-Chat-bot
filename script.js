const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const BOT_TOKEN = '7909770075:AAHnreWWsSMq-ZhugIVX9JhGh3wOjrtKu2E';

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

let waitingUsers = []; // Users waiting for a connection
let activeChats = {};   // Active chat pairs
const chatLogsDir = path.join(__dirname, 'chatLogs'); // Directory for chat logs
const bannedUsers = new Set(); // Set to keep track of banned users

// Ensure chatLogs directory exists
if (!fs.existsSync(chatLogsDir)) {
    fs.mkdirSync(chatLogsDir);
}

// Function to send a message to a user
const sendMessage = async (chatId, text) => {
    try {
        await bot.sendMessage(chatId, text);
    } catch (error) {
        console.error(`Failed to send message to ${chatId}:`, error);
    }
};

// Function to log chat messages
const logChat = (chatId, partnerChatId, message) => {
    const logFileName = `${Math.min(chatId, partnerChatId)}-${Math.max(chatId, partnerChatId)}.txt`; // Ensure logs are ordered
    const logFilePath = path.join(chatLogsDir, logFileName);
    const logEntry = `${new Date().toISOString()} - ${chatId}: ${message}\n`; // Format: timestamp, user: message

    fs.appendFileSync(logFilePath, logEntry, (err) => {
        if (err) {
            console.error(`Failed to log message: ${err}`);
        }
    });
};

// Function to check for specific words
// const containsSpecificWords = (message) => {
//     const specificWords = ['badword1', 'badword2']; // Add specific words to check for
//     return specificWords.some(word => message.includes(word));
// };

// Function to handle user reports
const handleReport = async (chatId, message) => {
    const logFileName = `${chatId}_report.txt`;
    const logFilePath = path.join(chatLogsDir, logFileName);
    const logEntry = `${new Date().toISOString()} - Reported message: ${message}\n`;

    fs.appendFileSync(logFilePath, logEntry, (err) => {
        if (err) {
            console.error(`Failed to log report: ${err}`);
        }
    });

    // Ban the user
    bannedUsers.add(chatId);
    await sendMessage(chatId, "You have been banned from using this bot due to inappropriate behavior.");
};

// Function to initialize chat variables
const initializeChat = () => {
    waitingUsers = [];
    activeChats = {};
};

// Call the initialize function
initializeChat();

// Start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await sendMessage(chatId, "Welcome to Anonymous Chat Bot! Type /chat to connect with a random person.");
});

// Chat command - to find a partner
bot.onText(/\/chat/, async (msg) => {
    const chatId = msg.chat.id;

    if (activeChats[chatId]) {
        await sendMessage(chatId, "You're already in a chat. Type /end to leave your current chat.");
        return;
    }

    if (!waitingUsers.includes(chatId)) {
        waitingUsers.push(chatId);
        await sendMessage(chatId, "Searching for a chat partner...");
    }

    const partnerChatId = findChatPartner(chatId);
    if (partnerChatId) {
        activeChats[chatId] = partnerChatId;
        activeChats[partnerChatId] = chatId;

        await sendMessage(chatId, "You've been connected to a partner! Say hello!");
        await sendMessage(partnerChatId, "You've been connected to a partner! Say hello!");

        console.log(`Connected User ${chatId} with User ${partnerChatId}.`);
    } else {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
        await sendMessage(chatId, "No partners available at the moment. Please try again later.");
        removeUserFromWaitingList(chatId);
    }
});

// Function to find a chat partner
const findChatPartner = (chatId) => {
    for (let userId of waitingUsers) {
        if (userId !== chatId) {
            removeUserFromWaitingList(userId);
            removeUserFromWaitingList(chatId);
            return userId;
        }
    }
    return null;
};

// Helper to remove users from waiting list safely
const removeUserFromWaitingList = (chatId) => {
    waitingUsers = waitingUsers.filter(user => user !== chatId);
};

// End command - to leave the chat
bot.onText(/\/end/, async (msg) => {
    const chatId = msg.chat.id;

    if (!activeChats[chatId]) {
        await sendMessage(chatId, "You're not in a chat.");
        return;
    }

    const partnerChatId = activeChats[chatId];
    delete activeChats[chatId];
    delete activeChats[partnerChatId];

    await sendMessage(chatId, "You've left the chat.");
    await sendMessage(partnerChatId, "Your partner has left the chat.");
});

// Listen for all text messages to forward them to the chat partner
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // Ignore command messages (starting with '/') and banned users
    if (msg.text && msg.text.startsWith('/') || bannedUsers.has(chatId)) {
        return;
    }

    // Check if the user is in an active chat
    const partnerChatId = activeChats[chatId];
    if (partnerChatId) {
        // Log the chat message
        logChat(chatId, partnerChatId, msg.text);

        // Check for specific words
        // if (containsSpecificWords(msg.text)) {
        //     await sendMessage(chatId, "Your message contains inappropriate content. You have been reported.");
        //     await handleReport(chatId, msg.text);
        //     return;
        // }

        // Forward the message to the chat partner
        try {
            await bot.sendMessage(partnerChatId, msg.text);
        } catch (error) {
            console.error(`Failed to forward message from ${chatId} to ${partnerChatId}:`, error);
        }
    } else {
        await sendMessage(chatId, "Type /chat to connect with a random person.");
    }
});

// Clean up waiting users on exit
process.on('exit', () => {
    waitingUsers = [];
    activeChats = {};
});
