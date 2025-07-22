import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

class Config:
    # MongoDB Configuration
    MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    DB_NAME = os.environ.get('DB_NAME', 'solpinter')
    
    # Solana Configuration
    SOLANA_RPC_URL = os.environ.get('SOLANA_RPC_URL', 'https://api.mainnet-beta.solana.com')
    SOLANA_DEVNET_RPC_URL = os.environ.get('SOLANA_DEVNET_RPC_URL', 'https://api.devnet.solana.com')
    SOLANA_PRIVATE_KEY = os.environ.get('SOLANA_PRIVATE_KEY')
    SOLANA_NETWORK = os.environ.get('SOLANA_NETWORK', 'mainnet-beta')
    
    # Metaplex Configuration
    METAPLEX_AUTHORITY = os.environ.get('METAPLEX_AUTHORITY')
    METAPLEX_CREATOR_ADDRESS = os.environ.get('METAPLEX_CREATOR_ADDRESS')
    
    # Royalty Configuration
    ROYALTY_PERCENTAGE = float(os.environ.get('ROYALTY_PERCENTAGE', '1.0'))  # 1% default
    ROYALTY_WALLET = os.environ.get('ROYALTY_WALLET')  # Your wallet for collecting royalties
    
    # Irys Configuration
    IRYS_NETWORK = os.environ.get('IRYS_NETWORK', 'mainnet')
    IRYS_TOKEN = os.environ.get('IRYS_TOKEN', 'SOL')
    IRYS_RPC_URL = os.environ.get('IRYS_RPC_URL', 'https://api.mainnet-beta.solana.com')
    
    # Application Configuration
    BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:8000')
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    
    # Development mode
    DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    @classmethod
    def get_solana_rpc_url(cls):
        """Get Solana RPC URL based on network"""
        if cls.SOLANA_NETWORK == 'devnet':
            return cls.SOLANA_DEVNET_RPC_URL
        return cls.SOLANA_RPC_URL
    
    @classmethod
    def is_devnet(cls):
        """Check if using devnet"""
        return cls.SOLANA_NETWORK == 'devnet' 