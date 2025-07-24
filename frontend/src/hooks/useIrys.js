// useIrys.js
// Заглушка для реализации на Ethereum/Arbitrum через ethers.js
import { useEthereumWallet } from '../contexts/EthereumWalletProvider';
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

// MarketplaceNFT ABI (полный ABI из задеплоенного контракта)
const MARKETPLACE_CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_feeRecipient", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "approved", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "operator", "type": "address" },
      { "indexed": false, "internalType": "bool", "name": "approved", "type": "bool" }
    ],
    "name": "ApprovalForAll",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "seller", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "Delisted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "tokenURI", "type": "string" }
    ],
    "name": "Minted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "buyer", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "seller", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "price", "type": "uint256" }
    ],
    "name": "Sold",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "buy",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "delist",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "getApproved",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "operator", "type": "address" }
    ],
    "name": "isApprovedForAll",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "uint256", "name": "price", "type": "uint256" }
    ],
    "name": "list",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "tokenURI", "type": "string" }
    ],
    "name": "mint",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextTokenId",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "ownerOf",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "from", "type": "address" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "from", "type": "address" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "bytes", "name": "data", "type": "bytes" }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_feeBasisPoints", "type": "uint256" }
    ],
    "name": "setFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_recipient", "type": "address" }
    ],
    "name": "setFeeRecipient",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "operator", "type": "address" },
      { "internalType": "bool", "name": "approved", "type": "bool" }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "bytes4", "name": "interfaceId", "type": "bytes4" }
    ],
    "name": "supportsInterface",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "tokenURI",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "from", "type": "address" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "newOwner", "type": "address" }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Адрес задеплоенного контракта MarketplaceNFT на Arbitrum
const MARKETPLACE_CONTRACT_ADDRESS = '0xd8b934580fcE35a11B58C6D73aDeE468a2833fa8';

export const useIrys = () => {
  const { signer, address } = useEthereumWallet();
  const [isUploading, setIsUploading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isSelling, setIsSelling] = useState(false);

  // Проверяем, что signer и address доступны
  const isWalletReady = signer && address;

  // Загрузка файла на Irys (Arweave)
  const uploadToIrys = useCallback(async (file, tags = {}) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      Object.entries(tags).forEach(([key, value]) => {
        formData.append(`tag_${key}`, value);
      });
      const response = await axios.post('http://localhost:8001/api/irys/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return {
        transactionId: response.data.id,
        url: response.data.url
      };
    } catch (error) {
      console.error('Irys upload error:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  // Формирование метаданных для NFT
  const createNFTMetadata = useCallback((name, symbol, description, imageUrl, attributes = []) => {
    return {
      name,
      symbol,
      description,
      image: imageUrl,
      attributes,
      properties: {
        files: [
          {
            type: 'image/png',
            uri: imageUrl
          }
        ],
        category: 'image'
      }
    };
  }, []);

  // Минтинг NFT через контракт (оплачивает пользователь)
  const mintNFT = useCallback(async (metadata, imageFile) => {
    if (!isWalletReady) throw new Error('Wallet not connected');
    setIsMinting(true);
    try {
      // 1. Загрузка изображения на Irys
      const imageUpload = await uploadToIrys(imageFile, { type: 'image' });
      // 2. Загрузка метаданных на Irys
      const metadataWithImage = { ...metadata, image: imageUpload.url };
      const metadataBlob = new Blob([JSON.stringify(metadataWithImage)], { type: 'application/json' });
      const metadataUpload = await uploadToIrys(metadataBlob, { type: 'metadata' });
      // 3. Минтинг NFT через контракт
      const contract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_ABI, signer);
      const tx = await contract.mint(metadataUpload.url);
      const receipt = await tx.wait();
      // Получение minted tokenId (если контракт возвращает)
      let tokenId = null;
      if (receipt && receipt.events) {
        const mintEvent = receipt.events.find(e => e.event === 'Minted');
        if (mintEvent && mintEvent.args && mintEvent.args.tokenId) {
          tokenId = mintEvent.args.tokenId.toString();
        }
      }
      return {
        mintAddress: tokenId || 'Minted',
        imageUrl: imageUpload.url,
        metadataUrl: metadataUpload.url,
        transactionSignature: tx.hash
      };
    } catch (error) {
      console.error('NFT minting error:', error);
      throw error;
    } finally {
      setIsMinting(false);
    }
  }, [isWalletReady, signer, uploadToIrys]);

  // Покупка NFT через контракт (оплачивает пользователь)
  const buyNFT = useCallback(async (tokenId, price) => {
    if (!isWalletReady) throw new Error('Wallet not connected');
    setIsBuying(true);
    try {
      const contract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_ABI, signer);
      const tx = await contract.buy(tokenId, { value: ethers.utils.parseEther(price.toString()) });
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('NFT buy error:', error);
      throw error;
    } finally {
      setIsBuying(false);
    }
  }, [isWalletReady, signer]);

  // Выставление NFT на продажу через контракт (оплачивает пользователь)
  const sellNFT = useCallback(async (tokenId, price) => {
    if (!isWalletReady) throw new Error('Wallet not connected');
    setIsSelling(true);
    try {
      const contract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_ABI, signer);
      const tx = await contract.list(tokenId, ethers.utils.parseEther(price.toString()));
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('NFT sell error:', error);
      throw error;
    } finally {
      setIsSelling(false);
    }
  }, [isWalletReady, signer]);

  return {
    uploadToIrys,
    mintNFT,
    buyNFT,
    sellNFT,
    createNFTMetadata,
    isUploading,
    isMinting,
    isBuying,
    isSelling,
    isWalletReady
  };
}; 