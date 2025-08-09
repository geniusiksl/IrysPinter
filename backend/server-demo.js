const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory storage for demo
let pins = [
  {
    _id: '1',
    title: 'Beautiful Sunset',
    description: 'A stunning sunset over the mountains',
    image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    owner: 'demo_user',
    likes: 15,
    comments: [],
    created_at: new Date('2024-01-15'),
    updated_at: new Date('2024-01-15')
  },
  {
    _id: '2',
    title: 'Ocean Waves',
    description: 'Peaceful ocean waves on a sunny day',
    image_url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400',
    owner: 'demo_user',
    likes: 23,
    comments: [],
    created_at: new Date('2024-01-16'),
    updated_at: new Date('2024-01-16')
  },
  {
    _id: '3',
    title: 'Mountain Peak',
    description: 'Snow-capped mountain peak in winter',
    image_url: 'https://images.unsplash.com/photo-1464822759844-d150baec3e5e?w=400',
    owner: 'demo_user',
    likes: 8,
    comments: [],
    created_at: new Date('2024-01-17'),
    updated_at: new Date('2024-01-17')
  }
];

let users = [
  {
    _id: 'demo_user',
    username: 'demo_user',
    email: 'demo@example.com',
    wallet_address: '0x1234567890123456789012345678901234567890',
    created_at: new Date('2024-01-01')
  }
];

let likes = [];
let comments = [];
let notifications = [];

// Get all pins
app.get('/api/pins', async (req, res) => {
  try {
    res.json(pins);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch pins' });
  }
});

// Get pin by ID
app.get('/api/pins/:pin_id', async (req, res) => {
  try {
    const pin = pins.find(p => p._id === req.params.pin_id);
    if (!pin) return res.status(404).json({ error: 'Pin not found' });
    res.json(pin);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch pin' });
  }
});

// Create new pin
app.post('/api/pins', async (req, res) => {
  try {
    const { title, description, image_url, owner } = req.body;
    const newPin = {
      _id: uuidv4(),
      title,
      description,
      image_url,
      owner: owner || 'demo_user',
      likes: 0,
      comments: [],
      created_at: new Date(),
      updated_at: new Date()
    };
    pins.unshift(newPin);
    res.status(201).json(newPin);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create pin' });
  }
});

// Like/Unlike pin
app.post('/api/pins/:pin_id/like', async (req, res) => {
  try {
    const { user } = req.body;
    const pin = pins.find(p => p._id === req.params.pin_id);
    if (!pin) return res.status(404).json({ error: 'Pin not found' });
    
    const existingLike = likes.find(l => l.pin_id === req.params.pin_id && l.user === user);
    
    if (existingLike) {
      // Unlike
      likes = likes.filter(l => !(l.pin_id === req.params.pin_id && l.user === user));
      pin.likes = Math.max(0, pin.likes - 1);
      res.json({ liked: false, likes: pin.likes });
    } else {
      // Like
      likes.push({ pin_id: req.params.pin_id, user, created_at: new Date() });
      pin.likes += 1;
      res.json({ liked: true, likes: pin.likes });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// Get user profile
app.get('/api/users/:wallet_address', async (req, res) => {
  try {
    let user = users.find(u => u.wallet_address === req.params.wallet_address);
    if (!user) {
      user = {
        _id: uuidv4(),
        username: req.params.wallet_address.slice(0, 8),
        wallet_address: req.params.wallet_address,
        created_at: new Date()
      };
      users.push(user);
    }
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get user pins
app.get('/api/users/:wallet_address/pins', async (req, res) => {
  try {
    const userPins = pins.filter(p => p.owner === req.params.wallet_address);
    res.json(userPins);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch user pins' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Demo server running' });
});

app.listen(PORT, () => {
  console.log(`🚀 IrysPinter Demo server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`🎨 Demo mode - using in-memory data`);
});