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
from solana.keypair import Keypair
from solana.publickey import PublicKey
from solana.transaction import Transaction
import base58

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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
        # Read and convert image to base64
        image_data = await image.read()
        image_base64 = convert_image_to_base64(image_data)
        
        # Upload image to Irys (mock implementation)
        image_txid = await upload_to_irys(image_data, image.content_type)
        
        # Create metadata
        metadata = {
            "name": title,
            "description": description,
            "image": f"data:{image.content_type};base64,{image_base64}",
            "attributes": [
                {"trait_type": "Platform", "value": "SolPinter"},
                {"trait_type": "Creator", "value": owner}
            ]
        }
        
        # Upload metadata to Irys
        metadata_txid = await upload_to_irys(json.dumps(metadata), "application/json")
        
        # Mint NFT on Solana (mock implementation)
        mint_address, tx_id = await mint_solana_nft(f"https://gateway.irys.xyz/{metadata_txid}", owner)
        
        # Create pin object
        pin_data = Pin(
            title=title,
            description=description,
            owner=owner,
            mint_address=mint_address,
            image_txid=image_txid,
            metadata_txid=metadata_txid,
            price=price if for_sale else None,
            for_sale=for_sale
        )
        
        # Store in MongoDB
        await db.pins.insert_one(pin_data.dict())
        
        # Return pin with image_url for frontend
        pin_dict = pin_data.dict()
        pin_dict["image_url"] = f"data:{image.content_type};base64,{image_base64}"
        
        return Pin(**pin_dict)
        
    except Exception as e:
        logging.error(f"Error creating pin: {e}")
        raise HTTPException(status_code=500, detail="Failed to create pin")

@api_router.get("/pins", response_model=List[dict])
async def get_pins():
    try:
        pins_cursor = db.pins.find().sort("created_at", -1)
        pins = await pins_cursor.to_list(100)
        
        # Add image URLs for frontend display
        result_pins = []
        for pin in pins:
            pin["id"] = pin["_id"] = str(pin["_id"]) if "_id" in pin else pin.get("id")
            
            # Try to get image from Irys or create a placeholder
            try:
                # For now, create a placeholder base64 image
                placeholder_image = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjYWFhIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+TkZUPC90ZXh0Pjwvc3ZnPg=="
                pin["image_url"] = placeholder_image
            except:
                pin["image_url"] = None
                
            result_pins.append(pin)
            
        return result_pins
        
    except Exception as e:
        logging.error(f"Error fetching pins: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch pins")

@api_router.post("/pins/{pin_id}/like")
async def like_pin(pin_id: str, request: dict):
    try:
        user = request.get("user")
        if not user:
            raise HTTPException(status_code=400, detail="User required")
        
        # Check if already liked
        existing_like = await db.likes.find_one({"pin_id": pin_id, "user": user})
        
        if existing_like:
            # Unlike - remove like and create "unlike" transaction
            await db.likes.delete_one({"_id": existing_like["_id"]})
            await db.pins.update_one({"id": pin_id}, {"$inc": {"likes": -1}})
            action = "unliked"
        else:
            # Like - add like and create transaction on Irys
            like_data = {
                "action": "like",
                "pin_id": pin_id,
                "user": user,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Upload like transaction to Irys
            like_txid = await upload_to_irys(json.dumps(like_data), "application/json")
            
            # Store like
            like = Like(pin_id=pin_id, user=user, txid=like_txid)
            await db.likes.insert_one(like.dict())
            
            # Update pin likes count
            await db.pins.update_one({"id": pin_id}, {"$inc": {"likes": 1}})
            action = "liked"
        
        return {"success": True, "action": action}
        
    except Exception as e:
        logging.error(f"Error liking pin: {e}")
        raise HTTPException(status_code=500, detail="Failed to process like")

@api_router.post("/pins/{pin_id}/comment", response_model=Comment)
async def add_comment(pin_id: str, request: dict):
    try:
        user = request.get("user")
        content = request.get("content")
        
        if not user or not content:
            raise HTTPException(status_code=400, detail="User and content required")
        
        # Create comment data for Irys
        comment_data = {
            "action": "comment",
            "pin_id": pin_id,
            "user": user,
            "content": content,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Upload comment to Irys
        comment_txid = await upload_to_irys(json.dumps(comment_data), "application/json")
        
        # Store comment
        comment = Comment(pin_id=pin_id, user=user, content=content, txid=comment_txid)
        await db.comments.insert_one(comment.dict())
        
        # Update pin comments count
        await db.pins.update_one({"id": pin_id}, {"$inc": {"comments": 1}})
        
        return comment
        
    except Exception as e:
        logging.error(f"Error adding comment: {e}")
        raise HTTPException(status_code=500, detail="Failed to add comment")

@api_router.get("/pins/{pin_id}/comments", response_model=List[Comment])
async def get_comments(pin_id: str):
    try:
        comments_cursor = db.comments.find({"pin_id": pin_id}).sort("created_at", -1)
        comments = await comments_cursor.to_list(100)
        
        result_comments = []
        for comment in comments:
            comment["id"] = str(comment["_id"]) if "_id" in comment else comment.get("id")
            result_comments.append(Comment(**comment))
            
        return result_comments
        
    except Exception as e:
        logging.error(f"Error fetching comments: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch comments")

@api_router.get("/pins/{pin_id}/likes/{user}")
async def check_like_status(pin_id: str, user: str):
    try:
        like = await db.likes.find_one({"pin_id": pin_id, "user": user})
        return {"has_liked": like is not None}
    except Exception as e:
        logging.error(f"Error checking like status: {e}")
        return {"has_liked": False}

@api_router.post("/pins/{pin_id}/purchase")
async def purchase_pin(pin_id: str, request: dict):
    try:
        buyer = request.get("buyer")
        if not buyer:
            raise HTTPException(status_code=400, detail="Buyer required")
        
        # Get pin details
        pin = await db.pins.find_one({"id": pin_id})
        if not pin:
            raise HTTPException(status_code=404, detail="Pin not found")
        
        if not pin.get("for_sale"):
            raise HTTPException(status_code=400, detail="Pin is not for sale")
        
        if pin.get("owner") == buyer:
            raise HTTPException(status_code=400, detail="Cannot buy your own NFT")
        
        # Create purchase transaction data
        purchase_data = {
            "action": "purchase",
            "pin_id": pin_id,
            "buyer": buyer,
            "seller": pin["owner"],
            "price": pin["price"],
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Upload purchase transaction to Irys
        purchase_txid = await upload_to_irys(json.dumps(purchase_data), "application/json")
        
        # Update pin ownership and remove from sale
        await db.pins.update_one(
            {"id": pin_id},
            {
                "$set": {
                    "owner": buyer,
                    "for_sale": False,
                    "price": None,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Store purchase transaction
        await db.transactions.insert_one({
            "type": "purchase",
            "pin_id": pin_id,
            "buyer": buyer,
            "seller": pin["owner"],
            "price": pin["price"],
            "txid": purchase_txid,
            "created_at": datetime.utcnow()
        })
        
        # Return updated pin
        updated_pin = await db.pins.find_one({"id": pin_id})
        updated_pin["id"] = str(updated_pin["_id"]) if "_id" in updated_pin else updated_pin.get("id")
        
        return updated_pin
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Error purchasing pin: {e}")
        raise HTTPException(status_code=500, detail="Failed to purchase pin")

# Legacy routes for compatibility
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
