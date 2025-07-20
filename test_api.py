#!/usr/bin/env python3
"""
Simple test script to check if the API is working
"""
import requests
import time

def test_api():
    base_url = "http://localhost:8000"
    
    print("🧪 Testing SolPinter API...")
    print("=" * 40)
    
    # Test 1: Root endpoint
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ Root endpoint: {response.status_code}")
        print(f"   Response: {response.text[:100]}...")
    except Exception as e:
        print(f"❌ Root endpoint failed: {e}")
    
    # Test 2: API root endpoint
    try:
        response = requests.get(f"{base_url}/api")
        print(f"✅ API root: {response.status_code}")
        print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ API root failed: {e}")
    
    # Test 3: Pins endpoint
    try:
        response = requests.get(f"{base_url}/api/pins")
        print(f"✅ Pins endpoint: {response.status_code}")
        pins = response.json()
        print(f"   Found {len(pins)} pins")
    except Exception as e:
        print(f"❌ Pins endpoint failed: {e}")
    
    # Test 4: API docs
    try:
        response = requests.get(f"{base_url}/docs")
        print(f"✅ API docs: {response.status_code}")
        print(f"   Docs available at: {base_url}/docs")
    except Exception as e:
        print(f"❌ API docs failed: {e}")

if __name__ == "__main__":
    # Wait a bit for server to start
    print("⏳ Waiting for server to start...")
    time.sleep(2)
    
    test_api()
    
    print("\n" + "=" * 40)
    print("🎯 If all tests passed, your API is working!")
    print("🌐 Open http://localhost:3000 to see the frontend")
    print("📊 Open http://localhost:8000/docs to see API documentation") 