import { useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { 
  Metaplex, 
  keypairIdentity, 
  irysStorage,
  walletAdapterIdentity
} from '@metaplex-foundation/js';
import { WebIrys as Irys } from '@irys/sdk';

const SOLANA_NETWORK = 'devnet';
const IRYS_NETWORK = 'devnet';

export const useIrys = () => {
  const { publicKey, signTransaction } = useWallet();
  const [isUploading, setIsUploading] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  const getConnection = useCallback(() => {
    return new Connection(
      SOLANA_NETWORK === 'devnet' 
        ? 'https://api.devnet.solana.com' 
        : 'https://api.mainnet-beta.solana.com'
    );
  }, []);

  const getIrys = useCallback(async () => {
    if (!publicKey) throw new Error('Wallet not connected');
    
    const connection = getConnection();
    const irys = new Irys({
      url: IRYS_NETWORK === 'devnet' ? 'https://devnet.irys.xyz' : 'https://node1.irys.xyz',
      token: 'solana',
      key: publicKey.toBytes(),
      config: { providerUrl: connection.rpcEndpoint }
    });
    
    return irys;
  }, [publicKey, getConnection]);

  const uploadToIrys = useCallback(async (file, tags = {}) => {
    try {
      setIsUploading(true);
      const irys = await getIrys();
      
      // Add default tags
      const uploadTags = {
        'Content-Type': file.type,
        'application-id': 'SolPinter',
        ...tags
      };

      const receipt = await irys.uploadFile(file, { tags: uploadTags });
      return {
        transactionId: receipt.id,
        url: `https://gateway.irys.xyz/${receipt.id}`
      };
    } catch (error) {
      console.error('Irys upload error:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [getIrys]);

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
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected');
    }

    // Check if wallet supports required methods
    if (typeof signTransaction !== 'function') {
      throw new Error('Wallet does not support transaction signing');
    }

    try {
      setIsMinting(true);
      const connection = getConnection();

      // 1. Upload image to Irys
      const imageUpload = await uploadToIrys(imageFile, { type: 'image' });
      
      // 2. Upload metadata to Irys
      const metadataWithImage = {
        ...metadata,
        image: imageUpload.url
      };
      const metadataBlob = new Blob([JSON.stringify(metadataWithImage)], {
        type: 'application/json'
      });
      const metadataUpload = await uploadToIrys(metadataBlob, { type: 'metadata' });

      // 3. Create Metaplex instance with wallet adapter
      const metaplex = Metaplex.make(connection)
        .use(walletAdapterIdentity({
          publicKey,
          signTransaction,
          signAllTransactions: async (transactions) => {
            const signedTransactions = [];
            for (const transaction of transactions) {
              const signed = await signTransaction(transaction);
              signedTransactions.push(signed);
            }
            return signedTransactions;
          }
        }))
        .use(irysStorage());

      // 4. Create NFT using Metaplex
      const mint = await metaplex.nfts().create({
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadataUpload.url,
        sellerFeeBasisPoints: 500, // 5% royalty
        creators: [
          {
            address: publicKey,
            verified: true,
            share: 100
          }
        ],
        isMutable: true
      });

      return {
        mintAddress: mint.nft.address.toString(),
        metadataAddress: mint.nft.metadata.address.toString(),
        transactionSignature: mint.response.signature,
        imageUrl: imageUpload.url,
        metadataUrl: metadataUpload.url
      };

    } catch (error) {
      console.error('NFT minting error:', error);
      throw error;
    } finally {
      setIsMinting(false);
    }
  }, [publicKey, signTransaction, getConnection, uploadToIrys]);

  return {
    uploadToIrys,
    mintNFT,
    createNFTMetadata,
    isUploading,
    isMinting
  };
}; 