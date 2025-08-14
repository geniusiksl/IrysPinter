import React, { useState, useRef } from "react";
import { useEthereumWallet } from "../contexts/EthereumWalletProvider";
import { useIrys } from "../hooks/useIrys";
import axios from "axios";
import toast from "react-hot-toast";

const BACKEND_URL = "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

const CreatePinModal = ({ onClose, onPinCreated, walletAddress }) => {
  const { address, isConnected } = useEthereumWallet();
  const { uploadToIrys, isUploading } = useIrys();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
    
    if (!(image instanceof File)) {
      toast.error("Invalid image file format");
      return;
    }
    
    console.log("Starting image upload process...");
    setUploading(true);
    
    try {
      // Upload image to Irys
      console.log("Uploading image to Irys...");
      const imageUpload = await uploadToIrys(image, {
        "Content-Type": image.type,
        "application-id": "IrysPinter",
        "type": "image"
      });
      
      console.log("Image uploaded:", imageUpload);
      
      // 3. Save pin data to backend
      const pinData = {
        title,
        description,
        owner: address,
        image_url: imageUpload.url,
        image_txid: imageUpload.id
      };
      
      console.log("Saving pin data:", pinData);
      
      const response = await axios.post(`${API}/pins`, pinData);
      console.log("Backend response:", response.data);
      
      if (!response.data._id) {
        throw new Error("Pin created but no _id returned");
      }
      
      onPinCreated(response.data);
      toast.success("Pin created successfully!");
      setUploading(false);
      onClose();
    } catch (error) {
      setUploading(false);
      console.error("Pin creation error:", error);
      toast.error(error.message || "Failed to create pin");
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
              <h2 className="text-2xl font-bold text-gray-900">Create Pin</h2>
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
              {!previewUrl ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-8 bg-[#51FED6] text-gray-900 rounded-xl hover:bg-[#4AE8C7] transition-all duration-200 font-medium border-2 border-dashed border-gray-300 hover:border-gray-400"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <span className="text-4xl">📷</span>
                    <span>Choose Image</span>
                  </div>
                </button>
              ) : (
                <div className="relative">
                  <div className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="opacity-0 hover:opacity-100 bg-white bg-opacity-90 text-gray-900 px-4 py-2 rounded-lg font-medium transition-all duration-200"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setPreviewUrl("");
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <span className="text-sm">×</span>
                  </button>
                </div>
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
                placeholder="Describe your pin..."
              />
            </div>
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
                disabled={uploading || isUploading}
                className="flex-1 px-6 py-3 bg-[#51FED6] text-gray-900 rounded-xl hover:bg-[#4AE8C7] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading || isUploading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
                    {isUploading ? "Uploading..." : "Creating..."}
                  </div>
                ) : (
                  "Create Pin"
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