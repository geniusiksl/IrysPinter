#!/usr/bin/env python3
"""
Script to create .env file for SolPinter
"""

import os
from pathlib import Path

def create_env_file():
    """Create .env file with configuration"""
    
    # Get user input
    print("🔧 SolPinter Environment Setup")
    print("=" * 40)
    
    # Solana network
    network = input("Use devnet (d) or mainnet (m)? [d]: ").lower() or 'd'
    solana_network = "devnet" if network == 'd' else "mainnet-beta"
    
    # RPC URLs
    if solana_network == "devnet":
        rpc_url = "https://api.devnet.solana.com"
    else:
        rpc_url = "https://api.mainnet-beta.solana.com"
    
    # Royalty wallet
    royalty_wallet = input("Enter your royalty wallet address (or press Enter to skip): ").strip()
    if not royalty_wallet:
        royalty_wallet = "your_wallet_address_here"
    
    # Private key (optional)
    private_key = input("Enter your private key (or press Enter to skip): ").strip()
    if not private_key:
        private_key = "your_private_key_here"
    
    # Create .env content
    env_content = f"""# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=solpinter

# Solana Configuration
SOLANA_RPC_URL={rpc_url}
SOLANA_DEVNET_RPC_URL=https://api.devnet.solana.com
SOLANA_PRIVATE_KEY={private_key}
SOLANA_NETWORK={solana_network}

# Royalty Configuration
ROYALTY_PERCENTAGE=1.0
ROYALTY_WALLET={royalty_wallet}

# Irys Configuration
IRYS_NETWORK=devnet
IRYS_TOKEN=SOL
IRYS_RPC_URL={rpc_url}

# Application Configuration
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
DEBUG=True
"""
    
    # Create backend directory if it doesn't exist
    backend_dir = Path("backend")
    backend_dir.mkdir(exist_ok=True)
    
    # Write .env file
    env_file = backend_dir / ".env"
    with open(env_file, 'w') as f:
        f.write(env_content)
    
    print(f"\n✅ Created {env_file}")
    print(f"📝 Network: {solana_network}")
    print(f"💰 Royalty Wallet: {royalty_wallet}")
    
    if private_key == "your_private_key_here":
        print("⚠️  Remember to add your real private key later!")
    
    print("\n🚀 Next steps:")
    print("1. Review the .env file")
    print("2. Add your real private key if needed")
    print("3. Run: python test_royalty_system.py")

if __name__ == "__main__":
    create_env_file() 