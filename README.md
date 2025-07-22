# SolPinter - Decentralized Pinterest on Solana

A decentralized Pinterest-like platform built on Solana blockchain with Irys for decentralized storage.

## 🆕 New Features

- ✅ **Real Solana Integration**: Connect with Phantom, Solflare, and other Solana wallets
- ✅ **Irys Decentralized Storage**: Upload images and metadata to Irys network
- ✅ **NFT Minting**: Create and mint NFTs on Solana blockchain
- ✅ **SOL Transactions**: Buy and sell pins with real SOL
- ✅ **Blockchain Verification**: Verify transactions and NFT ownership

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (local or cloud)
- Solana wallet (Phantom, Solflare, etc.)
- SOL for transactions (use devnet for testing)

### 1. Backend Setup

```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Set up environment variables (create .env file)
# See SETUP_SOLANA_IRYS.md for detailed configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=solpinter
SOLANA_NETWORK=devnet
IRYS_NETWORK=devnet

# Start the backend server
python ../start_backend.py
# OR
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup

```bash
# Install Node.js dependencies
cd frontend
npm install

# Start the development server
npm start
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🏗️ Architecture

### Frontend (React + Tailwind CSS)
- Pinterest-like interface with masonry layout
- Solana wallet integration
- NFT creation and purchase modals
- Real-time updates

### Backend (FastAPI + MongoDB)
- RESTful API with `/api` prefix
- MongoDB for metadata storage
- Irys integration for decentralized storage
- Solana NFT minting (mock implementation)

### Key Features
- ✅ **Real Solana Wallet Integration**: Connect with Phantom, Solflare, Backpack
- ✅ **Irys Decentralized Storage**: Upload images and metadata to Irys network
- ✅ **NFT Minting**: Create and mint NFTs on Solana blockchain
- ✅ **SOL Transactions**: Buy and sell pins with real SOL
- ✅ **Automatic Royalties**: 1% platform fee on all sales
- ✅ **Royalty Management**: Track and withdraw accumulated royalties
- ✅ **Blockchain Verification**: Verify transactions and NFT ownership
- ✅ **Like and Comment System**: Social features for pins
- ✅ **Pinterest-like UI/UX**: Beautiful, responsive interface

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=solpinter
```

**Frontend (.env)**
```
REACT_APP_BACKEND_URL=http://localhost:8000
```

## 🧪 Testing

### Test Integration
```bash
# Run comprehensive integration tests
python test_solana_irys_integration.py

# Test API endpoints
python test_create_pin.py
```

### Manual Testing
1. Open http://localhost:3000
2. Connect your Solana wallet (Phantom, Solflare, etc.)
3. Click "Create Pin" to upload an image to Irys
4. View pins in the grid
5. Click on a pin to see details and purchase options
6. Test SOL transactions for buying/selling pins



## 🐛 Troubleshooting

### CORS Errors
- Ensure backend is running on http://localhost:8001
- Check that CORS middleware is enabled in backend
- Verify frontend is using correct backend URL

### Solana Wallet Issues
- Ensure Phantom wallet is installed and connected
- Check that you're on the correct network (Devnet/Mainnet)
- Verify wallet has sufficient SOL for transactions

### Irys Upload Issues
- Check Irys account balance
- Verify network configuration (devnet/mainnet)
- Ensure wallet is connected before uploading

### NFT Minting Issues
- Verify Solana RPC connection
- Check private key format in .env
- Ensure sufficient SOL for transaction fees

### Image Loading Issues
- Check that `image_url` field is populated in database
- Verify Irys transaction IDs are valid
- Use browser dev tools to check network requests

### MongoDB Connection
- Ensure MongoDB is running
- Check connection string in .env file
- Verify database name is correct

## 📝 API Endpoints

### Pin Management
- `GET /api/pins` - Get all pins
- `POST /api/pins` - Create new pin
- `GET /api/pins/{id}` - Get specific pin
- `POST /api/pins/{id}/like` - Like/unlike pin
- `POST /api/pins/{id}/comment` - Add comment
- `POST /api/pins/{id}/purchase` - Purchase pin with SOL

### Solana Integration
- `GET /api/solana/balance/{public_key}` - Get SOL balance
- `POST /api/solana/transfer` - Transfer SOL between accounts
- `GET /api/solana/transaction/{signature}` - Verify transaction

### Royalty Management
- `GET /api/royalty/balance` - Get royalty wallet balance
- `POST /api/royalty/calculate` - Calculate royalty for sale amount
- `POST /api/royalty/withdraw` - Withdraw accumulated royalties

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
