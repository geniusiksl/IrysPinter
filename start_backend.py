#!/usr/bin/env python3
"""
Script to start the SolPinter backend server
"""
import os
import sys
import subprocess
from pathlib import Path

def main():
    # Change to backend directory
    backend_dir = Path(__file__).parent / "backend"
    os.chdir(backend_dir)
    
    print("🚀 Starting SolPinter Backend Server...")
    print(f"📁 Working directory: {os.getcwd()}")
    
    # Check if requirements are installed
    try:
        import fastapi
        import motor
        import pydantic
        print("✅ All required packages are installed")
    except ImportError as e:
        print(f"❌ Missing package: {e}")
        print("Please install requirements: pip install -r requirements.txt")
        return
    
    # Start the server
    try:
        print("🌐 Starting server on http://localhost:8000")
        print("📊 API docs available at http://localhost:8000/docs")
        print("🔄 Press Ctrl+C to stop the server")
        print("-" * 50)
        
        # Run the server
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "server:app", 
            "--host", "0.0.0.0", 
            "--port", "8000",
            "--reload"
        ])
        
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    main() 