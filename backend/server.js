// backend/server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const upload = multer();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory storage
let pins = [
    {
      id: uuidv4(),
      title: "Test Pin 1",
      description: "Test Pin 1",
      owner: "0x1111111111111111111111111111111111111111",
      mint_address: "0xmockmintaddress1",
      image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
      metadata_url: "https://gateway.irys.xyz/mockmeta1",
      price: 0.01,
      for_sale: true,
      duration: 30,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      likes: 2,
      comments: 1,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      title: "Test Pin 2",
      description: "Test Pin 2",
      owner: "0x2222222222222222222222222222222222222222",
      mint_address: "0xmockmintaddress2",
      image_url: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
      metadata_url: "https://gateway.irys.xyz/mockmeta2",
      price: 0.02,
      for_sale: false,
      duration: null,
      expires_at: null,
      likes: 5,
      comments: 3,
      created_at: new Date(),
      updated_at: new Date(),
    }
  ];
let comments = [];
let likes = [];

// API root
app.get('/api', (req, res) => {
  res.json({ message: 'IrysPinter API - Decentralized Pinterest on Ethereum/Arbitrum' });
});

// Function to check and remove expired listings
const checkExpiredListings = () => {
  const now = new Date();
  pins = pins.map(pin => {
    if (pin.for_sale && pin.expires_at && new Date(pin.expires_at) <= now) {
      return {
        ...pin,
        for_sale: false,
        expires_at: null,
        updated_at: new Date()
      };
    }
    return pin;
  });
};

// Get all pins
app.get('/api/pins', (req, res) => {
  checkExpiredListings(); // Check for expired listings before returning
  res.json(pins);
});

// Create pin (NFT)
app.post('/api/pins', upload.none(), async (req, res) => {
  try {
    const { title, description = '', owner, mint_address, image_url, metadata_url, price, for_sale, duration, transaction_signature } = req.body;
    
    // Calculate expiration date if duration is provided
    let expires_at = null;
    if (for_sale === 'true' || for_sale === true) {
      if (duration && parseInt(duration) > 0) {
        expires_at = new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000);
      }
    }
    
    const pin = {
      id: uuidv4(),
      title,
      description,
      owner,
      mint_address: mint_address || null,
      image_url: image_url || null,
      metadata_url: metadata_url || null,
      price: for_sale ? parseFloat(price) : null,
      for_sale: for_sale === 'true' || for_sale === true,
      duration: duration ? parseInt(duration) : null,
      expires_at,
      likes: 0,
      comments: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    pins.unshift(pin);
    res.json(pin);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create pin', details: e.message });
  }
});

// Get comments for a pin
app.get('/api/pins/:pin_id/comments', (req, res) => {
  const pin_id = req.params.pin_id;
  const pinComments = comments.filter((c) => c.pin_id === pin_id);
  res.json(pinComments);
});

// Add comment to a pin
app.post('/api/pins/:pin_id/comment', (req, res) => {
  const pin_id = req.params.pin_id;
  const { user, content, txid } = req.body;
  if (!user || !content) return res.status(400).json({ error: 'User and content required' });
  const comment = {
    id: uuidv4(),
    pin_id,
    user,
    content,
    txid: txid || null,
    created_at: new Date(),
  };
  comments.unshift(comment);
  // Update pin's comment count
  const pin = pins.find((p) => p.id === pin_id);
  if (pin) pin.comments += 1;
  res.json(comment);
});

// Check if user liked a pin
app.get('/api/pins/:pin_id/likes/:user', (req, res) => {
  const { pin_id, user } = req.params;
  const liked = likes.some((l) => l.pin_id === pin_id && l.user === user);
  res.json({ liked });
});

// Like a pin
app.post('/api/pins/:pin_id/like', (req, res) => {
  const pin_id = req.params.pin_id;
  const { user, txid } = req.body;
  if (!user) return res.status(400).json({ error: 'User required' });
  // Prevent double-like
  if (likes.some((l) => l.pin_id === pin_id && l.user === user)) {
    return res.json({ success: false, action: 'already_liked' });
  }
  const like = {
    id: uuidv4(),
    pin_id,
    user,
    txid: txid || null,
    created_at: new Date(),
  };
  likes.unshift(like);
  // Update pin's like count
  const pin = pins.find((p) => p.id === pin_id);
  if (pin) pin.likes += 1;
  res.json({ success: true, action: 'liked', likes: pin ? pin.likes : 1 });
});

// Purchase NFT (generate instructions only)
app.post('/api/pins/:pin_id/purchase', (req, res) => {
  const pin_id = req.params.pin_id;
  const { buyer, price } = req.body;
  const pin = pins.find((p) => p.id === pin_id);
  if (!pin) return res.status(404).json({ error: 'Pin not found' });
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
});

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`IrysPinter backend running on http://localhost:${PORT}`);
});
