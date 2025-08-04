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
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
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
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "listings",
    "outputs": [
      { "internalType": "address", "name": "seller", "type": "address" },
      { "internalType": "uint256", "name": "price", "type": "uint256" },
      { "internalType": "bool", "name": "active", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Адрес задеплоенного контракта MarketplaceNFT на Arbitrum
const MARKETPLACE_CONTRACT_ADDRESS = '0x218B055f2984F324fbcCd53d6ceBF6a45b51cf6B';

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
      
      // Проверяем, что файл существует и является File, Blob или Buffer
      if (!file || !(file instanceof File || file instanceof Blob || Buffer.isBuffer(file))) {
        throw new Error("Invalid file format. Expected File, Blob or Buffer object.");
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      
      // Используем mainnet Irys
      const irys = new Irys({
        url: "https://node1.irys.xyz", // Mainnet Irys
        token: "ethereum",
        wallet: signer
      });
      
      await irys.ready();
      console.log("Connected to mainnet Irys");
      
      // Проверяем баланс
      try {
        const ethBalance = await signer.getBalance();
        const ethBalanceInEth = ethers.utils.formatEther(ethBalance);
        console.log(`ETH balance in wallet: ${ethBalanceInEth} ETH`);
        console.log("Balance check passed - proceeding with transaction");
      } catch (balanceError) {
        console.log("Could not check ETH balance:", balanceError.message);
        console.log("Proceeding without balance check");
      }
  
      // Преобразуем файл в буфер для Irys
      let buffer;
      if (file instanceof File || file instanceof Blob) {
        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else if (Buffer.isBuffer(file)) {
        buffer = file;
      } else {
        throw new Error("Unsupported file type");
      }

      // Добавляем теги к файлу
      const uploadTags = [
        { name: "Content-Type", value: file.type || "application/octet-stream" },
        { name: "application-id", value: "IrysPinter" },
        ...Object.entries(tags).map(([key, value]) => ({ name: key, value }))
      ];
  
            console.log("Uploading file to Irys:", {
        fileType: file.type,
        fileSize: file instanceof File || file instanceof Blob ? file.size : buffer.length,
        tags: uploadTags
      });
      
      const upload = await irys.upload(buffer, { tags: uploadTags });
      console.log("File uploaded successfully:", upload);
  
      return {
        url: `https://gateway.irys.xyz/${upload.id}`,
        id: upload.id,
        size: upload.size
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
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
      external_url: "https://iryspinter.com",
      seller_fee_basis_points: 250,
      properties: {
        files: [
          {
            type: "image/png",
            uri: imageUrl
          }
        ],
        category: "image"
      }
    };
  }, []);

  const mintNFT = useCallback(async (metadata, imageFile) => {
    if (!isWalletReady) throw new Error('Wallet not connected');
    setIsMinting(true);
    
    try {
      console.log("Starting NFT minting process...");
      
      // 1. Загружаем изображение на Irys
      console.log("Uploading image to Irys...");
      const imageUpload = await uploadToIrys(imageFile, {
        "Content-Type": imageFile.type,
        "application-id": "IrysPinter",
        "type": "image"
      });
      console.log("Image uploaded:", imageUpload);
      
      // 2. Обновляем метаданные с URL изображения
      metadata.image = imageUpload.url;
      console.log("Updated metadata with image URL:", metadata);
      
      // 3. Загружаем метаданные на Irys
      console.log("Uploading metadata to Irys...");
      const metadataString = JSON.stringify(metadata);
      const metadataBuffer = Buffer.from(metadataString, 'utf8');
      const metadataUpload = await uploadToIrys(metadataBuffer, {
        "Content-Type": "application/json",
        "application-id": "IrysPinter",
        "type": "metadata"
      });
      console.log("Metadata uploaded:", metadataUpload);
      
      // 4. Минтим NFT на смарт-контракте
      console.log("Minting NFT on blockchain...");
      const contract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_ABI, signer);
      
      // Проверяем, что контракт доступен
      try {
        const name = await contract.name();
        const symbol = await contract.symbol();
        console.log("Contract info:", { name, symbol });
      } catch (error) {
        console.error("Contract not found or not accessible:", error);
        throw new Error("NFT contract not found. Please check if contract is deployed correctly.");
      }
      
      // Минтим NFT
      const tx = await contract.mint(metadataUpload.url);
      console.log("Transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);
      
      // Получаем tokenId из событий
      let tokenId = null;
      if (receipt && receipt.events) {
        console.log("All events:", receipt.events);
        const mintEvent = receipt.events.find(e => e.event === 'Minted');
        console.log("Mint event found:", mintEvent);
        if (mintEvent && mintEvent.args) {
          console.log("Mint event args:", mintEvent.args);
          // В событии Minted tokenId находится во втором параметре (args[1])
          if (mintEvent.args[1] !== undefined) {
            tokenId = mintEvent.args[1].toString();
            console.log("Token ID from event args[1]:", tokenId);
          }
        }
      }
      
      // Проверяем, что получили реальный tokenId
      if (!tokenId || tokenId === '0' || tokenId === 'null' || tokenId === 'undefined') {
        throw new Error("Failed to get valid token ID from transaction");
      }
      
      console.log("Final token ID:", tokenId);
      
      // Автоматически выставляем NFT на продажу, если указана цена
      let listingSuccess = false;
      if (metadata.price && parseFloat(metadata.price) > 0) {
        try {
          console.log(`Auto-listing NFT ${tokenId} for ${metadata.price} ETH`);
          
          const listTx = await contract.list(tokenId, ethers.utils.parseEther(metadata.price.toString()));
          const listReceipt = await listTx.wait();
          console.log("Auto-listing transaction confirmed:", listReceipt);
          listingSuccess = true;
        } catch (listError) {
          console.error("Auto-listing failed:", listError);
          console.log("NFT will be created without listing for sale");
        }
      }
      
      const result = {
        mintAddress: tokenId,
        imageUrl: imageUpload.url,
        metadataUrl: metadataUpload.url,
        transactionSignature: tx.hash,
        listingFailed: !listingSuccess && metadata.price > 0
      };
      
      console.log("NFT minting completed:", result);
      return result;
    } catch (error) {
      console.error('NFT minting error:', error);
      
      // Обрабатываем ошибку недостатка средств
      if (error.data && error.data.message && error.data.message.includes('insufficient funds')) {
        throw new Error('Insufficient ETH balance. Please add more ETH to your wallet to mint this NFT.');
      }
      
      // Обрабатываем другие ошибки
      if (error.message && error.message.includes('Contract not found')) {
        throw new Error('NFT contract not found. Please check if contract is deployed correctly.');
      }
      
      // Общая ошибка
      throw new Error('Failed to mint NFT. Please check your wallet balance and try again.');
    } finally {
      setIsMinting(false);
    }
  }, [isWalletReady, signer, uploadToIrys]);

  const checkNFTListing = useCallback(async (tokenId) => {
    if (!isWalletReady) throw new Error('Wallet not connected');
    try {
      const contract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_ABI, signer);
      
      // Проверяем листинг NFT в смарт-контракте через listings mapping
      const listing = await contract.listings(tokenId);
      const isListed = listing.active;
      const price = listing.price;
      
      return {
        isListed,
        price: isListed ? ethers.utils.formatEther(price) : '0'
      };
    } catch (error) {
      console.error('Error checking NFT listing:', error);
      return { isListed: false, price: '0' };
    }
  }, [isWalletReady, signer]);

  const buyNFT = useCallback(async (tokenId, price) => {
    if (!isWalletReady) throw new Error('Wallet not connected');
    setIsBuying(true);
    try {
      const contract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_ABI, signer);
      
      console.log(`Attempting to buy NFT with tokenId: ${tokenId}, price: ${price} ETH`);
      
      // Сначала проверяем, действительно ли NFT выставлен на продажу
      const listingStatus = await checkNFTListing(tokenId);
      if (!listingStatus.isListed) {
        throw new Error('This NFT is not listed for sale on the blockchain. The owner needs to list it first.');
      }
      
      // Проверяем, что цена соответствует
      if (Math.abs(parseFloat(listingStatus.price) - parseFloat(price)) > 0.000001) {
        throw new Error(`Price mismatch. NFT is listed for ${listingStatus.price} ETH, but you're trying to buy for ${price} ETH`);
      }
      
      // Проверяем, есть ли у пользователя достаточно ETH
      const balance = await signer.getBalance();
      const requiredAmount = ethers.utils.parseEther(price.toString());
      const gasEstimate = await contract.estimateGas.buy(tokenId, { value: requiredAmount });
      const gasPrice = await signer.provider.getGasPrice();
      const totalCost = requiredAmount.add(gasEstimate.mul(gasPrice));
      
      if (balance.lt(totalCost)) {
        throw new Error(`Insufficient ETH balance. Required: ${ethers.utils.formatEther(totalCost)} ETH, Available: ${ethers.utils.formatEther(balance)} ETH`);
      }
      
      const tx = await contract.buy(tokenId, { value: requiredAmount });
      console.log("Buy transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Buy transaction confirmed:", receipt);
      
      return {
        success: true,
        transactionHash: tx.hash,
        tokenId: tokenId
      };
    } catch (error) {
      console.error('Buy NFT error:', error);
      throw new Error(`Failed to buy NFT: ${error.message}`);
    } finally {
      setIsBuying(false);
    }
  }, [isWalletReady, signer, checkNFTListing]);

  const listNFT = useCallback(async (tokenId, price) => {
    if (!isWalletReady) throw new Error('Wallet not connected');
    setIsSelling(true);
    try {
      const contract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_ABI, signer);
      
      console.log(`Listing NFT ${tokenId} for ${price} ETH`);
      
      const tx = await contract.list(tokenId, ethers.utils.parseEther(price.toString()));
      console.log("List transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("List transaction confirmed:", receipt);
      
      return {
        success: true,
        transactionHash: tx.hash,
        tokenId: tokenId,
        price: price
      };
    } catch (error) {
      console.error('List NFT error:', error);
      throw new Error(`Failed to list NFT: ${error.message}`);
    } finally {
      setIsSelling(false);
    }
  }, [isWalletReady, signer]);

  const delistNFT = useCallback(async (tokenId) => {
    if (!isWalletReady) throw new Error('Wallet not connected');
    setIsSelling(true);
    try {
      const contract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_CONTRACT_ABI, signer);
      
      console.log(`Delisting NFT ${tokenId}`);
      
      const tx = await contract.delist(tokenId);
      console.log("Delist transaction sent:", tx.hash);
      
      const receipt = await tx.wait();
      console.log("Delist transaction confirmed:", receipt);
      
      return {
        success: true,
        transactionHash: tx.hash,
        tokenId: tokenId
      };
    } catch (error) {
      console.error('Delist NFT error:', error);
      throw new Error(`Failed to delist NFT: ${error.message}`);
    } finally {
      setIsSelling(false);
    }
  }, [isWalletReady, signer]);

  return {
    uploadToIrys,
    createNFTMetadata,
    mintNFT,
    buyNFT,
    listNFT,
    delistNFT,
    checkNFTListing,
    isUploading,
    isMinting,
    isBuying,
    isSelling
  };
};
