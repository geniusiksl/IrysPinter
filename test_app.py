#!/usr/bin/env python3
"""
Test script to check if the entire SolPinter app is working
"""
import requests
import time
import webbrowser

def test_backend():
    print("🔍 Testing Backend...")
    try:
        # Test API root
        response = requests.get("http://localhost:8001/api", timeout=5)
        if response.status_code == 200:
            print("✅ Backend API root: OK")
        else:
            print(f"❌ Backend API root: {response.status_code}")
            return False
        
        # Test pins endpoint
        response = requests.get("http://localhost:8001/api/pins", timeout=5)
        if response.status_code == 200:
            pins = response.json()
            print(f"✅ Backend pins endpoint: OK ({len(pins)} pins)")
            return True
        else:
            print(f"❌ Backend pins endpoint: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Backend test failed: {e}")
        return False

def test_frontend():
    print("\n🔍 Testing Frontend...")
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend: OK")
            return True
        else:
            print(f"❌ Frontend: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend test failed: {e}")
        return False

def main():
    print("🧪 Testing SolPinter Application")
    print("=" * 50)
    
    # Wait for services to start
    print("⏳ Waiting for services to start...")
    time.sleep(3)
    
    backend_ok = test_backend()
    frontend_ok = test_frontend()
    
    print("\n" + "=" * 50)
    
    if backend_ok and frontend_ok:
        print("🎉 SUCCESS! Your SolPinter app is working!")
        print("\n🌐 Your app is ready:")
        print("   • Frontend: http://localhost:3000")
        print("   • Backend API: http://localhost:8001")
        print("   • API Docs: http://localhost:8001/docs")
        
        # Ask if user wants to open browser
        try:
            choice = input("\n🚀 Open frontend in browser? (y/n): ").lower()
            if choice in ['y', 'yes', 'да']:
                webbrowser.open("http://localhost:3000")
                print("🌐 Opening browser...")
        except:
            pass
            
    else:
        print("⚠️  Some services are not working properly")
        if not backend_ok:
            print("💡 Backend issues:")
            print("   - Make sure backend is running: cd backend && py -m uvicorn server_fixed:app --host 0.0.0.0 --port 8001")
        if not frontend_ok:
            print("💡 Frontend issues:")
            print("   - Make sure frontend is running: cd frontend && npm start")

if __name__ == "__main__":
    main() 