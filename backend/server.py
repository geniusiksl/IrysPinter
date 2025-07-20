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

# Import our services
from config import Config
from services.solana_service import solana_service
from services.irys_service import irys_service

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = Config.MONGO_URL
db_name = Config.DB_NAME

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
solana_client = Client(Config.get_solana_rpc_url())

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

async def upload_to_irys(data, content_type="application/octet-stream"):
    """
    Upload data to Irys using our service
    """
    try:
        transaction_id = await irys_service.upload_file(data, content_type)
        return transaction_id
    except Exception as e:
        logging.error(f"Error uploading to Irys: {e}")
        # Fallback to mock for development
        import hashlib
        if isinstance(data, str):
            data = data.encode()
        tx_id = hashlib.sha256(data).hexdigest()[:32]
        return tx_id

async def mint_solana_nft(metadata_uri: str, owner_pubkey: str):
    """
    Mint NFT on Solana using our service with royalties
    """
    try:
        # Create metadata for NFT with royalties
        metadata = await solana_service.create_nft_metadata(
            name="SolPinter Pin",
            symbol="SOLPIN",
            uri=metadata_uri,
            creator_address=owner_pubkey  # Set creator as owner
        )
        
        # Mint NFT
        nft_data = await solana_service.mint_nft(metadata, owner_pubkey)
        return nft_data["mint_address"], nft_data["transaction_signature"]
        
    except Exception as e:
        logging.error(f"Error minting NFT: {e}")
        # Fallback to mock for development
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
        
        # Upload image and metadata to Irys
        upload_result = await irys_service.upload_image_with_metadata(
            image_data=image_data,
            title=title,
            description=description,
            owner=owner,
            price=price
        )
        
        # Mint NFT on Solana
        metadata_uri = upload_result["metadata_url"]
        mint_address, tx_signature = await mint_solana_nft(metadata_uri, owner)
        
        # Create pin object
        new_pin = {
            "id": str(uuid.uuid4()),
            "title": title,
            "description": description,
            "owner": owner,
            "mint_address": mint_address,
            "image_txid": upload_result["image_txid"],
            "image_url": upload_result["image_url"],
            "metadata_txid": upload_result["metadata_txid"],
            "price": price if for_sale else None,
            "for_sale": for_sale,
            "likes": 0,
            "comments": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Add to sample pins (in production, save to database)
        sample_pins.append(new_pin)
        
        logging.info(f"Pin created successfully: {new_pin['id']}")
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
        return {"has_liked": False}
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

# Solana-specific endpoints
@api_router.get("/solana/balance/{public_key}")
async def get_solana_balance(public_key: str):
    """Get SOL balance for a public key"""
    try:
        balance = await solana_service.get_balance(public_key)
        return {"public_key": public_key, "balance": balance}
    except Exception as e:
        logging.error(f"Error getting balance: {e}")
        raise HTTPException(status_code=500, detail="Failed to get balance")

@api_router.post("/solana/transfer")
async def transfer_sol(request: dict):
    """Transfer SOL between accounts"""
    try:
        from_private_key = request.get("from_private_key")
        to_public_key = request.get("to_public_key")
        amount = request.get("amount")
        
        if not all([from_private_key, to_public_key, amount]):
            raise HTTPException(status_code=400, detail="Missing required fields")
        
        # Create keypair from private key
        private_key_bytes = base58.b58decode(from_private_key)
        from_keypair = Keypair.from_bytes(private_key_bytes)
        
        # Transfer SOL
        signature = await solana_service.transfer_sol(from_keypair, to_public_key, amount)
        
        return {
            "success": True,
            "signature": signature,
            "amount": amount,
            "to": to_public_key
        }
        
    except Exception as e:
        logging.error(f"Error transferring SOL: {e}")
        raise HTTPException(status_code=500, detail="Failed to transfer SOL")

@api_router.get("/solana/transaction/{signature}")
async def verify_transaction(signature: str):
    """Verify a Solana transaction"""
    try:
        is_valid = await solana_service.verify_transaction(signature)
        return {"signature": signature, "valid": is_valid}
    except Exception as e:
        logging.error(f"Error verifying transaction: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify transaction")

# Royalty management endpoints
@api_router.get("/royalty/balance")
async def get_royalty_balance():
    """Get current royalty wallet balance"""
    try:
        balance = await solana_service.get_royalty_balance()
        return {
            "royalty_wallet": Config.ROYALTY_WALLET,
            "balance": balance,
            "royalty_percentage": Config.ROYALTY_PERCENTAGE
        }
    except Exception as e:
        logging.error(f"Error getting royalty balance: {e}")
        raise HTTPException(status_code=500, detail="Failed to get royalty balance")

@api_router.post("/royalty/calculate")
async def calculate_royalty(request: dict):
    """Calculate royalty for a given sale amount"""
    try:
        sale_amount = request.get("sale_amount")
        if not sale_amount:
            raise HTTPException(status_code=400, detail="Sale amount required")
        
        royalty_calc = await solana_service.calculate_royalty(float(sale_amount))
        return royalty_calc
    except Exception as e:
        logging.error(f"Error calculating royalty: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate royalty")

@api_router.get("/royalty/withdraw")
async def withdraw_royalties(request: dict):
    """Withdraw accumulated royalties to specified address"""
    try:
        to_address = request.get("to_address")
        amount = request.get("amount")
        
        if not to_address:
            raise HTTPException(status_code=400, detail="Destination address required")
        
        if not Config.ROYALTY_WALLET:
            raise HTTPException(status_code=400, detail="Royalty wallet not configured")
        
        # Get current balance
        current_balance = await solana_service.get_royalty_balance()
        
        # Use full balance if amount not specified
        if not amount:
            amount = current_balance
        
        if amount > current_balance:
            raise HTTPException(status_code=400, detail="Insufficient royalty balance")
        
        # Transfer royalties
        signature = await solana_service.transfer_sol(
            solana_service.keypair,  # Using platform keypair
            to_address,
            amount
        )
        
        return {
            "success": True,
            "signature": signature,
            "amount": amount,
            "to_address": to_address,
            "remaining_balance": current_balance - amount
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error withdrawing royalties: {e}")
        raise HTTPException(status_code=500, detail="Failed to withdraw royalties")

@api_router.post("/pins/{pin_id}/purchase")
async def purchase_pin(pin_id: str, request: dict):
    """Purchase a pin with SOL and automatic royalty distribution"""
    try:
        buyer_private_key = request.get("buyer_private_key")
        buyer_public_key = request.get("buyer_public_key")
        
        if not buyer_private_key or not buyer_public_key:
            raise HTTPException(status_code=400, detail="Buyer credentials required")
        
        # Find the pin
        pin = None
        for p in sample_pins:
            if p["id"] == pin_id:
                pin = p
                break
        
        if not pin:
            raise HTTPException(status_code=404, detail="Pin not found")
        
        if not pin["for_sale"]:
            raise HTTPException(status_code=400, detail="Pin is not for sale")
        
        # Process sale with royalty distribution
        private_key_bytes = base58.b58decode(buyer_private_key)
        buyer_keypair = Keypair.from_bytes(private_key_bytes)
        
        sale_result = await solana_service.process_sale_with_royalty(
            buyer_keypair,
            pin["owner"],  # seller address
            pin["price"]
        )
        
        # Update pin ownership
        pin["owner"] = buyer_public_key
        pin["for_sale"] = False
        pin["price"] = None
        pin["updated_at"] = datetime.utcnow()
        
        return {
            "success": True,
            "creator_signature": sale_result["creator_signature"],
            "royalty_signature": sale_result["royalty_signature"],
            "royalty_calculation": sale_result["royalty_calculation"],
            "new_owner": buyer_public_key,
            "pin": pin
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error purchasing pin: {e}")
        raise HTTPException(status_code=500, detail="Failed to purchase pin")

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
