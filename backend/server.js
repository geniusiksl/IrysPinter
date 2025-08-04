// backend/server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const connectDB = require('./db');
const Pin = require('./models/Pin');
const Like = require('./models/Like');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');
const { ethers } = require('ethers');

const app = express();
const upload = multer();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Подключение к MongoDB
connectDB();

// Provider для получения реального баланса
const provider = new ethers.JsonRpcProvider(process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc');

// API root
app.get('/api', (req, res) => {
  res.json({ message: 'IrysPinter API - Decentralized Pinterest on Ethereum/Arbitrum' });
});

// Function to check and remove expired listings
const checkExpiredListings = () => {
  const now = new Date();
  Pin.find({ for_sale: true })
    .then(pins => {
      pins.forEach(pin => {
        if (pin.expires_at && new Date(pin.expires_at) <= now) {
          pin.for_sale = false;
          pin.expires_at = null;
          pin.updated_at = new Date();
          pin.save();
        }
      });
    })
    .catch(err => console.error('Error checking expired listings:', err));
};

// Get all pins (with optional owner filter)
app.get('/api/pins', async (req, res) => {
  try {
    checkExpiredListings();
    const pins = await Pin.find({
      mint_address: { $nin: [null, ''] }
    }).sort({ created_at: -1 });
    res.json(pins);
  } catch (e) {
    console.error('Error fetching pins:', e);
    res.status(500).json({ error: 'Failed to fetch pins', details: e.message });
  }
});

// Get pins by owner
app.get('/api/pins/user/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const userPins = await Pin.find({
      owner: address,
      mint_address: { $nin: [null, ''] }
    }).sort({ created_at: -1 });
    res.json(userPins);
  } catch (e) {
    console.error('Error fetching user pins:', e);
    res.status(500).json({ error: 'Failed to fetch user pins', details: e.message });
  }
});

// Get liked pins by user
app.get('/api/pins/liked/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const likedLikes = await Like.find({ user: address });
    const likedPinIds = likedLikes.map(like => like.pin_id);
    const likedPins = await Pin.find({
      _id: { $in: likedPinIds },
      mint_address: { $nin: [null, ''] }
    }).sort({ created_at: -1 });
    res.json(likedPins);
  } catch (e) {
    console.error('Error fetching liked pins:', e);
    res.status(500).json({ error: 'Failed to fetch liked pins', details: e.message });
  }
});

// Get user stats
app.get('/api/user/stats/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const userPins = await Pin.find({ owner: address });
    const userLikes = await Like.find({ user: address });
    const totalLikesOnUserPins = userPins.reduce((total, pin) => total + (pin.likes || 0), 0);
    const commentsOnUserPins = await Comment.find({ pin_id: { $in: userPins.map(pin => pin._id) } });
    const stats = {
      totalPins: userPins.length,
      totalLikes: userLikes.length,
      totalLikesOnUserPins,
      totalComments: commentsOnUserPins.length,
      // Убираем просмотры из статистики
    };
    res.json(stats);
  } catch (e) {
    console.error('Error fetching user stats:', e);
    res.status(500).json({ error: 'Failed to fetch user stats', details: e.message });
  }
});

