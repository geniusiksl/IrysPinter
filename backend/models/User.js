const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  username: { type: String, unique: true, sparse: true },
  displayName: { type: String, default: '' },
  bio: { type: String, default: '' },
  bio_irys_url: { type: String },
  bio_irys_txid: { type: String },
  profile_irys_url: { type: String },
  profile_irys_txid: { type: String },
  avatar_url: { type: String },
  cover_url: { type: String },
  followers: [{ type: String }], // Array of wallet addresses
  following: [{ type: String }], // Array of wallet addresses
  isVerified: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
