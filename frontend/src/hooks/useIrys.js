import { useEthereumWallet } from '../contexts/EthereumWalletProvider';
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';

// Функция для создания Irys instance с кошельком
function getIrysWithWallet() {
  if (typeof window.ethereum === "undefined") {
    throw new Error("No EVM wallet found. Please install MetaMask and make it the active wallet.");
  }
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  
  // Динамический импорт Irys SDK
  const Irys = require('@irys/sdk').default || require('@irys/sdk');
  
  return new Irys({
    url: "https://node1.irys.xyz",
    token: "ethereum",
    wallet: signer
  });
}

export const useIrys = () => {
  const { signer, address } = useEthereumWallet();
  const [isUploading, setIsUploading] = useState(false);

  const isWalletReady = signer && address;

  // Get Irys uploader instance
  const getIrysUploader = useCallback(async () => {
    try {
      console.log('🔗 Connecting to Irys...');
      
      // Создаем Irys instance
      const irys = getIrysWithWallet();
      await irys.ready();
      
      console.log('✅ Irys connection established:', {
        address: irys.address,
        token: irys.token,
        api: irys.api
      });
      
      return irys;
    } catch (error) {
      console.error('Error creating Irys uploader:', error);
      throw error;
    }
  }, []);

  // Removed balance checking and funding functions to avoid constructor errors

   // Upload to Irys
   const uploadToIrys = useCallback(async (file, tags = {}) => {
     setIsUploading(true);
     try {
       if (!file || !(file instanceof File || file instanceof Blob)) {
         throw new Error("Invalid file format. Expected File or Blob object.");
       }
       
       const irys = await getIrysUploader();
 
       // Преобразуем файл в Buffer для Irys
       const arrayBuffer = await file.arrayBuffer();
       const buffer = Buffer.from(arrayBuffer);
 
       // Подготавливаем теги для загрузки
       const uploadTags = [
         { name: "Content-Type", value: file.type || "application/octet-stream" },
         { name: "app", value: "IrysPinter" },
         { name: "app-id", value: "irys-pinter" },
         { name: "type", value: "image" },
         { name: "timestamp", value: Date.now().toString() },
         { name: "version", value: "1.0" },
         ...Object.entries(tags).map(([key, value]) => ({ name: key, value }))
       ];
   
       console.log("📤 Uploading file to Irys:", {
         fileType: file.type,
         fileSize: file.size,
         bufferSize: buffer.length,
         tags: uploadTags.map(tag => `${tag.name}=${tag.value}`).join(', ')
       });
       
       const receipt = await irys.upload(buffer, { tags: uploadTags });
       console.log("✅ File uploaded successfully:", {
         transactionId: receipt.id,
         dataSize: buffer.length,
         irysUrl: `https://gateway.irys.xyz/${receipt.id}`
       });
   
       return {
         url: `https://gateway.irys.xyz/${receipt.id}`,
         id: receipt.id,
         size: receipt.size || buffer.length
       };
    } catch (error) {
       console.error('❌ Upload error:', error);
       throw new Error(`Failed to upload file: ${error.message}`);
     } finally {
       setIsUploading(false);
     }
    }, [getIrysUploader]);
 
   return {
     uploadToIrys,
     isUploading,
     isWalletReady
   };
 };
