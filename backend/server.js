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
const User = require('./models/User');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
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
  res.json({ message: 'IrysPinter API - Decentralized Pinterest on Irys' });
});



// Get all pins
app.get('/api/pins', async (req, res) => {
  try {
    const pins = await Pin.find().sort({ created_at: -1 });
    res.json(pins);
  } catch (e) {
    console.error('Error fetching pins:', e);
    res.status(500).json({ error: 'Failed to fetch pins', details: e.message });
  }
});

// Get single pin by ID
app.get('/api/pins/:id', async (req, res) => {
  try {
    const pin = await Pin.findById(req.params.id);
    if (!pin) {
      return res.status(404).json({ error: 'Pin not found' });
    }
    res.json(pin);
  } catch (e) {
    console.error('Error fetching pin:', e);
    res.status(500).json({ error: 'Failed to fetch pin', details: e.message });
  }
});

// Get pins by owner
app.get('/api/pins/user/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const userPins = await Pin.find({ owner: address }).sort({ created_at: -1 });
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
      _id: { $in: likedPinIds }
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
    const { title, description, owner, image_url, image_txid } = req.body;
    
    if (!title || !owner || !image_url) {
      return res.status(400).json({ error: 'Title, owner, and image_url are required' });
    }

    const pin = new Pin({
      title,
      description: description || '',
      owner,
      image_url,
      image_txid: image_txid || null,
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



// User Management
// Get or create user profile
app.get('/api/users/:address', async (req, res) => {
  try {
    const address = req.params.address;
    let user = await User.findOne({ address });
    
    if (!user) {
      // Create new user profile
      user = new User({
        address,
        username: `user_${address.slice(0, 8)}`,
        displayName: `User ${address.slice(0, 6)}...${address.slice(-4)}`,
        created_at: new Date(),
        updated_at: new Date(),
      });
      await user.save();
    }
    
    res.json(user);
  } catch (e) {
    console.error('Error fetching user:', e);
    res.status(500).json({ error: 'Failed to fetch user', details: e.message });
  }
});

// Update user profile
app.put('/api/users/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const updateData = req.body;
    
    const user = await User.findOneAndUpdate(
      { address },
      { 
        ...updateData,
        updated_at: new Date() 
      },
      { new: true, upsert: true }
    );
    
    res.json(user);
  } catch (e) {
    console.error('Error updating user:', e);
    res.status(500).json({ error: 'Failed to update user', details: e.message });
  }
});

// Follow/Unfollow user
app.post('/api/users/:address/follow', async (req, res) => {
  try {
    const targetAddress = req.params.address;
    const { followerAddress } = req.body;
    
    if (!followerAddress) {
      return res.status(400).json({ error: 'Follower address required' });
    }
    
    if (targetAddress === followerAddress) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    const targetUser = await User.findOne({ address: targetAddress });
    const followerUser = await User.findOne({ address: followerAddress });
    
    if (!targetUser || !followerUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isFollowing = targetUser.followers.includes(followerAddress);
    
    if (isFollowing) {
      // Unfollow
      targetUser.followers = targetUser.followers.filter(addr => addr !== followerAddress);
      followerUser.following = followerUser.following.filter(addr => addr !== targetAddress);
    } else {
      // Follow
      if (!targetUser.followers.includes(followerAddress)) {
        targetUser.followers.push(followerAddress);
      }
      if (!followerUser.following.includes(targetAddress)) {
        followerUser.following.push(targetAddress);
      }
    }
    
    await targetUser.save();
    await followerUser.save();
    
    res.json({ 
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length,
      followingCount: followerUser.following.length
    });
  } catch (e) {
    console.error('Error following/unfollowing user:', e);
    res.status(500).json({ error: 'Failed to follow/unfollow user', details: e.message });
  }
});

// Get user followers
app.get('/api/users/:address/followers', async (req, res) => {
  try {
    const address = req.params.address;
    const user = await User.findOne({ address });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const followers = await User.find({ address: { $in: user.followers } });
    res.json(followers);
  } catch (e) {
    console.error('Error fetching followers:', e);
    res.status(500).json({ error: 'Failed to fetch followers', details: e.message });
  }
});

// Get user following
app.get('/api/users/:address/following', async (req, res) => {
  try {
    const address = req.params.address;
    const user = await User.findOne({ address });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const following = await User.find({ address: { $in: user.following } });
    res.json(following);
  } catch (e) {
    console.error('Error fetching following:', e);
    res.status(500).json({ error: 'Failed to fetch following', details: e.message });
  }
});

// Messenger endpoints
// Get conversations for a user
app.get('/api/conversations/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const conversations = await Conversation.find({ participants: { $in: [address] } })
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });
    
    res.json(conversations);
  } catch (e) {
    console.error('Error fetching conversations:', e);
    res.status(500).json({ error: 'Failed to fetch conversations', details: e.message });
  }
});