// Create new pin
app.post('/api/pins', async (req, res) => {
  try {
    const { title, description, owner, mint_address, image_url, metadata_url, price, for_sale, duration, transaction_signature } = req.body;
    
    if (!title || !owner || !mint_address) {
      return res.status(400).json({ error: 'Title, owner, and mint_address are required' });
    }

    const pin = new Pin({
      title,
      description: description || '',
      owner,
      mint_address,
      image_url,
      metadata_url,
      price: price ? parseFloat(price) : null,
      for_sale: for_sale || false,
      duration: duration ? parseInt(duration) : null,
      expires_at: duration ? new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000) : null,
      transaction_signature,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await pin.save();
    res.json(pin);
  } catch (e) {
    console.error("Error creating pin:", e);
    res.status(500).json({ error: 'Failed to create pin', details: e.message });
  }
});

// Update pin
app.put('/api/pins/:pin_id', async (req, res) => {
  try {
    const pin_id = req.params.pin_id;
    const updateData = req.body;
    
    if (!pin_id || pin_id === 'undefined') {
      return res.status(400).json({ error: 'Invalid pin_id' });
    }
    
    const updatedPin = await Pin.findByIdAndUpdate(
      pin_id,
      { 
        ...updateData,
        updated_at: new Date() 
      },
      { new: true }
    );
    
    if (!updatedPin) {
      return res.status(404).json({ error: 'Pin not found' });
    }
    
    res.json(updatedPin);
  } catch (e) {
    console.error('Error updating pin:', e);
    res.status(500).json({ error: 'Failed to update pin', details: e.message });
  }
});

// Get comments for a pin
app.get('/api/pins/:pin_id/comments', async (req, res) => {
  try {
    const pin_id = req.params.pin_id;
    
    // Проверяем, что pin_id не undefined
    if (!pin_id || pin_id === 'undefined') {
      return res.status(400).json({ error: 'Invalid pin_id' });
    }
    
    const pinComments = await Comment.find({ pin_id }).sort({ created_at: -1 });
    res.json(pinComments);
  } catch (e) {
    console.error('Error fetching comments:', e);
    res.status(500).json({ error: 'Failed to fetch comments', details: e.message });
  }
});

// Add comment to a pin
app.post('/api/pins/:pin_id/comment', async (req, res) => {
  try {
    const pin_id = req.params.pin_id;
    const { user, content, txid } = req.body;
    
    // Проверяем, что pin_id не undefined
    if (!pin_id || pin_id === 'undefined') {
      return res.status(400).json({ error: 'Invalid pin_id' });
    }
    
    if (!user || !content) return res.status(400).json({ error: 'User and content required' });
    
    const comment = new Comment({
      pin_id,
      user,
      content,
      txid: txid || null,
      created_at: new Date(),
    });
    await comment.save();
    
    // Update pin's comment count
    await Pin.findByIdAndUpdate(pin_id, { $inc: { comments: 1 }, updated_at: new Date() });
    
    // Create notification for pin owner
    const pin = await Pin.findById(pin_id);
    if (pin && pin.owner !== user) {
      const notification = new Notification({
        user: pin.owner,
        type: 'comment',
        title: 'New Comment',
        message: `${user} commented on your pin "${pin.title}"`,
        data: {
          pin_id,
          comment_id: comment._id,
          commenter: user
        },
        read: false,
        created_at: new Date()
      });
      await notification.save();
    }
    
    res.json(comment);
  } catch (e) {
    console.error('Error adding comment:', e);
    res.status(500).json({ error: 'Failed to add comment', details: e.message });
  }
});

// Check if user liked a pin
app.get('/api/pins/:pin_id/likes/:user', async (req, res) => {
  try {
    const { pin_id, user } = req.params;
    
    // Проверяем, что pin_id не undefined
    if (!pin_id || pin_id === 'undefined') {
      return res.status(400).json({ error: 'Invalid pin_id' });
    }
    
    const liked = await Like.findOne({ pin_id, user });
    res.json({ liked: !!liked });
  } catch (e) {
    console.error('Error checking if liked:', e);
    res.status(500).json({ error: 'Failed to check like status', details: e.message });
  }
});

// Like a pin
app.post('/api/pins/:pin_id/like', async (req, res) => {
  try {
    const pin_id = req.params.pin_id;
    const { user, txid } = req.body;
    
    // Проверяем, что pin_id не undefined
    if (!pin_id || pin_id === 'undefined') {
      return res.status(400).json({ error: 'Invalid pin_id' });
    }
    
    if (!user) return res.status(400).json({ error: 'User required' });
    
    // Prevent double-like
    const existingLike = await Like.findOne({ pin_id, user });
    if (existingLike) {
      return res.json({ success: false, action: 'already_liked' });
    }
    
    const like = new Like({
      pin_id,
      user,
      txid: txid || null,
      created_at: new Date(),
    });
    await like.save();
    
    // Update pin's like count
    const updatedPin = await Pin.findByIdAndUpdate(
      pin_id, 
      { $inc: { likes: 1 }, updated_at: new Date() },
      { new: true }
    );
    
    // Create notification for pin owner
    if (updatedPin && updatedPin.owner !== user) {
      const notification = new Notification({
        user: updatedPin.owner,
        type: 'like',
        title: 'New Like',
        message: `${user} liked your pin "${updatedPin.title}"`,
        data: {
          pin_id,
          liker: user
        },
        read: false,
        created_at: new Date()
      });
      await notification.save();
    }
    
    res.json({ success: true, action: 'liked', likes: updatedPin ? updatedPin.likes : 1 });
  } catch (e) {
    console.error('Error liking pin:', e);
    res.status(500).json({ error: 'Failed to like pin', details: e.message });
  }
});

// Get user balance (реальный баланс)
app.get('/api/user/balance/:address', async (req, res) => {
  try {
    const address = req.params.address;
    
    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }
    
    const balance = await provider.getBalance(address);
    const balanceInEth = ethers.formatEther(balance);
    
    // Округляем до 4 знаков после запятой
    const roundedBalance = parseFloat(balanceInEth).toFixed(4);
    
    res.json({ balance: roundedBalance });
  } catch (e) {
    console.error('Error fetching balance:', e);
    res.status(500).json({ error: 'Failed to fetch balance', details: e.message });
  }
});

