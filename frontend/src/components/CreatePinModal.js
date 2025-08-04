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
  const [duration, setDuration] = useState("");
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
    
    // Проверяем, что файл является валидным
    if (!(image instanceof File)) {
      toast.error("Invalid image file format");
      return;
    }
    
    console.log("Starting NFT creation process...");
    console.log("Image file:", image);
    console.log("Image type:", image.type);
    console.log("Image size:", image.size);
    
    setUploading(true);
    try {
      // 1. Create NFT metadata with price if for sale
      const metadata = createNFTMetadata(
        title,
        "PIN",
        description,
        "", // Will be set after image upload
        [
          { trait_type: "Platform", value: "IrysPinter" },
          ...(forSale && price ? [{ trait_type: "Price", value: `${price} ETH` }] : [])
        ]
      );
      
      // Add price to metadata if for sale
      if (forSale && price) {
        metadata.price = parseFloat(price);
      }
      
      console.log("Created metadata:", metadata);
      
      // 2. Mint NFT on Arbitrum/Ethereum (with automatic listing if for sale)
      const nftResult = await mintNFT(metadata, image);
      
      console.log("NFT minting result:", nftResult);
      
      // 3. Save pin data to backend
      const pinData = {
        title,
        description,
        owner: address,
        mint_address: nftResult.mintAddress,
        image_url: nftResult.imageUrl,
        metadata_url: nftResult.metadataUrl,
        for_sale: forSale && !nftResult.listingFailed,
        price: forSale && !nftResult.listingFailed ? price : null,
        duration: forSale && duration && !nftResult.listingFailed ? duration : null,
        transaction_signature: nftResult.transactionSignature
      };
      
      console.log("Saving pin data:", pinData);
      
      console.log("API URL:", `${API}/pins`);
      console.log("Making POST request to backend...");
      
      const response = await axios.post(`${API}/pins`, pinData);
      console.log("Backend response:", response.data);
      
      // Убеждаемся, что у пина есть _id
      if (!response.data._id) {
        throw new Error("Pin created but no _id returned");
      }
      
      onPinCreated(response.data);
      
      if (nftResult.listingFailed) {
        toast.success("NFT minted successfully, but could not be listed for sale. You can list it later from your profile.");
      } else if (forSale) {
        toast.success("NFT minted and listed for sale successfully!");
      } else {
        toast.success("NFT minted successfully!");
      }
      
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#51FED6] rounded-xl flex items-center justify-center">
                <span className="text-2xl">📌</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Create NFT Pin</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <span className="text-2xl text-gray-500">×</span>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image
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
                className="mt-2 px-4 py-3 bg-[#51FED6] text-gray-900 rounded-xl hover:bg-[#4AE8C7] transition-all duration-200 font-medium"
              >
                Choose Image
              </button>
              {previewUrl && (
                <img src={previewUrl} alt="Preview" className="mt-4 max-h-48 rounded-lg" />
              )}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51FED6] focus:border-[#51FED6] transition-all duration-200"
                placeholder="Enter pin title"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51FED6] focus:border-[#51FED6] transition-all duration-200"
                placeholder="Describe your NFT..."
              />
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl mb-6">
              <input
                type="checkbox"
                id="forSale"
                checked={forSale}
                onChange={(e) => setForSale(e.target.checked)}
                className="w-4 h-4 text-[#51FED6] bg-gray-100 border-gray-300 rounded focus:ring-[#51FED6] focus:ring-2"
              />
              <label htmlFor="forSale" className="text-sm font-medium text-gray-700">
                List for sale immediately
              </label>
            </div>
            {forSale && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (ETH)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    step="0.000001"
                    min="0.000001"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51FED6] focus:border-[#51FED6] transition-all duration-200"
                    placeholder="1"
                    required={forSale}
                    onInvalid={(e) => {
                      e.target.setCustomValidity("Please enter a valid price. Minimum value is 0.000001 ETH");
                    }}
                    onInput={(e) => {
                      e.target.setCustomValidity("");
                    }}
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (days, optional)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="1"
                    max="365"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#51FED6] focus:border-[#51FED6] transition-all duration-200"
                    placeholder="30"
                  />
                </div>
              </>
            )}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading || isUploading || isMinting}
                className="flex-1 px-6 py-3 bg-[#51FED6] text-gray-900 rounded-xl hover:bg-[#4AE8C7] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading || isUploading || isMinting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
                    {isUploading ? "Uploading..." : isMinting ? "Minting..." : "Creating..."}
                  </div>
                ) : (
                  "Create NFT"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePinModal;