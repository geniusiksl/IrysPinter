import React, { useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useIrys } from "../hooks/useIrys";
import axios from "axios";
import toast from "react-hot-toast";
import { Connection, PublicKey, Transaction, SystemProgram, Keypair, TransactionInstruction } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, setAuthority, AuthorityType } from '@solana/spl-token';
import Irys from '@irys/sdk';

const BACKEND_URL = "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

<<<<<<< HEAD
const network = 'devnet';
const endpoint = 'https://api.devnet.solana.com';

const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

const CreatePinModal = ({ onClose, onPinCreated, walletAddress }) => {
=======
const CreatePinModal = ({ onClose, onPinCreated }) => {
  const { publicKey, connected } = useWallet();
  const { uploadImageWithMetadata, isUploading, uploadProgress } = useIrys();
>>>>>>> 379c2ed1cf58ccf80531774e225654958c2ba93e
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [forSale, setForSale] = useState(false);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [imageTxid, setImageTxid] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [metadataTxid, setMetadataTxid] = useState("");
  const [mintAddress, setMintAddress] = useState("");
  const [mintTxid, setMintTxid] = useState("");
  const [irysUploading, setIrysUploading] = useState(false);
  const [minting, setMinting] = useState(false);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("File size must be less than 10MB");
        return;
      }
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Irys upload handler
  const handleIrysUpload = async () => {
    if (!image) {
      toast.error("Please select an image");
      return;
    }
<<<<<<< HEAD
    if (!walletAddress || !window.solana) {
=======
    
    if (!connected) {
>>>>>>> 379c2ed1cf58ccf80531774e225654958c2ba93e
      toast.error("Please connect your wallet");
      return;
    }
    setIrysUploading(true);
    try {
      const irys = new Irys({
        url: 'https://devnet.irys.xyz',
        token: 'solana',
        wallet: {
          publicKey: new PublicKey(walletAddress),
          signMessage: window.solana.signMessage
        },
      });
      const fileBuffer = await image.arrayBuffer();
      const tx = await irys.upload(Buffer.from(fileBuffer), {
        tags: [{ name: "Content-Type", value: image.type }],
      });
      setImageTxid(tx.id);
      setImageUrl(`https://gateway.irys.xyz/${tx.id}`);
      toast.success("Image uploaded to Irys!");
    } catch (e) {
      toast.error("Irys upload failed");
      console.error(e);
    } finally {
      setIrysUploading(false);
    }
  };

  // Metadata upload to Irys
  const handleMetadataUpload = async () => {
    if (!imageUrl) {
      toast.error("Upload image to Irys first");
      return;
    }
    if (!walletAddress || !window.solana) {
      toast.error("Please connect your wallet");
      return;
    }
    setIrysUploading(true);
    try {
      const irys = new Irys({
        url: 'https://devnet.irys.xyz',
        token: 'solana',
        wallet: {
          publicKey: new PublicKey(walletAddress),
          signMessage: window.solana.signMessage
        },
      });
      const metadata = {
        name: title,
        symbol: "PIN",
        description,
        image: imageUrl,
        attributes: [],
        properties: { files: [{ uri: imageUrl, type: image?.type }] },
      };
      const tx = await irys.upload(JSON.stringify(metadata), {
        tags: [{ name: "Content-Type", value: "application/json" }],
      });
      setMetadataTxid(tx.id);
      toast.success("Metadata uploaded to Irys!");
    } catch (e) {
      toast.error("Metadata upload failed");
      console.error(e);
    } finally {
      setIrysUploading(false);
    }
  };

  // Mint NFT via web3.js + spl-token + Token Metadata Program
  const handleMintNFT = async () => {
    if (!metadataTxid) {
      toast.error("Upload metadata to Irys first");
      return;
    }
    if (!walletAddress || !window.solana) {
      toast.error("Please connect your wallet");
      return;
    }
    setMinting(true);
    try {
      const connection = new Connection(endpoint);
      const provider = window.solana;
      await provider.connect();
      const fromPubkey = new PublicKey(walletAddress);
      const mint = Keypair.generate();
      const lamports = await connection.getMinimumBalanceForRentExemption(82);
      const transaction = new Transaction();
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey,
          newAccountPubkey: mint.publicKey,
          space: 82,
          lamports,
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
        })
      );
      transaction.add(
        createMint({
          decimals: 0,
          mintAuthority: fromPubkey,
          freezeAuthority: fromPubkey,
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
        }, mint.publicKey)
      );
      const ata = await getOrCreateAssociatedTokenAccount(
        connection,
        mint,
        fromPubkey,
        fromPubkey
      );
      transaction.add(
        mintTo({
          mint: mint.publicKey,
          destination: ata.address,
          authority: fromPubkey,
          amount: 1n
        })
      );
      transaction.add(
        setAuthority({
          account: mint.publicKey,
          currentAuthority: fromPubkey,
          authorityType: AuthorityType.MintTokens,
          newAuthority: null
        })
      );
      // Token Metadata Program: create metadata account
      const [metadataPDA] = await PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mint.publicKey.toBuffer()
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      // Минимальная сериализация для create_metadata (инструкция 0)
      const data = Buffer.concat([
        Buffer.from([0]), // create_metadata instruction
        Buffer.from(title.padEnd(32)),
        Buffer.from("PIN".padEnd(10)),
        Buffer.from(`https://gateway.irys.xyz/${metadataTxid}`.padEnd(200)),
        Buffer.alloc(2), // sellerFeeBasisPoints (0)
        Buffer.from([0]), // no creators
        Buffer.from([0]), // no collection
        Buffer.from([0])  // no uses
      ]);
      const keys = [
        { pubkey: metadataPDA, isSigner: false, isWritable: true },
        { pubkey: mint.publicKey, isSigner: false, isWritable: false },
        { pubkey: fromPubkey, isSigner: true, isWritable: false },
        { pubkey: fromPubkey, isSigner: true, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false }
      ];
      const createMetadataIx = new TransactionInstruction({
        keys,
        programId: TOKEN_METADATA_PROGRAM_ID,
        data
      });
      transaction.add(createMetadataIx);

      transaction.partialSign(mint);
      const signed = await provider.signTransaction(transaction);
      const txid = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(txid);
      setMintAddress(mint.publicKey.toString());
      setMintTxid(txid);
      toast.success("NFT minted!");
    } catch (e) {
      toast.error("Minting failed");
      console.error(e);
    } finally {
      setMinting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageTxid || !imageUrl || !metadataTxid || !mintAddress || !mintTxid) {
      toast.error("Please upload and mint all data");
      return;
    }
    if (!walletAddress) {
      toast.error("Please connect your wallet");
      return;
    }
    setUploading(true);
    try {
<<<<<<< HEAD
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('owner', walletAddress);
      formData.append('for_sale', forSale);
      if (forSale && price) {
        formData.append('price', price);
      }
      formData.append('image_txid', imageTxid);
      formData.append('image_url', imageUrl);
      formData.append('metadata_txid', metadataTxid);
      formData.append('mint_address', mintAddress);
      formData.append('mint_txid', mintTxid);
      const response = await axios.post(`${API}/pins`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
=======
      // Upload image and metadata to Irys
      const uploadResult = await uploadImageWithMetadata(
        image,
        title,
        description,
        forSale ? parseFloat(price) : null
      );

      // Create pin data
      const pinData = {
        title,
        description,
        owner: publicKey.toString(),
        image_txid: uploadResult.image.transactionId,
        image_url: uploadResult.image.url,
        metadata_txid: uploadResult.metadata.transactionId,
        metadata_url: uploadResult.metadata.url,
        price: forSale ? parseFloat(price) : null,
        for_sale: forSale,
        mint_address: null, // Will be set by backend
      };

      // Send to backend for NFT minting
      const response = await axios.post(`${API}/pins`, pinData);

>>>>>>> 379c2ed1cf58ccf80531774e225654958c2ba93e
      onPinCreated(response.data);
      toast.success("Pin created successfully! NFT minted on Solana.");
    } catch (error) {
      console.error("Error creating pin:", error);
      toast.error(error.response?.data?.detail || "Failed to create pin");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create NFT Pin</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={uploading}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-40 mx-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setPreviewUrl("");
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-gray-600">Click to upload image</p>
                    <p className="text-xs text-gray-400 mt-1">Max 10MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Choose Image
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter pin title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Describe your NFT..."
              />
            </div>

            {/* For Sale Toggle */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="forSale"
                checked={forSale}
                onChange={(e) => setForSale(e.target.checked)}
                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="forSale" className="text-sm font-medium text-gray-700">
                List for sale
              </label>
            </div>

            {/* Price */}
            {forSale && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (SOL)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="0.1"
                />
              </div>
            )}

<<<<<<< HEAD
            {/* Irys and Solana Txids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="mb-2">
                <input
                  type="text"
                  value={imageTxid}
                  onChange={e => setImageTxid(e.target.value)}
                  placeholder="Irys txid for image"
                  className="border px-2 py-1 rounded mr-2 text-xs"
                />
                <input
                  type="text"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="Irys gateway URL"
                  className="border px-2 py-1 rounded text-xs"
                />
              </div>
              <div className="mb-2">
                <input
                  type="text"
                  value={metadataTxid}
                  onChange={e => setMetadataTxid(e.target.value)}
                  placeholder="Irys txid for metadata"
                  className="border px-2 py-1 rounded mr-2 text-xs"
                />
              </div>
              <div className="mb-2">
                <input
                  type="text"
                  value={mintAddress}
                  onChange={e => setMintAddress(e.target.value)}
                  placeholder="NFT mint address"
                  className="border px-2 py-1 rounded mr-2 text-xs"
                />
                <input
                  type="text"
                  value={mintTxid}
                  onChange={e => setMintTxid(e.target.value)}
                  placeholder="Solana mint txid"
                  className="border px-2 py-1 rounded text-xs"
                />
              </div>
            </div>

            {/* Mint and Upload Buttons */}
            <div className="flex flex-col md:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={handleIrysUpload}
                disabled={irysUploading || !image}
                className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
              >
                {irysUploading ? "Uploading Image..." : "Upload Image to Irys"}
              </button>
              <button
                type="button"
                onClick={handleMetadataUpload}
                disabled={irysUploading || !imageUrl}
                className="w-full md:w-auto bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
              >
                {irysUploading ? "Uploading Metadata..." : "Upload Metadata to Irys"}
              </button>
              <button
                type="button"
                onClick={handleMintNFT}
                disabled={minting || !metadataTxid}
                className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
              >
                {minting ? "Minting..." : "Mint NFT"}
              </button>
            </div>
=======
            {/* Upload Progress */}
            {(isUploading || uploading) && (
              <div className="pt-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {isUploading ? "Uploading to Irys..." : "Processing..."}
                </p>
              </div>
            )}
>>>>>>> 379c2ed1cf58ccf80531774e225654958c2ba93e

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={uploading || !image || !title}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating NFT Pin...</span>
                  </>
                ) : (
                  <span>Create NFT Pin</span>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Your image will be stored on Irys and minted as an NFT on Solana
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePinModal;