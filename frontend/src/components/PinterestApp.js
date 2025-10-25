import React, { useState, useEffect } from "react";
import Header from "./Header";
import PinGrid from "./PinGrid";
import CreatePinModal from "./CreatePinModal";
import PinModal from "./PinModal";
import UserProfileModal from "./UserProfileModal";

import axios from "axios";
import toast from "react-hot-toast";
import { useEthereumWallet } from "../contexts/EthereumWalletProvider";

const BACKEND_URL = "https://iryspinter.onrender.com";
const API = `${BACKEND_URL}/api`;

const PinterestApp = () => {
  const { address, isConnected } = useEthereumWallet();
  const [pins, setPins] = useState([]);
  const [filteredPins, setFilteredPins] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPin, setSelectedPin] = useState(null);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserAddress, setSelectedUserAddress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPins();
  }, []);

  // Эффект для фильтрации пинов при изменении поискового запроса
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPins(pins);
    } else {
      const filtered = pins.filter(pin => 
        pin.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pin.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPins(filtered);
    }
  }, [pins, searchQuery]);

  const fetchPins = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/pins`, {
        timeout: 10000, // 10 second timeout
      });
      setPins(response.data);
      setFilteredPins(response.data); // Инициализируем фильтрованные пины
    } catch (error) {
      console.error("Error fetching pins:", error);
      toast.error("Failed to load pins. Please try again.");
      setPins([]); // Set empty array on error
      setFilteredPins([]);
    } finally {
      setLoading(false); // Always set loading to false
    }
  };

  const handlePinCreated = (newPin) => {
    setPins([newPin, ...pins]);
    setShowCreateModal(false);
  };

  const handlePinClick = async (pinOrId) => {
    // Если передан объект пина, используем его
    if (typeof pinOrId === 'object' && pinOrId._id) {
      setSelectedPin(pinOrId);
    } 
    // Если передан только ID, загружаем пин из базы данных
    else if (typeof pinOrId === 'string') {
      try {
        const response = await axios.get(`${API}/pins/${pinOrId}`);
        setSelectedPin(response.data);
      } catch (error) {
        console.error("Error fetching pin:", error);
        toast.error("Failed to load pin");
      }
    }
  };

  const handlePinUpdated = (updatedPin) => {
    setPins(pins.map(p => p._id === updatedPin._id ? updatedPin : p));
    setSelectedPin(updatedPin);
  };

  const handleUserClick = (userAddress) => {
    setSelectedUserAddress(userAddress);
    setShowUserProfileModal(true);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleGoHome = () => {
    setSearchQuery("");
    setSelectedPin(null);
    setShowUserProfileModal(false);
    // Прокручиваем страницу вверх
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#51FED6] mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading IrysPinter...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Header
        onCreateClick={() => setShowCreateModal(true)}
        isWalletConnected={!!address}
        onConnectWallet={() => {}}
        walletAddress={address}
        onSearch={handleSearch}
        onPinClick={handlePinClick}
        onLogoClick={handleGoHome}
      />
      
      {searchQuery && (
        <div className={`py-4 text-center bg-white/60 backdrop-blur-sm border-b border-white/30 ${isConnected ? 'mr-20' : ''}`}>
          <p className="text-sm text-gray-700">
            Showing results for: <span className="font-semibold">"{searchQuery}"</span>
            <button 
              onClick={() => setSearchQuery("")}
              className="ml-2 text-[#51FED6] hover:underline font-medium"
            >
              Clear search
            </button>
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Found {filteredPins.length} pin{filteredPins.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
      
      <div className={`${isConnected ? 'mr-20' : ''}`}>
        <PinGrid
          pins={filteredPins}
          onPinClick={handlePinClick}
          onUserClick={handleUserClick}
          currentWallet={address}
        />
      </div>
      
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