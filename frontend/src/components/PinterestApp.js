import React, { useState, useEffect } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import Header from "./Header";
import PinGrid from "./PinGrid";
import CreatePinModal from "./CreatePinModal";
import PinModal from "./PinModal";
import axios from "axios";
import toast from "react-hot-toast";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PinterestApp = () => {
  const [pins, setPins] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  const [loading, setLoading] = useState(true);
  const wallet = useWallet();

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

  const handlePinPurchased = (updatedPin) => {
    setPins(pins.map(p => p.id === updatedPin.id ? updatedPin : p));
    setSelectedPin(updatedPin);
    toast.success("NFT purchased successfully!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header 
        onCreateClick={() => setShowCreateModal(true)}
        isWalletConnected={wallet.connected}
      />
      
      {!wallet.connected && (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Connect Your Solana Wallet
          </h2>
          <p className="text-gray-600 mb-8 text-center max-w-md">
            Connect your Solana wallet to create, buy, and sell NFTs on our decentralized Pinterest
          </p>
          <WalletMultiButton className="!bg-red-600 hover:!bg-red-700" />
        </div>
      )}

      {wallet.connected && (
        <PinGrid 
          pins={pins} 
          onPinClick={handlePinClick}
          currentWallet={wallet.publicKey?.toString()}
        />
      )}

      {showCreateModal && (
        <CreatePinModal
          onClose={() => setShowCreateModal(false)}
          onPinCreated={handlePinCreated}
          wallet={wallet}
        />
      )}

      {selectedPin && (
        <PinModal
          pin={selectedPin}
          onClose={() => setSelectedPin(null)}
          onPurchase={handlePinPurchased}
          wallet={wallet}
          currentWallet={wallet.publicKey?.toString()}
        />
      )}
    </div>
  );
};

export default PinterestApp;