// Get notifications for user
app.get('/api/notifications/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const userNotifications = await Notification.find({ user: address })
      .sort({ created_at: -1 });
    res.json(userNotifications);
  } catch (e) {
    console.error('Error fetching notifications:', e);
    res.status(500).json({ error: 'Failed to fetch notifications', details: e.message });
  }
});

// Get unread notifications count
app.get('/api/notifications/:address/unread-count', async (req, res) => {
  try {
    const address = req.params.address;
    const unreadCount = await Notification.countDocuments({ 
      user: address, 
      read: false 
    });
    res.json({ unreadCount });
  } catch (e) {
    console.error('Error fetching unread notifications count:', e);
    res.status(500).json({ error: 'Failed to fetch unread count', details: e.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const { walletAddress } = req.body;
    
    // Проверяем, что notificationId не undefined
    if (!notificationId || notificationId === 'undefined') {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: walletAddress },
      { read: true },
      { new: true }
    );
    
    if (notification) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  } catch (e) {
    console.error('Error marking notification as read:', e);
    res.status(500).json({ error: 'Failed to mark notification as read', details: e.message });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    await Notification.updateMany({ user: walletAddress }, { read: true });
    res.json({ success: true });
  } catch (e) {
    console.error('Error marking all notifications as read:', e);
    res.status(500).json({ error: 'Failed to mark all notifications as read', details: e.message });
  }
});

// Create notification (for purchases)
app.post('/api/notifications', async (req, res) => {
  try {
    const { user, type, title, message, data } = req.body;
    
    const notification = new Notification({
      user,
      type,
      title,
      message,
      data: data || {},
      read: false,
      created_at: new Date()
    });
    
    await notification.save();
    res.json(notification);
  } catch (e) {
    console.error('Error creating notification:', e);
    res.status(500).json({ error: 'Failed to create notification', details: e.message });
  }
});

// Update pin owner after purchase
app.put('/api/pins/:pin_id/transfer-ownership', async (req, res) => {
  try {
    const pin_id = req.params.pin_id;
    const { newOwner } = req.body;
    
    if (!pin_id || pin_id === 'undefined') {
      return res.status(400).json({ error: 'Invalid pin_id' });
    }
    
    if (!newOwner) {
      return res.status(400).json({ error: 'New owner address required' });
    }
    
    const updatedPin = await Pin.findByIdAndUpdate(
      pin_id,
      { 
        owner: newOwner, 
        for_sale: false, // Убираем с продажи после покупки
        price: null,
        expires_at: null,
        updated_at: new Date() 
      },
      { new: true }
    );
    
    if (!updatedPin) {
      return res.status(404).json({ error: 'Pin not found' });
    }
    
    res.json(updatedPin);
  } catch (e) {
    console.error('Error transferring ownership:', e);
    res.status(500).json({ error: 'Failed to transfer ownership', details: e.message });
  }
});

// Delete pin from marketplace
app.delete('/api/pins/:pin_id', async (req, res) => {
  try {
    const pin_id = req.params.pin_id;
    const { owner } = req.body;
    
    if (!pin_id || pin_id === 'undefined') {
      return res.status(400).json({ error: 'Invalid pin_id' });
    }
    
    const pin = await Pin.findById(pin_id);
    if (!pin) {
      return res.status(404).json({ error: 'Pin not found' });
    }
    
    if (pin.owner !== owner) {
      return res.status(403).json({ error: 'Only owner can delete pin' });
    }
    
    await Pin.findByIdAndDelete(pin_id);
    
    // Удаляем связанные лайки и комментарии
    await Like.deleteMany({ pin_id });
    await Comment.deleteMany({ pin_id });
    
    res.json({ success: true, message: 'Pin deleted successfully' });
  } catch (e) {
    console.error('Error deleting pin:', e);
    res.status(500).json({ error: 'Failed to delete pin', details: e.message });
  }
});

// Clean up invalid pins (for development)
app.delete('/api/pins/cleanup', async (req, res) => {
  try {
    const beforeCount = await Pin.countDocuments();
    await Pin.deleteMany({
      $or: [
        { mint_address: null },
        { mint_address: '' }
      ]
    });
    const afterCount = await Pin.countDocuments();
    res.json({ 
      message: 'Invalid pins cleaned up', 
      removed: beforeCount - afterCount,
      remaining: afterCount 
    });
  } catch (e) {
    console.error('Error cleaning up pins:', e);
    res.status(500).json({ error: 'Failed to clean up pins', details: e.message });
  }
});

// Purchase NFT (generate instructions only)
app.post('/api/pins/:pin_id/purchase', async (req, res) => {
  try {
    const pin_id = req.params.pin_id;
    const { buyer, price } = req.body;
    
    if (!pin_id || pin_id === 'undefined') {
      return res.status(400).json({ error: 'Invalid pin_id' });
    }
    
    const pin = await Pin.findById(pin_id);
    if (!pin) return res.status(404).json({ error: 'Pin not found' });
    
    // Create notification for pin owner about purchase
    if (pin.owner !== buyer) {
      const notification = new Notification({
        user: pin.owner,
        type: 'purchase',
        title: 'Pin Sold!',
        message: `${buyer} purchased your pin "${pin.title}" for ${price} ETH`,
        data: {
          pin_id,
          buyer,
          price
        },
        read: false,
        created_at: new Date()
      });
      await notification.save();
    }
    
    // Генерируем инструкции для покупки (без приватных ключей)
    const royaltyWallet = process.env.ROYALTY_WALLET || 'ROYALTY_PUBLIC_KEY';
    const instructions = {
      instructions: [],
      metadata: {
        name: pin.title,
        symbol: 'PIN',
        uri: pin.metadata_url,
        seller_fee_basis_points: 250,
        creators: [{ address: royaltyWallet, verified: false, share: 100 }],
      },
    };
    res.json({ instructions, pin });
  } catch (e) {
    console.error('Error processing purchase:', e);
    res.status(500).json({ error: 'Failed to process purchase', details: e.message });
  }
});

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`IrysPinter backend running on http://localhost:${PORT}`);
});
