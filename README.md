# IrysPinter - Decentralized Pinterest on Irys

A decentralized Pinterest-like platform built on Arbitrum blockchain with Irys for decentralized storage.

## Features

- ✅ **Irys Decentralized Storage**: Upload images and metadata to Irys network
- ✅ **ETH Transactions**: Buy and sell pins with real ETH

## Quick Start

### Prerequisites
- Node.js 16+
- MongoDB (local or cloud)
- Ethereum wallet (MetaMask, etc.)
- ETH for transactions

### 1. Backend Setup

```bash

# Set up environment variables (create .env file)
MONGO_URL=mongodb://localhost:27017
DB_NAME=iryspinter
ETHEREUM_NETWORK=mainnet
IRYS_NETWORK=mainnet

# Install Node.js dependencies
cd backend
npm install

# Start the development server
npm start OR node server.js
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
- Backend API: https://iryspinter.onrender.com/api


MIT License - see LICENSE file for details
