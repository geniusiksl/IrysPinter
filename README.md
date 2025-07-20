# SolPinter - Decentralized Pinterest on Solana

A decentralized Pinterest-like platform built on Solana blockchain with Irys for decentralized storage.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (local or cloud)

### 1. Backend Setup

```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Set up environment variables (create .env file)
MONGO_URL=mongodb://localhost:27017
DB_NAME=solpinter

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
- ✅ Create NFT pins with images
- ✅ Store images on Irys (decentralized)
- ✅ Mint NFTs on Solana
- ✅ Buy/sell pins with SOL
- ✅ Like and comment system
- ✅ Pinterest-like UI/UX

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

### Test API Endpoints
```bash
# Test image loading
python test_images.py

# Test pin creation
python test_create_pin.py
```

### Manual Testing
1. Open http://localhost:3000
2. Click "Create Pin" to upload an image
3. View pins in the grid
4. Click on a pin to see details
5. Test purchase functionality

## 🐛 Troubleshooting

### CORS Errors
- Ensure backend is running on http://localhost:8000
- Check that CORS middleware is enabled in backend
- Verify frontend is using correct backend URL

### Image Loading Issues
- Check that `image_url` field is populated in database
- Verify Irys transaction IDs are valid
- Use browser dev tools to check network requests

### MongoDB Connection
- Ensure MongoDB is running
- Check connection string in .env file
- Verify database name is correct

## 📝 API Endpoints

- `GET /api/pins` - Get all pins
- `POST /api/pins` - Create new pin
- `GET /api/pins/{id}` - Get specific pin
- `POST /api/pins/{id}/like` - Like/unlike pin
- `POST /api/pins/{id}/comment` - Add comment
- `POST /api/pins/{id}/purchase` - Purchase pin

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
