const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{ type: String, required: true }], // Array of wallet addresses
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastMessageAt: { type: Date, default: Date.now },
  unreadCount: { type: Map, of: Number, default: new Map() }, // Map of address -> unread count
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Conversation', ConversationSchema);
