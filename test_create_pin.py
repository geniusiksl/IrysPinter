#!/usr/bin/env python3
"""
Test script to create a pin via API
"""
import requests
import time

def test_create_pin():
    print("🧪 Testing pin creation...")
    
    # Create a simple test image (1x1 pixel PNG)
    test_image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x0cIDATx\x9cc```\x00\x00\x00\x04\x00\x01\xf6\x178\x00\x00\x00\x00IEND\xaeB`\x82'
    
    # Create form data
    files = {
        'image': ('test.png', test_image_data, 'image/png')
    }
    
    data = {
        'title': 'Test Pin',
        'description': 'This is a test pin',
        'owner': 'test_user',
        'for_sale': 'false',
        'price': ''
    }
    
    try:
        response = requests.post(
            "http://localhost:8001/api/pins",
            files=files,
            data=data,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Pin created successfully!")
            return True
        else:
            print("❌ Failed to create pin")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_create_pin() 