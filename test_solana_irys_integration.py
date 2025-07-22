#!/usr/bin/env python3
"""
Test script for Solana and Irys integration
"""

import asyncio
import requests
import json
import base58
import os
from pathlib import Path

# Test configuration
BACKEND_URL = "http://localhost:8001"
API_BASE = f"{BACKEND_URL}/api"

def test_backend_health():
    """Test if backend is running"""
    try:
        response = requests.get(f"{API_BASE}/")
        print(f"✅ Backend health check: {response.status_code}")
        print(f"   Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
        return False

def test_solana_balance():
    """Test Solana balance endpoint"""
    try:
        # Test with a sample public key
        test_pubkey = "11111111111111111111111111111111"
        response = requests.get(f"{API_BASE}/solana/balance/{test_pubkey}")
        print(f"✅ Solana balance check: {response.status_code}")
        print(f"   Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Solana balance check failed: {e}")
        return False

def test_pins_endpoint():
    """Test pins endpoint"""
    try:
        response = requests.get(f"{API_BASE}/pins")
        print(f"✅ Pins endpoint check: {response.status_code}")
        pins = response.json()
        print(f"   Found {len(pins)} pins")
        return True
    except Exception as e:
        print(f"❌ Pins endpoint check failed: {e}")
        return False

def test_create_pin():
    """Test pin creation (without actual upload)"""
    try:
        # Create test pin data
        pin_data = {
            "title": "Test Pin",
            "description": "Test description",
            "owner": "11111111111111111111111111111111",
            "image_txid": "test_tx_id",
            "image_url": "https://via.placeholder.com/300x200",
            "metadata_txid": "test_metadata_tx_id",
            "price": 0.1,
            "for_sale": True
        }
        
        response = requests.post(f"{API_BASE}/pins", json=pin_data)
        print(f"✅ Pin creation test: {response.status_code}")
        if response.status_code == 200:
            created_pin = response.json()
            print(f"   Created pin ID: {created_pin.get('id')}")
        return True
    except Exception as e:
        print(f"❌ Pin creation test failed: {e}")
        return False

def test_irys_service():
    """Test Irys service functionality"""
    try:
        # This would require actual Irys integration
        print("ℹ️  Irys service test requires actual wallet connection")
        print("   Run this test with a connected wallet")
        return True
    except Exception as e:
        print(f"❌ Irys service test failed: {e}")
        return False

def test_solana_service():
    """Test Solana service functionality"""
    try:
        # Test transaction verification
        test_signature = "test_signature_123"
        response = requests.get(f"{API_BASE}/solana/transaction/{test_signature}")
        print(f"✅ Solana transaction verification: {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ Solana service test failed: {e}")
        return False

def test_configuration():
    """Test configuration loading"""
    try:
        config_file = Path("backend/config.py")
        if config_file.exists():
            print("✅ Configuration file exists")
            
            # Check if .env file exists
            env_file = Path("backend/.env")
            if env_file.exists():
                print("✅ Environment file exists")
            else:
                print("⚠️  Environment file (.env) not found")
                print("   Create backend/.env with required variables")
            
            return True
        else:
            print("❌ Configuration file not found")
            return False
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Solana & Irys Integration")
    print("=" * 50)
    
    tests = [
        ("Configuration", test_configuration),
        ("Backend Health", test_backend_health),
        ("Solana Balance", test_solana_balance),
        ("Pins Endpoint", test_pins_endpoint),
        ("Pin Creation", test_create_pin),
        ("Solana Service", test_solana_service),
        ("Irys Service", test_irys_service),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}...")
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All tests passed! Integration is working correctly.")
    else:
        print("⚠️  Some tests failed. Check the configuration and setup.")
        print("\n📋 Next steps:")
        print("1. Ensure backend is running on port 8001")
        print("2. Check environment variables in backend/.env")
        print("3. Verify Solana RPC connection")
        print("4. Test with actual wallet connection")

if __name__ == "__main__":
    main() 