import { useEthereumWallet } from '../contexts/EthereumWalletProvider';
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { Uploader } from '@irys/upload';
import { Ethereum } from '@irys/upload-ethereum';

export const useIrys = () => {
  const { signer, address } = useEthereumWallet();
  const [isUploading, setIsUploading] = useState(false);

  const isWalletReady = signer && address;

  // Get Irys uploader instance
  const getIrysUploader = useCallback(async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask не установлен! Пожалуйста, установите MetaMask.");
      }
      
      let provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      let signer = provider.getSigner();
      
      // Проверяем текущую сеть
      let network = await provider.getNetwork();
      console.log("Current network:", network);
      
      // Irys требует Ethereum Mainnet (chainId: 1)
      if (network.chainId !== 1) {
        try {
          console.log("Switching to Ethereum Mainnet...");
          // Пытаемся переключиться на Ethereum Mainnet
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x1' }], // 0x1 = Ethereum Mainnet
          });
          console.log("Switched to Ethereum Mainnet");
          
          // Обновляем provider и signer после переключения сети
          provider = new ethers.providers.Web3Provider(window.ethereum);
          await provider.send("eth_requestAccounts", []);
          signer = provider.getSigner();
          network = await provider.getNetwork();
          console.log("Updated network after switching:", network);
        } catch (switchError) {
          console.log("Switch error:", switchError);
          if (switchError.code === 4902) {
            // Сеть не добавлена в MetaMask, добавляем её
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x1',
                  chainName: 'Ethereum Mainnet',
                  nativeCurrency: {
                    name: 'Ether',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://mainnet.infura.io/v3/'],
                  blockExplorerUrls: ['https://etherscan.io/']
                }]
              });
              console.log("Added Ethereum Mainnet to MetaMask");
              
              // Обновляем provider и signer после добавления сети
              provider = new ethers.providers.Web3Provider(window.ethereum);
              await provider.send("eth_requestAccounts", []);
              signer = provider.getSigner();
              network = await provider.getNetwork();
              console.log("Updated network after adding:", network);
            } catch (addError) {
              console.log("Add error:", addError);
              throw new Error("Please switch to Ethereum Mainnet in MetaMask. Irys requires ETH on Ethereum Mainnet.");
            }
          } else {
            throw new Error("Please switch to Ethereum Mainnet in MetaMask. Irys requires ETH on Ethereum Mainnet.");
          }
        }
      }
      
      // Создаем Irys uploader с новым API
      // Для MetaMask signer нужно использовать сам signer, а не privateKey
      const irysUploader = await Uploader(Ethereum).withWallet(signer);
      console.log("Connected to mainnet Irys with new SDK");
      
      return irysUploader;
    } catch (error) {
      console.error('Error creating Irys uploader:', error);
      throw error;
    }
  }, []);

  // Fund Irys account
  const fundIrysAccount = useCallback(async (amount = 0.001) => {
     try {
       const irysUploader = await getIrysUploader();
       const fundTx = await irysUploader.fund(irysUploader.utils.toAtomic(amount));
       console.log(`Successfully funded ${irysUploader.utils.fromAtomic(fundTx.quantity)} ${irysUploader.token}`);
       return fundTx;
     } catch (error) {
       console.error('Error funding Irys account:', error);
       throw new Error(`Failed to fund Irys account: ${error.message}`);
     }
   }, [getIrysUploader]);
   
   // Check Irys balance
   const checkIrysBalance = useCallback(async () => {
     try {
       const irysUploader = await getIrysUploader();
       const balance = await irysUploader.getBalance();
       const balanceInEth = irysUploader.utils.fromAtomic(balance);
       console.log(`Irys balance: ${balanceInEth} ETH`);
       return parseFloat(balanceInEth);
     } catch (error) {
       console.error('Error checking Irys balance:', error);
       return 0;
     }
   }, [getIrysUploader]);

   // Upload to Irys
   const uploadToIrys = useCallback(async (file, tags = {}) => {
     setIsUploading(true);
     try {
       if (!file || !(file instanceof File || file instanceof Blob || Buffer.isBuffer(file))) {
         throw new Error("Invalid file format. Expected File, Blob or Buffer object.");
       }
       
       const irysUploader = await getIrysUploader();
      
      // Проверяем баланс Irys
       const irysBalance = await checkIrysBalance();
       console.log(`Current Irys balance: ${irysBalance} ETH`);
       
       // Если баланс недостаточен, пытаемся пополнить
       if (irysBalance < 0.001) {
         console.log(`Insufficient Irys balance (${irysBalance} ETH). Attempting to fund account...`);
         try {
           await fundIrysAccount(0.001);
           console.log("Successfully funded Irys account");
         } catch (fundError) {
           console.error("Failed to fund Irys account:", fundError);
           throw new Error(`Insufficient Irys balance (${irysBalance} ETH) and failed to fund account. Please ensure you have sufficient ETH in your wallet and try again. Error: ${fundError.message}`);
         }
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
       
       const receipt = await irysUploader.upload(buffer, { tags: uploadTags });
       console.log("File uploaded successfully:", receipt);
   
       return {
         url: `https://gateway.irys.xyz/${receipt.id}`,
         id: receipt.id,
         size: receipt.size
       };
    } catch (error) {
       console.error('Upload error:', error);
       throw new Error(`Failed to upload file: ${error.message}`);
     } finally {
       setIsUploading(false);
     }
   }, [getIrysUploader, checkIrysBalance, fundIrysAccount]);
 
   return {
     uploadToIrys,
     checkIrysBalance,
     fundIrysAccount,
     isUploading,
     isWalletReady
   };
 };
