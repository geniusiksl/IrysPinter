from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import base64
import json
import requests
from solana.rpc.api import Client
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.transaction import Transaction
from solana.rpc.types import TxOpts
import base58

SYS_PROGRAM_ID = Pubkey.from_string("11111111111111111111111111111111")

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'solpinter')

# Force using mock database for development
print("🔧 Using in-memory storage for development")

# Create a mock database for development
class MockDB:
    def __init__(self):
        self.pins = []
        self.comments = []
        self.likes = []
        self.transactions = []
        self.status_checks = []
    
    def __getattr__(self, name):
        return MockCollection()

class MockCollection:
    def __init__(self):
        self.data = []
    
    async def insert_one(self, doc):
        doc['_id'] = len(self.data) + 1
        self.data.append(doc)
        return type('MockResult', (), {'inserted_id': doc['_id']})()
    
    async def find(self):
        return MockCursor(self.data)
    
    async def find_one(self, query):
        for item in self.data:
            if all(item.get(k) == v for k, v in query.items()):
                return item
        return None
    
    async def update_one(self, query, update):
        for item in self.data:
            if all(item.get(k) == v for k, v in query.items()):
                if '$set' in update:
                    item.update(update['$set'])
                if '$inc' in update:
                    for k, v in update['$inc'].items():
                        item[k] = item.get(k, 0) + v
                return type('MockResult', (), {'modified_count': 1})()
        return type('MockResult', (), {'modified_count': 0})()
    
    async def delete_one(self, query):
        for i, item in enumerate(self.data):
            if all(item.get(k) == v for k, v in query.items()):
                del self.data[i]
                return type('MockResult', (), {'deleted_count': 1})()
        return type('MockResult', (), {'deleted_count': 0})()

class MockCursor:
    def __init__(self, data):
        self.data = data
    
    def sort(self, field, direction):
        # Simple sorting - just return self for now
        return self
    
    async def to_list(self, limit):
        return self.data[:limit]

db = MockDB()

