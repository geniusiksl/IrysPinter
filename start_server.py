#!/usr/bin/env python3
"""
Simple script to start the FastAPI server
"""
import uvicorn
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

if __name__ == "__main__":
    print("🚀 Starting SolPinter API server...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📊 API docs will be at: http://localhost:8000/docs")
    print("=" * 50)
    
    try:
        uvicorn.run(
            "server:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        print("💡 Make sure you're in the project root directory") 