// Get messages for a conversation
app.get('/api/conversations/:conversationId/messages', async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    const messages = await Message.find({ 
      $or: [
        { sender: { $in: conversation.participants }, receiver: { $in: conversation.participants } }
      ]
    }).sort({ created_at: 1 });
    
    // Populate pin data for messages that don't have it
    const populatedMessages = await Promise.all(messages.map(async (msg) => {
      if (msg.messageType === 'pin' && msg.pinId && !msg.pinData) {
        try {
          const pin = await Pin.findById(msg.pinId);
          if (pin) {
            const messageObj = msg.toObject();
            messageObj.pinData = {
              title: pin.title,
              description: pin.description,
              image_url: pin.image_url,
              owner: pin.owner
            };
            return messageObj;
          }
        } catch (error) {
          console.error('Error loading pin data:', error);
        }
      }
      return msg.toObject ? msg.toObject() : msg;
    }));
    
    res.json(populatedMessages);
  } catch (e) {
    console.error('Error fetching messages:', e);
    res.status(500).json({ error: 'Failed to fetch messages', details: e.message });
  }
});

// Send a message
app.post('/api/messages', async (req, res) => {
  try {
    console.log('Received message request:', req.body);
    const { sender, receiver, content, messageType, pinId, image_url, pinData, irysId } = req.body;
    
    if (!sender || !receiver || !content) {
      console.log('Missing required fields:', { sender, receiver, content });
      return res.status(400).json({ error: 'Sender, receiver, and content are required' });
    }
    
    console.log('Finding conversation for participants:', [sender, receiver]);
    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [sender, receiver] }
    });
    
    if (!conversation) {
      console.log('Creating new conversation');
      conversation = new Conversation({
        participants: [sender, receiver],
        unreadCount: new Map(),
        created_at: new Date(),
        updated_at: new Date(),
      });
      await conversation.save();
      console.log('New conversation created:', conversation._id);
    } else {
      console.log('Found existing conversation:', conversation._id);
    }
    
    // Create message
    console.log('Creating message...');
  const message = new Message({
      sender,
      receiver,
      content,
      messageType: messageType || 'text',
      pinId: pinId || null,
      image_url: image_url || null,
    pinData: pinData || null,
    irysId: (irysId && typeof irysId === 'object') ? irysId.id || null : (irysId || null),
      created_at: new Date(),
    });
    
    await message.save();
    console.log('Message saved successfully:', message._id);
    
    // Update conversation
    console.log('Updating conversation...');
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    conversation.updated_at = new Date();
    
    // Update unread count for receiver
    if (!conversation.unreadCount) {
      conversation.unreadCount = new Map();
    }
    const currentUnread = conversation.unreadCount.get(receiver) || 0;
    conversation.unreadCount.set(receiver, currentUnread + 1);
    
    await conversation.save();
    console.log('Conversation updated successfully');
    
    res.json(message);
  } catch (e) {
    console.error('Detailed error sending message:', e);
    console.error('Error stack:', e.stack);
    res.status(500).json({ error: 'Failed to send message', details: e.message, stack: e.stack });
  }
});

// Mark messages as read
app.put('/api/conversations/:conversationId/read', async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const { address } = req.body;
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Mark messages as read
    await Message.updateMany(
      { 
        receiver: address,
        conversation: conversationId,
        isRead: false 
      },
      { isRead: true }
    );
    
    // Reset unread count
    conversation.unreadCount.set(address, 0);
    await conversation.save();
    
    res.json({ success: true });
  } catch (e) {
    console.error('Error marking messages as read:', e);
    res.status(500).json({ error: 'Failed to mark messages as read', details: e.message });
  }
});

// Create new conversation
app.post('/api/conversations', async (req, res) => {
  try {
    const { participants } = req.body;
    
    if (!participants || !Array.isArray(participants) || participants.length !== 2) {
      return res.status(400).json({ error: 'Exactly two participants are required' });
    }
    
    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: participants }
    });
    
    if (conversation) {
      return res.status(409).json({ error: 'Conversation already exists', conversation });
    }
    
    // Create new conversation
    conversation = new Conversation({
      participants,
      created_at: new Date(),
      updated_at: new Date(),
      unreadCount: new Map()
    });
    
    await conversation.save();
    res.status(201).json(conversation);
  } catch (e) {
    console.error('Error creating conversation:', e);
    res.status(500).json({ error: 'Failed to create conversation', details: e.message });
  }
});

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`🚀 IrysPinter server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});
