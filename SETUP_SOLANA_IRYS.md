# Solana & Irys Integration Setup

## 🚀 Quick Setup Guide

### 1. Environment Configuration

Create a `.env` file in the `backend` directory:

```bash
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=solpinter

# Solana Configuration
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_DEVNET_RPC_URL=https://api.devnet.solana.com
SOLANA_PRIVATE_KEY=your_private_key_here
SOLANA_NETWORK=devnet

# Royalty Configuration
ROYALTY_PERCENTAGE=1.0
ROYALTY_WALLET=your_royalty_wallet_address_here

# Irys Configuration
IRYS_NETWORK=devnet
IRYS_TOKEN=SOL
IRYS_RPC_URL=https://api.devnet.solana.com

# Application Configuration
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
DEBUG=True
```

### 2. Install Dependencies

#### Backend
```bash
cd backend
pip install -r requirements.txt
```

#### Frontend
```bash
cd frontend
npm install
```

### 3. Solana Wallet Setup

1. **Install Phantom Wallet** (or any Solana wallet)
   - Chrome Extension: https://phantom.app/
   - Create a new wallet or import existing one

2. **Get Devnet SOL**
   - Switch to Devnet in your wallet
   - Use Solana CLI or faucet to get devnet SOL:
   ```bash
   solana airdrop 2 YOUR_PUBLIC_KEY --url devnet
   ```

3. **Export Private Key**
   - In Phantom: Settings → Security → Export Private Key
   - Add to `.env` file as `SOLANA_PRIVATE_KEY`

### 4. Irys Setup

1. **Fund Irys Account**
   ```javascript
   // In browser console or Node.js
   const { Uploader } = require('@irys/upload');
   const { Solana } = require('@irys/upload-solana');
   
   const irysUploader = await Uploader(Solana).withWallet(privateKey);
   await irysUploader.fund(irysUploader.utils.toAtomic(0.05)); // Fund with 0.05 SOL
   ```

2. **Test Upload**
   ```javascript
   const receipt = await irysUploader.upload("Hello Irys!");
   console.log(`Uploaded: https://gateway.irys.xyz/${receipt.id}`);
   ```

### 5. Start the Application

#### Backend
```bash
cd backend
python server.py
# OR
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

#### Frontend
```bash
cd frontend
npm start
```

## 🔧 Configuration Details

### Solana Network Options
- **Devnet**: For testing (free SOL available)
- **Mainnet**: For production (real SOL required)

### Irys Network Options
- **Devnet**: Free uploads, data deleted after ~60 days
- **Mainnet**: Paid uploads, permanent storage

### Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.devnet.solana.com` |
| `SOLANA_PRIVATE_KEY` | Your wallet private key | `base58_encoded_private_key` |
| `ROYALTY_PERCENTAGE` | Platform royalty percentage | `1.0` (1%) |
| `ROYALTY_WALLET` | Wallet to receive royalties | `your_wallet_address` |
| `IRYS_NETWORK` | Irys network (devnet/mainnet) | `devnet` |
| `IRYS_TOKEN` | Payment token for Irys | `SOL` |

## 🧪 Testing the Integration

### 1. Test Solana Connection
```bash
curl http://localhost:8001/api/solana/balance/YOUR_PUBLIC_KEY
```

### 2. Test Irys Upload
- Create a pin through the UI
- Check Irys gateway: `https://gateway.irys.xyz/TRANSACTION_ID`

### 3. Test NFT Minting & Royalties
- Create a pin with image
- Verify NFT on Solana Explorer: `https://explorer.solana.com/address/MINT_ADDRESS?cluster=devnet`
- Check royalty distribution in NFT metadata
- Test royalty collection during sales

## 🐛 Troubleshooting

### Common Issues

1. **"Wallet not connected"**
   - Ensure Phantom wallet is installed and connected
   - Check that you're on the correct network (Devnet/Mainnet)

2. **"Insufficient SOL balance"**
   - Get devnet SOL: `solana airdrop 2 YOUR_PUBLIC_KEY --url devnet`
   - Fund Irys account with SOL

3. **"Irys upload failed"**
   - Check Irys account balance
   - Verify network configuration
   - Check RPC endpoint availability

4. **"NFT minting failed"**
   - Verify Solana RPC connection
   - Check private key format
   - Ensure sufficient SOL for transaction fees

### Debug Mode

Set `DEBUG=True` in `.env` to see detailed logs:

```bash
# Backend logs
tail -f backend/logs/app.log

# Frontend logs
# Check browser console (F12)
```

## 🔒 Security Notes

1. **Never commit private keys to git**
   - Add `.env` to `.gitignore`
   - Use environment variables in production

2. **Use different wallets for devnet/mainnet**
   - Keep test and production wallets separate
   - Never use mainnet private keys in development

3. **Validate all inputs**
   - Check file sizes and types
   - Validate wallet addresses
   - Sanitize user inputs

## 📚 Additional Resources

- [Solana Documentation](https://docs.solana.com/)
- [Irys Documentation](https://docs.irys.xyz/)
- [Metaplex Documentation](https://docs.metaplex.com/)
- [Phantom Wallet](https://phantom.app/)

## 🚀 Production Deployment

For production deployment:

1. **Switch to Mainnet**
   ```bash
   SOLANA_NETWORK=mainnet-beta
   IRYS_NETWORK=mainnet
   ```

2. **Use Production RPC**
   ```bash
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   ```

3. **Secure Environment**
   - Use HTTPS
   - Implement proper authentication
   - Add rate limiting
   - Monitor transactions

4. **Backup Strategy**
   - Backup private keys securely
   - Monitor Irys storage
   - Track Solana transactions 