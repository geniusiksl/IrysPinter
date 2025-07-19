#!/usr/bin/env python3
"""
Quick test for purchase functionality
"""

import requests
import json
import base64
import io
from PIL import Image
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL')
API_BASE_URL = f"{BACKEND_URL}/api"

def create_test_image():
    """Create a test image for upload testing"""
    img = Image.new('RGB', (300, 200), color='lightblue')
    img_buffer = io.BytesIO()
    img.save(img_buffer, format='PNG')
    img_buffer.seek(0)
    return img_buffer.getvalue()

def test_purchase():
    session = requests.Session()
    
    # First create a pin for sale
    print("Creating a pin for sale...")
    image_data = create_test_image()
    files = {'image': ('test_nft.png', image_data, 'image/png')}
    data = {
        'title': 'Purchase Test NFT',
        'description': 'Testing purchase functionality',
        'owner': 'seller_user',
        'for_sale': True,
        'price': 1.5
    }
    
    response = session.post(f"{API_BASE_URL}/pins", files=files, data=data)
    if response.status_code != 200:
        print(f"Failed to create pin: {response.status_code}")
        return False
    
    pin_data = response.json()
    pin_id = pin_data['id']
    print(f"Created pin {pin_id} for sale at {pin_data['price']} SOL")
    
    # Now test purchase
    print("Testing purchase...")
    purchase_data = {"buyer": "buyer_user"}
    response = session.post(f"{API_BASE_URL}/pins/{pin_id}/purchase", json=purchase_data)
    
    print(f"Purchase response status: {response.status_code}")
    if response.status_code == 200:
        updated_pin = response.json()
        print(f"Purchase successful! New owner: {updated_pin.get('owner')}")
        print(f"For sale: {updated_pin.get('for_sale')}")
        return True
    else:
        print(f"Purchase failed: {response.text}")
        return False

if __name__ == "__main__":
    success = test_purchase()
    print("✅ Purchase test passed" if success else "❌ Purchase test failed")