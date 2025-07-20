import base58
import json
import logging
import aiofiles
import aiohttp
from typing import Optional, Dict, Any, BinaryIO
from pathlib import Path
import tempfile
import os

from config import Config

logger = logging.getLogger(__name__)

class IrysService:
    def __init__(self):
        self.network = Config.IRYS_NETWORK
        self.token = Config.IRYS_TOKEN
        self.rpc_url = Config.IRYS_RPC_URL
        self.base_url = self._get_base_url()
        
    def _get_base_url(self) -> str:
        """Get Irys base URL based on network"""
        if self.network == "devnet":
            return "https://devnet.irys.xyz"
        return "https://node1.irys.xyz"
    
    async def get_upload_receipt(self, transaction_id: str) -> Optional[Dict[str, Any]]:
        """Get upload receipt from Irys"""
        try:
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/tx/{transaction_id}/receipt"
                async with session.get(url) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        logger.error(f"Failed to get receipt: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Error getting upload receipt: {e}")
            return None
    
    async def upload_file(self, 
                         file_data: bytes, 
                         content_type: str = "image/jpeg",
                         tags: Optional[Dict[str, str]] = None) -> Optional[str]:
        """
        Upload file to Irys using HTTP API
        This is a simplified implementation using Irys HTTP API
        """
        try:
            # Prepare tags
            if tags is None:
                tags = {}
            
            # Add content type tag
            tags["Content-Type"] = content_type
            tags["application-id"] = "SolPinter"
            
            # Create upload payload
            payload = {
                "data": base58.b58encode(file_data).decode('utf-8'),
                "tags": [{"name": k, "value": v} for k, v in tags.items()]
            }
            
            # Upload to Irys
            async with aiohttp.ClientSession() as session:
                url = f"{self.base_url}/tx"
                headers = {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
                
                async with session.post(url, json=payload, headers=headers) as response:
                    if response.status == 200:
                        result = await response.json()
                        transaction_id = result.get("id")
                        logger.info(f"File uploaded to Irys: {transaction_id}")
                        return transaction_id
                    else:
                        error_text = await response.text()
                        logger.error(f"Upload failed: {response.status} - {error_text}")
                        return None
                        
        except Exception as e:
            logger.error(f"Error uploading file to Irys: {e}")
            return None
    
    async def upload_metadata(self, 
                            metadata: Dict[str, Any],
                            tags: Optional[Dict[str, str]] = None) -> Optional[str]:
        """Upload metadata JSON to Irys"""
        try:
            metadata_json = json.dumps(metadata, separators=(',', ':'))
            metadata_bytes = metadata_json.encode('utf-8')
            
            if tags is None:
                tags = {}
            
            tags["Content-Type"] = "application/json"
            tags["application-id"] = "SolPinter"
            tags["type"] = "metadata"
            
            return await self.upload_file(metadata_bytes, "application/json", tags)
            
        except Exception as e:
            logger.error(f"Error uploading metadata to Irys: {e}")
            return None
    
    async def get_file_url(self, transaction_id: str) -> str:
        """Get file URL from Irys gateway"""
        return f"https://gateway.irys.xyz/{transaction_id}"
    
    async def download_file(self, transaction_id: str) -> Optional[bytes]:
        """Download file from Irys"""
        try:
            url = await self.get_file_url(transaction_id)
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        return await response.read()
                    else:
                        logger.error(f"Failed to download file: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Error downloading file from Irys: {e}")
            return None
    
    async def upload_image_with_metadata(self, 
                                       image_data: bytes,
                                       title: str,
                                       description: str,
                                       owner: str,
                                       price: Optional[float] = None) -> Dict[str, Any]:
        """
        Upload image and create metadata for NFT
        """
        try:
            # Upload image
            image_tags = {
                "Content-Type": "image/jpeg",
                "application-id": "SolPinter",
                "type": "image",
                "title": title,
                "owner": owner
            }
            
            image_txid = await self.upload_file(image_data, "image/jpeg", image_tags)
            if not image_txid:
                raise Exception("Failed to upload image")
            
            # Create metadata
            metadata = {
                "name": title,
                "symbol": "SOLPIN",
                "description": description,
                "image": await self.get_file_url(image_txid),
                "attributes": [
                    {
                        "trait_type": "Owner",
                        "value": owner
                    },
                    {
                        "trait_type": "Platform",
                        "value": "SolPinter"
                    }
                ],
                "properties": {
                    "files": [
                        {
                            "type": "image/jpeg",
                            "uri": await self.get_file_url(image_txid)
                        }
                    ],
                    "category": "image"
                }
            }
            
            if price:
                metadata["attributes"].append({
                    "trait_type": "Price",
                    "value": f"{price} SOL"
                })
            
            # Upload metadata
            metadata_txid = await self.upload_metadata(metadata)
            if not metadata_txid:
                raise Exception("Failed to upload metadata")
            
            return {
                "image_txid": image_txid,
                "metadata_txid": metadata_txid,
                "image_url": await self.get_file_url(image_txid),
                "metadata_url": await self.get_file_url(metadata_txid),
                "metadata": metadata
            }
            
        except Exception as e:
            logger.error(f"Error uploading image with metadata: {e}")
            raise
    
    async def verify_upload(self, transaction_id: str) -> bool:
        """Verify that upload exists on Irys"""
        try:
            receipt = await self.get_upload_receipt(transaction_id)
            return receipt is not None
        except Exception as e:
            logger.error(f"Error verifying upload: {e}")
            return False
    
    async def get_upload_info(self, transaction_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about an upload"""
        try:
            receipt = await self.get_upload_receipt(transaction_id)
            if receipt:
                return {
                    "transaction_id": transaction_id,
                    "receipt": receipt,
                    "url": await self.get_file_url(transaction_id)
                }
            return None
        except Exception as e:
            logger.error(f"Error getting upload info: {e}")
            return None

# Global instance
irys_service = IrysService() 