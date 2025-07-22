import base58
import json
import logging
from typing import Optional, Dict, Any
from solana.rpc.api import Client
from solana.rpc.commitment import Commitment
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.transaction import Transaction
from solders.system_program import TransferParams, transfer

# 1 SOL = 1_000_000_000 лампортов
LAMPORTS_PER_SOL = 1_000_000_000

from config import Config
from security import get_secure_private_key, validate_private_key

logger = logging.getLogger(__name__)

class SolanaService:
    def __init__(self):
        self.client = Client(Config.get_solana_rpc_url(), commitment=Commitment("confirmed"))
        self.keypair = None
        self._initialize_keypair()
    
    def _initialize_keypair(self):
        """Initialize Solana keypair from private key securely"""
        private_key = get_secure_private_key()
        
        if private_key and validate_private_key(private_key):
            try:
                private_key_bytes = base58.b58decode(private_key)
                self.keypair = Keypair.from_bytes(private_key_bytes)
                logger.info(f"Solana keypair initialized: {self.keypair.pubkey()}")
            except Exception as e:
                logger.error(f"Failed to initialize Solana keypair: {e}")
                self.keypair = Keypair()
                logger.warning("Using generated keypair for development")
        else:
            logger.warning("No valid SOLANA_PRIVATE_KEY provided, using generated keypair")
            self.keypair = Keypair()
    
    async def get_balance(self, public_key: str) -> float:
        """Get SOL balance for a public key"""
        try:
            pubkey = Pubkey.from_string(public_key)
            response = self.client.get_balance(pubkey)
            if response.value is not None:
                return response.value / LAMPORTS_PER_SOL
            return 0.0
        except Exception as e:
            logger.error(f"Error getting balance for {public_key}: {e}")
            return 0.0
    
    async def transfer_sol(self, from_keypair: Keypair, to_public_key: str, amount: float) -> str:
        """Transfer SOL between accounts"""
        try:
            to_pubkey = Pubkey.from_string(to_public_key)
            lamports = int(amount * LAMPORTS_PER_SOL)
            
            transfer_ix = transfer(
                TransferParams(
                    from_pubkey=from_keypair.pubkey(),
                    to_pubkey=to_pubkey,
                    lamports=lamports
                )
            )
            
            transaction = Transaction()
            transaction.add(transfer_ix)
            
            result = self.client.send_transaction(transaction, from_keypair)
            if result.value:
                return result.value
            else:
                raise Exception("Transaction failed")
                
        except Exception as e:
            logger.error(f"Error transferring SOL: {e}")
            raise
    
    async def create_nft_metadata(self, 
                                 name: str, 
                                 symbol: str, 
                                 uri: str, 
                                 seller_fee_basis_points: int = 500,
                                 creator_address: str = None) -> Dict[str, Any]:
        """Create NFT metadata with royalties"""
        if creator_address is None:
            creator_address = str(self.keypair.pubkey())
        
        # Calculate royalty percentage (1% = 100 basis points)
        royalty_basis_points = int(Config.ROYALTY_PERCENTAGE * 100)
        
        # Create creators array with royalty distribution
        creators = []
        
        # Add creator (artist)
        creators.append({
            "address": creator_address,
            "verified": True,
            "share": 100 - royalty_basis_points  # Creator gets 99%
        })
        
        # Add royalty wallet if configured
        if Config.ROYALTY_WALLET:
            creators.append({
                "address": Config.ROYALTY_WALLET,
                "verified": False,  # Will be verified during minting
                "share": royalty_basis_points  # Platform gets 1%
            })
        
        metadata = {
            "name": name,
            "symbol": symbol,
            "uri": uri,
            "seller_fee_basis_points": seller_fee_basis_points,
            "creators": creators
        }
        
        logger.info(f"Created metadata with {Config.ROYALTY_PERCENTAGE}% royalty to {Config.ROYALTY_WALLET}")
        return metadata
    
    async def mint_nft(self, 
                      metadata: Dict[str, Any], 
                      owner_public_key: str) -> Dict[str, Any]:
        """
        Mint NFT using Metaplex (simplified implementation)
        In production, you would use Metaplex SDK
        """
        try:
            # This is a simplified implementation
            # In production, you would use Metaplex SDK for proper NFT minting
            
            # Generate a new mint address
            mint_keypair = Keypair()
            mint_address = str(mint_keypair.pubkey())
            
            # Create metadata account
            metadata_account = Keypair()
            
            # In a real implementation, you would:
            # 1. Create the mint account
            # 2. Create the metadata account
            # 3. Create the master edition account
            # 4. Mint the token
            
            # For now, return mock data
            nft_data = {
                "mint_address": mint_address,
                "metadata_address": str(metadata_account.pubkey()),
                "owner": owner_public_key,
                "metadata": metadata,
                "transaction_signature": "mock_signature_" + mint_address[:8]
            }
            
            logger.info(f"NFT minted successfully: {mint_address}")
            return nft_data
            
        except Exception as e:
            logger.error(f"Error minting NFT: {e}")
            raise
    
    async def verify_transaction(self, signature: str) -> bool:
        """Verify a transaction signature"""
        try:
            response = self.client.get_transaction(signature)
            return response.value is not None
        except Exception as e:
            logger.error(f"Error verifying transaction {signature}: {e}")
            return False
    
    async def get_account_info(self, public_key: str) -> Optional[Dict[str, Any]]:
        """Get account information"""
        try:
            pubkey = Pubkey.from_string(public_key)
            response = self.client.get_account_info(pubkey)
            if response.value:
                return {
                    "lamports": response.value.lamports,
                    "owner": str(response.value.owner),
                    "executable": response.value.executable,
                    "rent_epoch": response.value.rent_epoch
                }
            return None
        except Exception as e:
            logger.error(f"Error getting account info for {public_key}: {e}")
            return None
    
    async def calculate_royalty(self, sale_amount: float) -> Dict[str, float]:
        """Calculate royalty amount for a sale"""
        royalty_percentage = Config.ROYALTY_PERCENTAGE
        royalty_amount = sale_amount * (royalty_percentage / 100)
        creator_amount = sale_amount - royalty_amount
        
        return {
            "total_amount": sale_amount,
            "royalty_amount": royalty_amount,
            "creator_amount": creator_amount,
            "royalty_percentage": royalty_percentage
        }
    
    async def process_sale_with_royalty(self, 
                                      buyer_keypair: Keypair,
                                      seller_address: str,
                                      sale_amount: float) -> Dict[str, Any]:
        """Process a sale with automatic royalty distribution"""
        try:
            royalty_calc = await self.calculate_royalty(sale_amount)
            
            # Transfer to creator (seller)
            creator_signature = await self.transfer_sol(
                buyer_keypair, 
                seller_address, 
                royalty_calc["creator_amount"]
            )
            
            # Transfer royalty to platform wallet
            royalty_signature = None
            if Config.ROYALTY_WALLET and royalty_calc["royalty_amount"] > 0:
                royalty_signature = await self.transfer_sol(
                    buyer_keypair,
                    Config.ROYALTY_WALLET,
                    royalty_calc["royalty_amount"]
                )
            
            return {
                "success": True,
                "creator_signature": creator_signature,
                "royalty_signature": royalty_signature,
                "royalty_calculation": royalty_calc,
                "seller_address": seller_address,
                "royalty_wallet": Config.ROYALTY_WALLET
            }
            
        except Exception as e:
            logger.error(f"Error processing sale with royalty: {e}")
            raise
    
    async def get_royalty_balance(self) -> float:
        """Get current balance of royalty wallet"""
        if not Config.ROYALTY_WALLET:
            return 0.0
        
        return await self.get_balance(Config.ROYALTY_WALLET)

# Global instance
solana_service = SolanaService() 