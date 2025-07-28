import { useEthereumWallet } from '../contexts/EthereumWalletProvider';
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import Irys from '@irys/sdk';

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

  const isWalletReady = signer && address;

  // Новый uploadToIrys через Irys SDK и MetaMask

  const uploadToIrys = useCallback(async (file, tags = {}) => {
    setIsUploading(true);
    try {
      if (!window.ethereum) {
        alert("MetaMask не установлен! Пожалуйста, установите MetaMask.");
        setIsUploading(false);
        return;
      }
      
      // Проверяем, что файл существует и является File или Blob
      if (!file || !(file instanceof File || file instanceof Blob)) {
        throw new Error("Invalid file format. Expected File or Blob object.");
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      
      // Попробуем разные URL для Irys (начнем с devnet для тестирования)
      const irysUrls = [
        "https://devnet.irys.xyz",
        "https://node1.irys.xyz",
        "https://node2.irys.xyz"
      ];
      
      let irys;
      let connected = false;
      
      for (const url of irysUrls) {
        try {
          console.log(`Trying to connect to Irys at: ${url}`);
          irys = new Irys({
            url: url,
            token: "ethereum",
            wallet: signer
          });
          await irys.ready();
          console.log(`Successfully connected to Irys at: ${url}`);
          
          // Проверяем баланс
          try {
            const balance = await irys.getLoadedBalance();
            console.log(`Irys balance: ${balance}`);
            if (balance <= 0) {
              console.log("Warning: Low or zero balance on Irys");
              // Не прерываем подключение, только предупреждаем
            }
          } catch (balanceError) {
            console.log("Could not check balance:", balanceError.message);
            // Не прерываем подключение при ошибке проверки баланса
          }
          
          connected = true;
          break;
        } catch (error) {
          console.log(`Failed to connect to ${url}:`, error.message);
          continue;
        }
      }
      
      if (!connected) {
        throw new Error("Failed to connect to any Irys node. Please check your internet connection and try again.");
      }
  
      // Добавляем теги к файлу
      const uploadTags = [
        { name: "Content-Type", value: file.type || "application/octet-stream" },
        { name: "application-id", value: "IrysPinter" },
        ...Object.entries(tags).map(([key, value]) => ({ name: key, value }))
      ];
  
      console.log("Uploading file to Irys:", {
        fileType: file.type,
        fileSize: file.size,
        tags: uploadTags
      });
  
      // Загружаем файл с тегами
      let receipt;
      
      // Используем правильный метод для загрузки файлов
      try {
        if (file instanceof File) {
          // Для File объектов используем uploadFile
          receipt = await irys.uploadFile(file, { tags: uploadTags });
        } else {
          // Для Blob объектов конвертируем в Buffer
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          receipt = await irys.upload(buffer, { tags: uploadTags });
        }
        
        console.log("Upload successful:", receipt);
      } catch (uploadError) {
        if (uploadError.message.includes("balance") || uploadError.message.includes("402")) {
          throw new Error("Insufficient balance on Irys. Please fund your account first.");
        }
        throw uploadError;
      }
      
      return {
        txid: receipt.id,
        url: `https://gateway.irys.xyz/${receipt.id}`
      };
    } catch (error) {
      console.error("Irys upload error:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

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

  const mintNFT = useCallback(async (metadata, imageFile) => {
    if (!isWalletReady) throw new Error('Wallet not connected');
    setIsMinting(true);
    try {
      console.log("Starting NFT minting process...");
      console.log("Image file:", imageFile);
      console.log("Metadata:", metadata);
      
      // 1. Загружаем изображение в Irys
      console.log("Step 1: Uploading image to Irys...");
      const imageUpload = await uploadToIrys(imageFile, { type: 'image' });
      console.log("Image upload result:", imageUpload);
      
      // 2. Создаем метаданные с URL изображения
      const metadataWithImage = { 
        ...metadata, 
        image: imageUpload.url 
      };
      console.log("Metadata with image URL:", metadataWithImage);
      
      // 3. Создаем Blob из метаданных JSON
      const metadataJson = JSON.stringify(metadataWithImage, null, 2);
      const metadataBlob = new Blob([metadataJson], { 
        type: 'application/json' 
      });
      console.log("Metadata blob created:", metadataBlob);
      console.log("Metadata JSON:", metadataJson);
      
      // 4. Загружаем метаданные в Irys
      console.log("Step 2: Uploading metadata to Irys...");
      const metadataUpload = await uploadToIrys(metadataBlob, { type: 'metadata' });
      console.log("Metadata upload result:", metadataUpload);
      
      // 5. Минтим NFT в смарт-контракте
      console.log("Step 3: Minting NFT on Arbitrum...");
      const contract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_ABI, signer);
      const tx = await contract.mint(metadataUpload.url);
      console.log("Transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);
      
      // 6. Получаем tokenId из события
      let tokenId = null;
      if (receipt && receipt.events) {
        const mintEvent = receipt.events.find(e => e.event === 'Minted');
        if (mintEvent && mintEvent.args && mintEvent.args.tokenId) {
          tokenId = mintEvent.args.tokenId.toString();
        }
      }
      
      const result = {
        mintAddress: tokenId || 'Minted',
        imageUrl: imageUpload.url,
        metadataUrl: metadataUpload.url,
        transactionSignature: tx.hash
      };
      
      console.log("NFT minting completed:", result);
      return result;
    } catch (error) {
      console.error('NFT minting error:', error);
      throw error;
    } finally {
      setIsMinting(false);
    }
  }, [isWalletReady, signer, uploadToIrys]);

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

  const fundIrysAccount = useCallback(async (amount) => {
    if (!isWalletReady) throw new Error('Wallet not connected');
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const irys = new Irys({
        url: "https://devnet.irys.xyz",
        token: "ethereum",
        wallet: signer,
        config: {
          providerUrl: "https://arb1.arbitrum.io/rpc"
        }
      });
      await irys.ready();
      
      const fundResult = await irys.fund(amount);
      console.log("Irys account funded:", fundResult);
      return fundResult;
    } catch (error) {
      console.error("Failed to fund Irys account:", error);
      throw error;
    }
  }, [isWalletReady]);

  return {
    uploadToIrys,
    mintNFT,
    buyNFT,
    sellNFT,
    createNFTMetadata,
    fundIrysAccount,
    isUploading,
    isMinting,
    isBuying,
    isSelling,
    isWalletReady
  };
};
