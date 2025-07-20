import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Header from "./Header";
import PinGrid from "./PinGrid";
import CreatePinModal from "./CreatePinModal";
import PinModal from "./PinModal";
import RoyaltyInfo from "./RoyaltyInfo";
import axios from "axios";
import toast from "react-hot-toast";

const BACKEND_URL = "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

const PinterestApp = () => {
  const { publicKey, connected } = useWallet();
  const [pins, setPins] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRoyaltyInfo, setShowRoyaltyInfo] = useState(false);

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

  const handlePinUpdated = (updatedPin) => {
    setPins(pins.map(p => p.id === updatedPin.id ? updatedPin : p));
    setSelectedPin(updatedPin);
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
        onRoyaltyClick={() => setShowRoyaltyInfo(true)}
      />
      
      <div className="py-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            SolPinter
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Decentralized Pinterest on Solana - Create, Buy & Sell NFT Pins
          </p>
          <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Connected to Solana Mainnet
          </div>
        </div>
      </div>

      <PinGrid 
        pins={pins} 
        onPinClick={handlePinClick}
        currentWallet={publicKey?.toString()}
      />

      {showCreateModal && (
        <CreatePinModal
          onClose={() => setShowCreateModal(false)}
          onPinCreated={handlePinCreated}
          wallet={{ publicKey, connected }}
        />
      )}

      {selectedPin && (
        <PinModal
          pin={selectedPin}
          onClose={() => setSelectedPin(null)}
          onPurchase={handlePinPurchased}
          onPinUpdated={handlePinUpdated}
          wallet={{ publicKey, connected }}
          currentWallet={publicKey?.toString()}
        />
      )}

      {showRoyaltyInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Royalty Management</h2>
                <button
                  onClick={() => setShowRoyaltyInfo(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <RoyaltyInfo />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PinterestApp;