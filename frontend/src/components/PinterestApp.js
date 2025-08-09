import React, { useState, useEffect } from "react";
import Header from "./Header";
import PinGrid from "./PinGrid";
import CreatePinModal from "./CreatePinModal";
import PinModal from "./PinModal";
import UserProfileModal from "./UserProfileModal";

import axios from "axios";
import toast from "react-hot-toast";
import { useEthereumWallet } from "../contexts/EthereumWalletProvider";

const BACKEND_URL = "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

const PinterestApp = () => {
  const { address, isConnected } = useEthereumWallet();
  const [pins, setPins] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserAddress, setSelectedUserAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPins();
  }, []);

  const fetchPins = async () => {
    try {
      const response = await axios.get(`${API}/pins`);
      setPins(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching pins:", error);
      toast.error("Failed to load pins");
      setLoading(false);
    }
  };

  const handlePinCreated = (newPin) => {
    setPins([newPin, ...pins]);
    setShowCreateModal(false);
    toast.success("Pin created successfully!");
  };

  const handlePinClick = (pin) => {
    setSelectedPin(pin);
  };

  const handlePinUpdated = (updatedPin) => {
    setPins(pins.map(p => p._id === updatedPin._id ? updatedPin : p));
    setSelectedPin(updatedPin);
  };

  const handleUserClick = (userAddress) => {
    setSelectedUserAddress(userAddress);
    setShowUserProfileModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#51FED6] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading IrysPinter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header
        onCreateClick={() => setShowCreateModal(true)}
        isWalletConnected={!!address}
        onConnectWallet={() => {}}
        walletAddress={address}
      />
      
      <div className="py-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            IrysPinter
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Decentralized Pinterest on Irys - Share & Connect
          </p>
          <div className="inline-flex items-center bg-[#51FED6] text-gray-900 px-4 py-2 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-gray-900 rounded-full mr-2 animate-pulse"></span>
            {address ? `Wallet: ${address.slice(0, 6)}...${address.slice(-4)}` : "Wallet not connected"}
          </div>
        </div>
      </div>
      
      <PinGrid
        pins={pins}
        onPinClick={handlePinClick}
        onUserClick={handleUserClick}
        currentWallet={address}
      />
      
      {showCreateModal && (
        <CreatePinModal
          onClose={() => setShowCreateModal(false)}
          onPinCreated={handlePinCreated}
          walletAddress={address}
        />
      )}
      
      {selectedPin && (
        <PinModal
          pin={selectedPin}
          onClose={() => setSelectedPin(null)}
          onPinUpdated={handlePinUpdated}
          currentWallet={address}
        />
      )}

      {showUserProfileModal && (
        <UserProfileModal
          isOpen={showUserProfileModal}
          onClose={() => setShowUserProfileModal(false)}
          userAddress={selectedUserAddress}
        />
      )}
    </div>
  );
};

export default PinterestApp;