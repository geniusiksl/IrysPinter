#!/usr/bin/env python3
"""
Check if both backend and frontend are running
"""
import requests
import time
import webbrowser

def check_backend():
    try:
        response = requests.get("http://localhost:8000/api", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running at http://localhost:8000")
            return True
    except:
        pass
    print("❌ Backend is not running")
    return False

def check_frontend():
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is running at http://localhost:3000")
            return True
    except:
        pass
    print("❌ Frontend is not running")
    return False

def main():
    print("🔍 Checking SolPinter application...")
    print("=" * 50)
    
    backend_ok = check_backend()
    frontend_ok = check_frontend()
    
    print("\n" + "=" * 50)
    
    if backend_ok and frontend_ok:
        print("🎉 Everything is working!")
        print("\n🌐 Your SolPinter app is ready:")
        print("   • Frontend: http://localhost:3000")
        print("   • Backend API: http://localhost:8000")
        print("   • API Docs: http://localhost:8000/docs")
        
        # Ask if user wants to open browser
        try:
            choice = input("\n🚀 Open frontend in browser? (y/n): ").lower()
            if choice in ['y', 'yes', 'да']:
                webbrowser.open("http://localhost:3000")
                print("🌐 Opening browser...")
        except:
            pass
            
    else:
        print("⚠️  Some services are not running")
        if not backend_ok:
            print("💡 To start backend: py start_server.py")
        if not frontend_ok:
            print("💡 To start frontend: cd frontend && npm start")

if __name__ == "__main__":
    main() 