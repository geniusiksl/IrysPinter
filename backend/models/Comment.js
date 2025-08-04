const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  pin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Pin', required: true },
  user: { type: String, required: true },
  content: { type: String, required: true },
  txid: { type: String },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Comment', CommentSchema); 