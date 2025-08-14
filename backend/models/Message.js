const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // Wallet address
  receiver: { type: String, required: true }, // Wallet address
  content: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image', 'pin'], default: 'text' },
  pinId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pin' }, // If sharing a pin
  image_url: { type: String }, // If sending an image
  pinData: { type: mongoose.Schema.Types.Mixed }, // Pin data for shared pins
  irysId: { type: String }, // Irys transaction ID for decentralized storage
  isRead: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', MessageSchema);
