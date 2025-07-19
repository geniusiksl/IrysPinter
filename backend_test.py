#!/usr/bin/env python3
"""
SolPinter Backend API Test Suite
Tests all backend endpoints for the Pinterest NFT application
"""

import requests
import json
import base64
import io
from PIL import Image
import os
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL')
if not BACKEND_URL:
    print("❌ REACT_APP_BACKEND_URL not found in frontend/.env")
    exit(1)

API_BASE_URL = f"{BACKEND_URL}/api"

print(f"🔗 Testing backend at: {API_BASE_URL}")

class SolPinterAPITest:
    def __init__(self):
        self.session = requests.Session()
        self.test_pin_id = None
        self.test_user = "alice_creator"
        self.test_buyer = "bob_buyer"
        
    def create_test_image(self):
        """Create a test image for upload testing"""
        # Create a simple test image
        img = Image.new('RGB', (300, 200), color='lightblue')
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        return img_buffer.getvalue()
    
    def test_health_check(self):
        """Test GET /api/ - Basic health check"""
        print("\n🔍 Testing health check endpoint...")
        try:
            response = self.session.get(f"{API_BASE_URL}/")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "SolPinter" in data["message"]:
                    print("✅ Health check passed")
                    return True
                else:
                    print(f"❌ Health check failed - unexpected response: {data}")
                    return False
            else:
                print(f"❌ Health check failed - status code: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Health check failed - error: {e}")
            return False
    
    def test_get_pins_empty(self):
        """Test GET /api/pins - Should return empty array initially"""
        print("\n🔍 Testing get pins (empty state)...")
        try:
            response = self.session.get(f"{API_BASE_URL}/pins")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"✅ Get pins successful - returned {len(data)} pins")
                    return True
                else:
                    print(f"❌ Get pins failed - expected list, got: {type(data)}")
                    return False
            else:
                print(f"❌ Get pins failed - status code: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Get pins failed - error: {e}")
            return False
    
    def test_create_pin(self):
        """Test POST /api/pins - Create a new NFT pin with image upload"""
        print("\n🔍 Testing create pin with image upload...")
        try:
            # Create test image
            image_data = self.create_test_image()
            
            # Prepare multipart form data
            files = {
                'image': ('test_nft.png', image_data, 'image/png')
            }
            
            data = {
                'title': 'Awesome Digital Art NFT',
                'description': 'A beautiful piece of digital art created for SolPinter',
                'owner': self.test_user,
                'for_sale': True,
                'price': 2.5
            }
            
            response = self.session.post(f"{API_BASE_URL}/pins", files=files, data=data)
            
            if response.status_code == 200:
                pin_data = response.json()
                
                # Verify required NFT metadata fields
                required_fields = ['id', 'title', 'owner', 'mint_address', 'image_txid', 'metadata_txid']
                missing_fields = [field for field in required_fields if field not in pin_data]
                
                if missing_fields:
                    print(f"❌ Create pin failed - missing fields: {missing_fields}")
                    return False
                
                # Store pin ID for subsequent tests
                self.test_pin_id = pin_data['id']
                
                # Verify NFT-specific fields
                if pin_data.get('mint_address') and pin_data.get('image_txid') and pin_data.get('metadata_txid'):
                    print("✅ Create pin successful with NFT metadata")
                    print(f"   📍 Pin ID: {self.test_pin_id}")
                    print(f"   🏷️  Mint Address: {pin_data['mint_address']}")
                    print(f"   🖼️  Image TXID: {pin_data['image_txid']}")
                    print(f"   📄 Metadata TXID: {pin_data['metadata_txid']}")
                    return True
                else:
                    print("❌ Create pin failed - missing NFT metadata")
                    return False
            else:
                print(f"❌ Create pin failed - status code: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Create pin failed - error: {e}")
            return False
    
    def test_get_pins_with_data(self):
        """Test GET /api/pins - Should return pins after creation"""
        print("\n🔍 Testing get pins (with data)...")
        try:
            response = self.session.get(f"{API_BASE_URL}/pins")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    pin = data[0]
                    # Verify pin has image_url for frontend display
                    if 'image_url' in pin:
                        print(f"✅ Get pins successful - found {len(data)} pins with image URLs")
                        return True
                    else:
                        print("❌ Get pins failed - pins missing image_url field")
                        return False
                else:
                    print("❌ Get pins failed - no pins returned after creation")
                    return False
            else:
                print(f"❌ Get pins failed - status code: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Get pins failed - error: {e}")
            return False
    
    def test_like_functionality(self):
        """Test POST /api/pins/{pin_id}/like - Like/unlike functionality"""
        print("\n🔍 Testing like functionality...")
        if not self.test_pin_id:
            print("❌ Like test skipped - no test pin available")
            return False
            
        try:
            # Test liking a pin
            like_data = {"user": self.test_user}
            response = self.session.post(f"{API_BASE_URL}/pins/{self.test_pin_id}/like", json=like_data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get('success') and result.get('action') == 'liked':
                    print("✅ Like functionality successful")
                    
                    # Test unliking the same pin
                    response = self.session.post(f"{API_BASE_URL}/pins/{self.test_pin_id}/like", json=like_data)
                    if response.status_code == 200:
                        result = response.json()
                        if result.get('success') and result.get('action') == 'unliked':
                            print("✅ Unlike functionality successful")
                            return True
                        else:
                            print("❌ Unlike functionality failed")
                            return False
                    else:
                        print(f"❌ Unlike failed - status code: {response.status_code}")
                        return False
                else:
                    print(f"❌ Like failed - unexpected response: {result}")
                    return False
            else:
                print(f"❌ Like failed - status code: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Like functionality failed - error: {e}")
            return False
    
    def test_comment_functionality(self):
        """Test POST /api/pins/{pin_id}/comment - Add comment functionality"""
        print("\n🔍 Testing comment functionality...")
        if not self.test_pin_id:
            print("❌ Comment test skipped - no test pin available")
            return False
            
        try:
            comment_data = {
                "user": self.test_user,
                "content": "This is an amazing NFT! Love the artwork and concept."
            }
            
            response = self.session.post(f"{API_BASE_URL}/pins/{self.test_pin_id}/comment", json=comment_data)
            
            if response.status_code == 200:
                comment = response.json()
                
                # Verify comment structure and Irys integration
                required_fields = ['id', 'pin_id', 'user', 'content', 'txid', 'created_at']
                missing_fields = [field for field in required_fields if field not in comment]
                
                if missing_fields:
                    print(f"❌ Comment failed - missing fields: {missing_fields}")
                    return False
                
                if comment.get('txid'):  # Irys transaction ID should be present
                    print("✅ Comment functionality successful with Irys integration")
                    print(f"   💬 Comment TXID: {comment['txid']}")
                    return True
                else:
                    print("❌ Comment failed - missing Irys transaction ID")
                    return False
            else:
                print(f"❌ Comment failed - status code: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Comment functionality failed - error: {e}")
            return False
    
    def test_get_comments(self):
        """Test GET /api/pins/{pin_id}/comments - Get comments for a pin"""
        print("\n🔍 Testing get comments...")
        if not self.test_pin_id:
            print("❌ Get comments test skipped - no test pin available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE_URL}/pins/{self.test_pin_id}/comments")
            
            if response.status_code == 200:
                comments = response.json()
                if isinstance(comments, list) and len(comments) > 0:
                    comment = comments[0]
                    if 'content' in comment and 'user' in comment:
                        print(f"✅ Get comments successful - found {len(comments)} comments")
                        return True
                    else:
                        print("❌ Get comments failed - invalid comment structure")
                        return False
                else:
                    print("❌ Get comments failed - no comments returned")
                    return False
            else:
                print(f"❌ Get comments failed - status code: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Get comments failed - error: {e}")
            return False
    
    def test_purchase_functionality(self):
        """Test POST /api/pins/{pin_id}/purchase - Purchase NFT functionality"""
        print("\n🔍 Testing NFT purchase functionality...")
        if not self.test_pin_id:
            print("❌ Purchase test skipped - no test pin available")
            return False
            
        try:
            purchase_data = {"buyer": self.test_buyer}
            response = self.session.post(f"{API_BASE_URL}/pins/{self.test_pin_id}/purchase", json=purchase_data)
            
            if response.status_code == 200:
                updated_pin = response.json()
                
                # Verify ownership transfer
                if updated_pin.get('owner') == self.test_buyer and not updated_pin.get('for_sale'):
                    print("✅ NFT purchase successful")
                    print(f"   👤 New owner: {updated_pin['owner']}")
                    print(f"   🏪 For sale: {updated_pin['for_sale']}")
                    return True
                else:
                    print("❌ Purchase failed - ownership not transferred properly")
                    return False
            else:
                print(f"❌ Purchase failed - status code: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Purchase functionality failed - error: {e}")
            return False
    
    def test_mongodb_integration(self):
        """Verify MongoDB integration by checking data persistence"""
        print("\n🔍 Testing MongoDB data persistence...")
        try:
            # Create another pin to test persistence
            image_data = self.create_test_image()
            files = {'image': ('test_nft2.png', image_data, 'image/png')}
            data = {
                'title': 'Second Test NFT',
                'description': 'Testing MongoDB persistence',
                'owner': 'test_creator_2',
                'for_sale': False
            }
            
            response = self.session.post(f"{API_BASE_URL}/pins", files=files, data=data)
            
            if response.status_code == 200:
                # Verify data persists by fetching all pins
                response = self.session.get(f"{API_BASE_URL}/pins")
                if response.status_code == 200:
                    pins = response.json()
                    if len(pins) >= 2:  # Should have at least 2 pins now
                        print("✅ MongoDB integration successful - data persists correctly")
                        return True
                    else:
                        print("❌ MongoDB integration failed - data not persisting")
                        return False
                else:
                    print("❌ MongoDB integration test failed - cannot fetch pins")
                    return False
            else:
                print("❌ MongoDB integration test failed - cannot create second pin")
                return False
                
        except Exception as e:
            print(f"❌ MongoDB integration test failed - error: {e}")
            return False
    
    def test_cors_configuration(self):
        """Test CORS configuration"""
        print("\n🔍 Testing CORS configuration...")
        try:
            # Make an OPTIONS request to test CORS
            response = self.session.options(f"{API_BASE_URL}/pins")
            
            # Check if CORS headers are present
            cors_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers'
            ]
            
            has_cors = any(header in response.headers for header in cors_headers)
            
            if has_cors or response.status_code in [200, 204]:
                print("✅ CORS configuration appears to be working")
                return True
            else:
                print("❌ CORS configuration may have issues")
                return False
                
        except Exception as e:
            print(f"❌ CORS test failed - error: {e}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting SolPinter Backend API Test Suite")
        print("=" * 60)
        
        test_results = []
        
        # Run all tests in order
        tests = [
            ("Health Check", self.test_health_check),
            ("Get Pins (Empty)", self.test_get_pins_empty),
            ("Create Pin with Image Upload", self.test_create_pin),
            ("Get Pins (With Data)", self.test_get_pins_with_data),
            ("Like/Unlike Functionality", self.test_like_functionality),
            ("Comment Functionality", self.test_comment_functionality),
            ("Get Comments", self.test_get_comments),
            ("NFT Purchase Functionality", self.test_purchase_functionality),
            ("MongoDB Integration", self.test_mongodb_integration),
            ("CORS Configuration", self.test_cors_configuration)
        ]
        
        for test_name, test_func in tests:
            result = test_func()
            test_results.append((test_name, result))
            time.sleep(0.5)  # Small delay between tests
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = 0
        failed = 0
        
        for test_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} - {test_name}")
            if result:
                passed += 1
            else:
                failed += 1
        
        print(f"\n📈 Results: {passed} passed, {failed} failed out of {len(test_results)} tests")
        
        if failed == 0:
            print("🎉 All tests passed! SolPinter backend is working correctly.")
        else:
            print(f"⚠️  {failed} test(s) failed. Please check the issues above.")
        
        return failed == 0

if __name__ == "__main__":
    tester = SolPinterAPITest()
    success = tester.run_all_tests()
    exit(0 if success else 1)