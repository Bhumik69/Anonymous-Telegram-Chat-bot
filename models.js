const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
    chatId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        validate: {
            validator: (v) => /^[0-9]+$/.test(v), // Ensures chatId is numeric
            message: 'Chat ID must be a valid numeric string.',
        },
    },
    approved: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
});

// Chat Schema with automatic timestamps
const chatSchema = new mongoose.Schema(
    {
        user1: { type: String, required: true, index: true },
        user2: { type: String, required: true, index: true },
        messages: [
            {
                sender: { type: String, required: true },
                message: {
                    type: String,
                    required: true,
                    maxlength: 1000, // Restrict message length to 1000 characters
                },
                timestamp: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true } // Enable automatic timestamps for createdAt and updatedAt
);

// Add a compound index for faster user-to-user chat lookups
chatSchema.index({ user1: 1, user2: 1 });

// Middleware for cascading deletions (if required in the future)
chatSchema.pre('remove', async function (next) {
    // Add logic to remove associated data if needed
    console.log(`Cleaning up messages for chat between ${this.user1} and ${this.user2}`);
    next();
});

// Report Schema with automatic timestamps
const reportSchema = new mongoose.Schema(
    {
        reportedBy: {
            type: String,
            required: true,
            index: true,
        },
        message: {
            type: String,
            required: true,
            maxlength: 500, // Limit report messages to 500 characters
        },
    },
    { timestamps: true }
);

// Add validation to ensure reportedBy field is valid
reportSchema.path('reportedBy').validate((v) => /^[0-9]+$/.test(v), 'ReportedBy must be a numeric string.');

// Create models
const User = mongoose.model('User', userSchema);
const Chat = mongoose.model('Chat', chatSchema);
const Report = mongoose.model('Report', reportSchema);

module.exports = { User, Chat, Report };
