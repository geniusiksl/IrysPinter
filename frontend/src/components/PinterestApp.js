import React, { useState, useEffect } from "react";
import Header from "./Header";
import PinGrid from "./PinGrid";
import CreatePinModal from "./CreatePinModal";
import PinModal from "./PinModal";
import axios from "axios";
import toast from "react-hot-toast";

const BACKEND_URL = "http://localhost:8001";
const API = `${BACKEND_URL}/api`;

const PinterestApp = () => {
  const [pins, setPins] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    fetchPins();
    if (window.solana && window.solana.isPhantom && window.solana.isConnected) {
      setWalletAddress(window.solana.publicKey?.toString() || "");
    }
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

  const connectPhantom = async () => {
    if (window.solana && window.solana.isPhantom) {
      try {
        const resp = await window.solana.connect();
        setWalletAddress(resp.publicKey.toString());
        toast.success("Phantom wallet connected!");
      } catch (err) {
        toast.error("User rejected the request");
      }
    } else {
      toast.error("Please install Phantom Wallet!");
    }
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
        isWalletConnected={!!walletAddress}
        onConnectWallet={connectPhantom}
        walletAddress={walletAddress}
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
            {walletAddress ? `Wallet: ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : "Wallet not connected"}
          </div>
        </div>
      </div>
      <PinGrid 
        pins={pins} 
        onPinClick={handlePinClick}
        currentWallet={walletAddress}
      />
      {showCreateModal && (
        <CreatePinModal
          onClose={() => setShowCreateModal(false)}
          onPinCreated={handlePinCreated}
          walletAddress={walletAddress}
        />
      )}
      {selectedPin && (
        <PinModal
          pin={selectedPin}
          onClose={() => setSelectedPin(null)}
          onPurchase={handlePinPurchased}
          onPinUpdated={handlePinUpdated}
          walletAddress={walletAddress}
          currentWallet={walletAddress}
        />
      )}
    </div>
  );
};

export default PinterestApp;