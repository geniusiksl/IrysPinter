from fastapi import FastAPI, APIRouter, Form, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import base64
import requests
import logging
import json
import os

# Ваш royalty-кошелёк (public key)
ROYALTY_WALLET = "ВАШ_РОЯЛТИ_ПАБЛИК_КЛЮЧ"

# Backend не хранит приватные ключи - пользователь сам подписывает транзакции

app = FastAPI()
api_router = APIRouter(prefix="/api")

class Pin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = ""
    owner: str
    mint_address: Optional[str] = None
    image_url: Optional[str] = None
    metadata_url: Optional[str] = None
    price: Optional[float] = None
    for_sale: bool = False
    likes: int = 0
    comments: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

pins_db = []

def upload_to_irys(file_bytes, content_type="image/png"):
    IRYS_URL = "https://node2.irys.xyz/upload"
    headers = {"Content-Type": content_type}
    response = requests.post(IRYS_URL, data=file_bytes, headers=headers)
    if response.status_code == 200:
        txid = response.json().get("id")
        url = f"https://gateway.irys.xyz/{txid}"
        return txid, url
    else:
        raise Exception(f"Irys upload failed: {response.text}")

def upload_metadata_to_irys(metadata_dict):
    IRYS_URL = "https://node2.irys.xyz/upload"
    headers = {"Content-Type": "application/json"}
    response = requests.post(IRYS_URL, data=json.dumps(metadata_dict), headers=headers)
    if response.status_code == 200:
        txid = response.json().get("id")
        url = f"https://gateway.irys.xyz/{txid}"
        return txid, url
    else:
        raise Exception(f"Irys upload failed: {response.text}")

def generate_mint_instructions(owner_pubkey: str, metadata_url: str, title: str, description: str, royalty_wallet: str):
    # Backend только формирует инструкции для минта NFT
    # Пользователь сам подписывает и отправляет транзакцию
    return {
        "instructions": [
            # Здесь должны быть инструкции для создания mint, metadata, etc.
            # Пока возвращаем заглушку
        ],
        "metadata": {
            "name": title,
            "symbol": "PIN", 
            "uri": metadata_url,
            "seller_fee_basis_points": 100,  # 1% royalty
            "creators": [{"address": royalty_wallet, "verified": False, "share": 100}]
        }
    }

@api_router.post("/pins", response_model=Pin)
async def create_pin(
    title: str,
    description: str = "",
    owner: str = ...,
    mint_address: Optional[str] = None,
    image_url: Optional[str] = None,
    metadata_url: Optional[str] = None,
    price: Optional[float] = None,
    for_sale: bool = False,
    transaction_signature: Optional[str] = None,
):
    try:
        # Create pin with real NFT data from frontend
        pin = Pin(
            title=title,
            description=description,
            owner=owner,
            mint_address=mint_address,
            image_url=image_url,
            metadata_url=metadata_url,
            price=price,
            for_sale=for_sale
        )

        # 4. Сохраняем пин
        pin_id = str(uuid.uuid4())
        new_pin = {
            "id": pin_id,
            "title": title,
            "description": description,
            "owner": owner,
            "mint_address": mint_address,
            "image_url": image_url,
            "metadata_url": metadata_url,
            "price": price if for_sale else None,
            "for_sale": for_sale,
            "likes": 0,
            "comments": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        pins_db.append(new_pin)
        return new_pin
    except Exception as e:
        logging.error(f"Error creating pin: {e}")
        raise HTTPException(status_code=500, detail="Failed to create pin")

@api_router.get("/pins", response_model=List[Pin])
async def get_pins():
    return pins_db

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)