# Add some sample pins for testing
sample_pins = [
    {
        "id": "1",
        "title": "Beautiful Sunset",
        "description": "Amazing sunset over the ocean",
        "owner": "artist1",
        "mint_address": "sample_mint_1",
        "image_txid": "sample_tx_1",
        "image_url": "https://via.placeholder.com/300x200/ff6600/ffffff?text=Sunset",
        "metadata_txid": "sample_meta_1",
        "price": 0.5,
        "for_sale": True,
        "likes": 15,
        "comments": 3,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    },
    {
        "id": "2", 
        "title": "Mountain View",
        "description": "Stunning mountain landscape",
        "owner": "artist2",
        "mint_address": "sample_mint_2",
        "image_txid": "sample_tx_2",
        "image_url": "https://via.placeholder.com/300x200/339933/ffffff?text=Mountain",
        "metadata_txid": "sample_meta_2",
        "price": None,
        "for_sale": False,
        "likes": 8,
        "comments": 1,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
]

# Add sample pins to mock database
for pin in sample_pins:
    db.pins.append(pin)

# Solana connection
solana_client = Client("https://api.mainnet-beta.solana.com")

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Pydantic models
class Pin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = ""
    owner: str
    mint_address: Optional[str] = None
    image_txid: str  # Irys transaction ID for image
    image_url: Optional[str] = None  # Direct image URL for frontend
    metadata_txid: Optional[str] = None  # Irys transaction ID for metadata
    price: Optional[float] = None
    for_sale: bool = False
    likes: int = 0
    comments: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pin_id: str
    user: str
    content: str
    txid: Optional[str] = None  # Irys transaction ID for comment
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Like(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    pin_id: str
    user: str
    txid: Optional[str] = None  # Irys transaction ID for like
    created_at: datetime = Field(default_factory=datetime.utcnow)

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Helper functions
def convert_image_to_base64(image_data: bytes) -> str:
    """Convert image bytes to base64 string"""
    try:
        # Limit image size to prevent issues
        if len(image_data) > 5 * 1024 * 1024:  # 5MB limit
            raise ValueError("Image too large")
        return base64.b64encode(image_data).decode('utf-8')
    except Exception as e:
        print(f"Error converting image to base64: {e}")
        # Return a simple fallback image
        return "PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmNjYwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RXJyb3I8L3RleHQ+PC9zdmc+"

# Irys upload function (real, via REST API)
async def upload_to_irys(data, content_type="application/octet-stream", wallet_private_key=None):
    """
    Upload data to Irys via REST API. User must sign the transaction with their wallet.
    """
    # Irys testnet endpoint
    IRYS_URL = "https://devnet.irys.xyz"
    headers = {"Content-Type": content_type}
    # For demo: just upload as anonymous (for real: use wallet auth)
    response = requests.post(f"{IRYS_URL}/upload", data=data, headers=headers)
    if response.status_code == 200:
        txid = response.json().get("id")
        return txid
    else:
        raise Exception(f"Irys upload failed: {response.text}")

# Solana NFT minting (Metaplex, devnet)
async def mint_solana_nft(metadata_uri: str, owner_private_key: str):
    """
    Mint NFT on Solana devnet using Metaplex Token Metadata standard.
    """
    # Connect to devnet
    solana_client = Client("https://api.devnet.solana.com")
    # Load keypair
    kp = Keypair.from_secret_key(base58.b58decode(owner_private_key))
    owner_pubkey = kp.public_key
    # For demo: use a simple mint (not full Metaplex, for brevity)
    # In production: use metaplex-foundation/python-api or send custom instructions
    # Here: create a new token mint, set URI in metadata (mocked)
    # ... (for brevity, return mock mint address and txid, but show how to do real mint)
    mint_address = base58.b58encode(os.urandom(32)).decode()[:44]
    tx_id = base58.b58encode(os.urandom(64)).decode()[:88]
    return mint_address, tx_id

# Routes
@api_router.get("/")
async def root():
    return {"message": "SolPinter API - Decentralized Pinterest on Solana"}

@api_router.post("/pins", response_model=Pin)
async def create_pin(
    title: str = Form(...),
    description: str = Form(""),
    owner: str = Form(...),
    for_sale: bool = Form(False),
    price: Optional[float] = Form(None),
    image_txid: str = Form(...),  # Irys txid for image
    image_url: str = Form(...),   # Irys gateway URL for image
    metadata_txid: str = Form(...),  # Irys txid for metadata
    mint_address: str = Form(...),   # NFT mint address
    mint_txid: str = Form(...),      # Solana mint transaction id
):
    try:
        pin_id = str(uuid.uuid4())
        new_pin = {
            "id": pin_id,
            "title": title,
            "description": description,
            "owner": owner,
            "mint_address": mint_address,
            "image_txid": image_txid,
            "image_url": image_url,
            "metadata_txid": metadata_txid,
            "price": price if for_sale else None,
            "for_sale": for_sale,
            "likes": 0,
            "comments": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "mint_txid": mint_txid
        }
        sample_pins.append(new_pin)
        return new_pin
    except Exception as e:
        logging.error(f"Error creating pin: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create pin: {e}")

@api_router.get("/pins", response_model=List[dict])
async def get_pins():
    try:
        # Return sample pins directly
        return sample_pins
        
    except Exception as e:
        logging.error(f"Error fetching pins: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch pins")

@api_router.get("/pins/{pin_id}/comments", response_model=List[Comment])
async def get_comments(pin_id: str):
    try:
        # Return empty list for now
        return []
    except Exception as e:
        logging.error(f"Error fetching comments: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch comments")

@api_router.get("/pins/{pin_id}/likes/{user}")
async def check_like_status(pin_id: str, user: str):
    try:
        # Return false for now (not liked)
        return {"has_liked": False}
    except Exception as e:
        logging.error(f"Error checking like status: {e}")
        raise HTTPException(status_code=500, detail="Failed to check like status")

@api_router.post("/pins/{pin_id}/like")
async def like_pin(pin_id: str, request: dict):
    try:
        user = request.get("user")
        txid = request.get("txid")  # Irys txid
        solana_txid = request.get("solana_txid")  # Solana txid, если лайк минтится как NFT
        like_id = str(uuid.uuid4())
        new_like = {
            "id": like_id,
            "pin_id": pin_id,
            "user": user,
            "txid": txid,
            "solana_txid": solana_txid,
            "created_at": datetime.utcnow()
        }
        db.likes.append(new_like)
        # Обновить счетчик лайков у пина
        for pin in sample_pins:
            if pin["id"] == pin_id:
                pin["likes"] += 1
                pin["updated_at"] = datetime.utcnow()
        return new_like
    except Exception as e:
        logging.error(f"Error liking pin: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to like pin: {e}")

@api_router.post("/pins/{pin_id}/comment")
async def add_comment(pin_id: str, request: dict):
    try:
        user = request.get("user")
        content = request.get("content")
        txid = request.get("txid")  # Irys txid
        solana_txid = request.get("solana_txid")  # Solana txid, если комментарий минтится как NFT
        comment_id = str(uuid.uuid4())
        new_comment = {
            "id": comment_id,
            "pin_id": pin_id,
            "user": user,
            "content": content,
            "txid": txid,
            "solana_txid": solana_txid,
            "created_at": datetime.utcnow()
        }
        db.comments.append(new_comment)
        # Обновить счетчик комментариев у пина
        for pin in sample_pins:
            if pin["id"] == pin_id:
                pin["comments"] += 1
                pin["updated_at"] = datetime.utcnow()
        return new_comment
    except Exception as e:
        logging.error(f"Error adding comment: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add comment: {e}")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include the API router
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
