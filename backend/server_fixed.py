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
import base58

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
        "image_url": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmNjYwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U3Vuc2V0PC90ZXh0Pjwvc3ZnPg==",
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
        "image_url": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzOTkzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TW91bnRhaW48L3RleHQ+PC9zdmc+",
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
    return base64.b64encode(image_data).decode('utf-8')

async def upload_to_irys(data, content_type="application/octet-stream"):
    """
    Mock function to simulate Irys upload
    In real implementation, you would integrate with Irys SDK
    """
    # For now, return a mock transaction ID
    import hashlib
    if isinstance(data, str):
        data = data.encode()
    tx_id = hashlib.sha256(data).hexdigest()[:32]
    return tx_id

async def mint_solana_nft(metadata_uri: str, owner_pubkey: str):
    """
    Mock function to mint NFT on Solana
    In real implementation, you would use Metaplex Token Metadata program
    """
    # For now, return a mock mint address and transaction ID
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
    image: UploadFile = File(...)
):
    try:
        # Read image data
        image_data = await image.read()
        
        # Create a simple mock pin
        new_pin = {
            "id": str(len(sample_pins) + 1),
            "title": title,
            "description": description,
            "owner": owner,
            "mint_address": f"mock_mint_{len(sample_pins) + 1}",
            "image_txid": f"mock_tx_{len(sample_pins) + 1}",
            "image_url": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzAwNjZmZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TmV3IFBpbjwvdGV4dD48L3N2Zz4=",
            "metadata_txid": f"mock_meta_{len(sample_pins) + 1}",
            "price": price if for_sale else None,
            "for_sale": for_sale,
            "likes": 0,
            "comments": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Add to sample pins
        sample_pins.append(new_pin)
        
        return new_pin
        
    except Exception as e:
        logging.error(f"Error creating pin: {e}")
        raise HTTPException(status_code=500, detail="Failed to create pin")

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
        return {"liked": False}
    except Exception as e:
        logging.error(f"Error checking like status: {e}")
        raise HTTPException(status_code=500, detail="Failed to check like status")

@api_router.post("/pins/{pin_id}/like")
async def like_pin(pin_id: str, request: dict):
    try:
        user = request.get("user")
        if not user:
            raise HTTPException(status_code=400, detail="User required")
        
        # Find the pin and update likes count
        for pin in sample_pins:
            if pin["id"] == pin_id:
                pin["likes"] += 1
                return {"success": True, "action": "liked", "likes": pin["likes"]}
        
        raise HTTPException(status_code=404, detail="Pin not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error liking pin: {e}")
        raise HTTPException(status_code=500, detail="Failed to process like")

@api_router.post("/pins/{pin_id}/comment")
async def add_comment(pin_id: str, request: dict):
    try:
        user = request.get("user")
        content = request.get("content")
        
        if not user or not content:
            raise HTTPException(status_code=400, detail="User and content required")
        
        # Find the pin and update comments count
        for pin in sample_pins:
            if pin["id"] == pin_id:
                pin["comments"] += 1
                return {
                    "id": str(len(sample_pins) + 1),
                    "pin_id": pin_id,
                    "user": user,
                    "content": content,
                    "created_at": datetime.utcnow()
                }
        
        raise HTTPException(status_code=404, detail="Pin not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error adding comment: {e}")
        raise HTTPException(status_code=500, detail="Failed to add comment")

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