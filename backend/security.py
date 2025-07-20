"""
Security utilities for handling private keys safely
"""

import os
import base58
import logging
from typing import Optional
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger(__name__)

class SecureKeyManager:
    """Secure key manager for handling private keys"""
    
    def __init__(self, password: Optional[str] = None):
        self.password = password or os.environ.get('KEY_PASSWORD')
        self._fernet = None
        self._initialize_encryption()
    
    def _initialize_encryption(self):
        """Initialize encryption with password"""
        if not self.password:
            logger.warning("No encryption password set. Keys will be stored in plain text.")
            return
        
        try:
            # Generate key from password
            salt = b'solpinter_salt'  # In production, use random salt
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base58.b58encode(kdf.derive(self.password.encode()))
            self._fernet = Fernet(key)
        except Exception as e:
            logger.error(f"Failed to initialize encryption: {e}")
    
    def encrypt_private_key(self, private_key: str) -> str:
        """Encrypt private key"""
        if not self._fernet:
            return private_key
        
        try:
            encrypted = self._fernet.encrypt(private_key.encode())
            return base58.b58encode(encrypted).decode()
        except Exception as e:
            logger.error(f"Failed to encrypt private key: {e}")
            return private_key
    
    def decrypt_private_key(self, encrypted_key: str) -> str:
        """Decrypt private key"""
        if not self._fernet:
            return encrypted_key
        
        try:
            encrypted_bytes = base58.b58decode(encrypted_key)
            decrypted = self._fernet.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Failed to decrypt private key: {e}")
            return encrypted_key
    
    def get_secure_private_key(self) -> Optional[str]:
        """Get private key securely from environment"""
        private_key = os.environ.get('SOLANA_PRIVATE_KEY')
        if not private_key or private_key == 'your_private_key_here':
            return None
        
        return self.decrypt_private_key(private_key)
    
    def validate_private_key(self, private_key: str) -> bool:
        """Validate private key format"""
        try:
            # Check if it's a valid base58 string
            decoded = base58.b58decode(private_key)
            # Solana private keys are 64 bytes
            return len(decoded) == 64
        except Exception:
            return False

# Global instance
key_manager = SecureKeyManager()

def get_secure_private_key() -> Optional[str]:
    """Get private key securely"""
    return key_manager.get_secure_private_key()

def validate_private_key(private_key: str) -> bool:
    """Validate private key format"""
    return key_manager.validate_private_key(private_key) 