const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: Object, default: {} },
  read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', NotificationSchema); 