const mongoose = require('mongoose');

const PinSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  owner: { type: String, required: true },
  image_url: { type: String, required: true },
  image_txid: { type: String }, // Irys transaction ID
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Pin', PinSchema); 