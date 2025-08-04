const mongoose = require('mongoose');

const PinSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  owner: { type: String, required: true },
  mint_address: { type: String, required: true },
  image_url: { type: String },
  metadata_url: { type: String },
  price: { type: Number },
  for_sale: { type: Boolean, default: false },
  duration: { type: Number },
  expires_at: { type: Date },
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Pin', PinSchema); 