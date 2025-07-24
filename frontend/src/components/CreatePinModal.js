import React, { useState, useRef } from "react";
import { useEthereumWallet } from "../contexts/EthereumWalletProvider";
import { useIrys } from "../hooks/useIrys";
import axios from "axios";
import toast from "react-hot-toast";

const BACKEND_URL = "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

const CreatePinModal = ({ onClose, onPinCreated, walletAddress }) => {
  const { address, isConnected } = useEthereumWallet();
  const { mintNFT, createNFTMetadata, isUploading, isMinting } = useIrys();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [forSale, setForSale] = useState(false);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !title) {
      toast.error("Please select an image and enter a title");
      return;
    }
    if (!isConnected || !address) {
      toast.error("Please connect your wallet");
      return;
    }
    setUploading(true);
    try {
      // 1. Create NFT metadata
      const metadata = createNFTMetadata(
        title,
        "PIN",
        description,
        "", // Will be set after image upload
        [
          { trait_type: "Platform", value: "IrysPinter" },
          ...(price ? [{ trait_type: "Price", value: `${price} ETH` }] : [])
        ]
      );
      // 2. Mint NFT on Arbitrum/Ethereum
      const nftResult = await mintNFT(metadata, image);
      // 3. Save pin data to backend
      const pinData = {
        title,
        description,
        owner: address,
        mint_address: nftResult.mintAddress,
        image_url: nftResult.imageUrl,
        metadata_url: nftResult.metadataUrl,
        for_sale: forSale,
        price,
        transaction_signature: nftResult.transactionSignature
      };
      const response = await axios.post(`${API}/pins`, pinData);
      onPinCreated(response.data);
      toast.success("NFT minted successfully on Arbitrum!");
      setUploading(false);
      onClose();
    } catch (error) {
      setUploading(false);
      console.error("NFT creation error:", error);
      toast.error(error.message || "Failed to mint NFT");
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
            >
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image *
              </label>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
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
              {previewUrl && (
                <img src={previewUrl} alt="Preview" className="mt-4 max-h-48 rounded-lg" />
              )}
            </div>
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
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="forSale"
                checked={forSale}
                onChange={(e) => setForSale(e.target.checked)}
              />
              <label htmlFor="forSale" className="text-sm font-medium text-gray-700">
                List for sale
              </label>
            </div>
            {forSale && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="0.01"
                />
              </div>
            )}
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
              Your image will be stored on Irys and minted as an NFT on Arbitrum
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePinModal;