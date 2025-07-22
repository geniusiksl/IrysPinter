import { useState, useCallback } from 'react';
import { Uploader } from '@irys/upload';
import { Solana } from '@irys/upload-solana';
import { useWallet } from '@solana/wallet-adapter-react';

export const useIrys = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { publicKey, signTransaction } = useWallet();

  const getIrysUploader = useCallback(async () => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected');
    }

    try {
      const irysUploader = await Uploader(Solana).withWallet({
        publicKey: publicKey.toString(),
        signTransaction: signTransaction,
      });
      return irysUploader;
    } catch (error) {
      console.error('Error initializing Irys uploader:', error);
      throw error;
    }
  }, [publicKey, signTransaction]);

  const uploadFile = useCallback(async (file, tags = {}) => {
    if (!file) {
      throw new Error('No file provided');
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const irysUploader = await getIrysUploader();

      // Add default tags
      const defaultTags = {
        'Content-Type': file.type,
        'application-id': 'SolPinter',
        'type': 'image',
        ...tags,
      };

      // Upload file
      const receipt = await irysUploader.uploadFile(file, {
        tags: Object.entries(defaultTags).map(([name, value]) => ({
          name,
          value: value.toString(),
        })),
      });

      setUploadProgress(100);
      return {
        transactionId: receipt.id,
        url: `https://gateway.irys.xyz/${receipt.id}`,
      };
    } catch (error) {
      console.error('Error uploading to Irys:', error);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [getIrysUploader]);

  const uploadMetadata = useCallback(async (metadata, tags = {}) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const irysUploader = await getIrysUploader();

      // Convert metadata to JSON string
      const metadataString = JSON.stringify(metadata);

      // Add default tags
      const defaultTags = {
        'Content-Type': 'application/json',
        'application-id': 'SolPinter',
        'type': 'metadata',
        ...tags,
      };

      // Upload metadata
      const receipt = await irysUploader.upload(metadataString, {
        tags: Object.entries(defaultTags).map(([name, value]) => ({
          name,
          value: value.toString(),
        })),
      });

      setUploadProgress(100);
      return {
        transactionId: receipt.id,
        url: `https://gateway.irys.xyz/${receipt.id}`,
      };
    } catch (error) {
      console.error('Error uploading metadata to Irys:', error);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [getIrysUploader]);

  const uploadImageWithMetadata = useCallback(async (
    imageFile,
    title,
    description,
    price = null
  ) => {
    try {
      // Upload image first
      const imageResult = await uploadFile(imageFile, {
        title,
        description,
        price: price ? price.toString() : '',
      });

      // Create metadata
      const metadata = {
        name: title,
        symbol: 'SOLPIN',
        description,
        image: imageResult.url,
        attributes: [
          {
            trait_type: 'Platform',
            value: 'SolPinter',
          },
        ],
        properties: {
          files: [
            {
              type: imageFile.type,
              uri: imageResult.url,
            },
          ],
          category: 'image',
        },
      };

      if (price) {
        metadata.attributes.push({
          trait_type: 'Price',
          value: `${price} SOL`,
        });
      }

      // Upload metadata
      const metadataResult = await uploadMetadata(metadata);

      return {
        image: imageResult,
        metadata: metadataResult,
        metadataContent: metadata,
      };
    } catch (error) {
      console.error('Error uploading image with metadata:', error);
      throw error;
    }
  }, [uploadFile, uploadMetadata]);

  return {
    uploadFile,
    uploadMetadata,
    uploadImageWithMetadata,
    isUploading,
    uploadProgress,
  };
}; 