import React, { useState, useEffect } from "react";
import { User, X, Heart, MessageCircle, Trash2 } from "lucide-react";
import { profileService } from "../services/profileService";
import { useEthereumWallet } from "../contexts/EthereumWalletProvider";
import axios from "axios";
import toast from "react-hot-toast";

const BACKEND_URL = "https://iryspinter.onrender.com";
const API = `${BACKEND_URL}/api`;

const ProfileModal = ({ isOpen, onClose }) => {
  const { address } = useEthereumWallet();
  const [activeTab, setActiveTab] = useState('pins');
  const [userPins, setUserPins] = useState([]);
  const [likedPins, setLikedPins] = useState([]);
  const [stats, setStats] = useState({
    totalPins: 0,
    totalLikes: 0,
    totalLikesOnUserPins: 0,
    totalComments: 0
  });
  const [loading, setLoading] = useState(false);
  const [deletingPin, setDeletingPin] = useState(null);

  // Загружаем данные профиля при открытии модала
  useEffect(() => {
    if (isOpen && address) {
      loadProfileData();
    }
  }, [isOpen, address]);

  const loadProfileData = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      // Загружаем статистику
      const statsData = await profileService.getUserStats(address);
      setStats(statsData);
      
      // Загружаем пины пользователя
      const pinsData = await profileService.getUserPins(address);
      setUserPins(pinsData);
      
      // Загружаем лайкнутые пины
      const likedData = await profileService.getLikedPins(address);
      setLikedPins(likedData);
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePin = async (pinId) => {
    if (!address) return;
    
    try {
      setDeletingPin(pinId);
      
      const response = await axios.delete(`${API}/pins/${pinId}`, {
        data: { owner: address }
      });
      
      if (response.data.success) {
        // Удаляем пин из списка
        setUserPins(userPins.filter(pin => pin._id !== pinId));
        
        // Обновляем статистику
        setStats(prev => ({
          ...prev,
          totalPins: prev.totalPins - 1
        }));
        
        toast.success("Pin deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting pin:", error);
      toast.error(error.response?.data?.error || "Failed to delete pin");
    } finally {
      setDeletingPin(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-[#51FED6] rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-900" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
              <p className="text-sm text-gray-600">Manage your pins and activity</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalPins}</div>
              <div className="text-xs text-gray-500">Pins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalLikesOnUserPins}</div>
              <div className="text-xs text-gray-500">Likes Received</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalComments}</div>
              <div className="text-xs text-gray-500">Comments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalLikes}</div>
              <div className="text-xs text-gray-500">Likes Given</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('pins')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pins'
                  ? 'border-[#51FED6] text-[#51FED6]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Pins ({userPins.length})
            </button>
            <button
              onClick={() => setActiveTab('liked')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'liked'
                  ? 'border-[#51FED6] text-[#51FED6]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Liked Pins ({likedPins.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#51FED6] mx-auto mb-4"></div>
              <p className="text-gray-500">Loading profile data...</p>
            </div>
          ) : activeTab === 'pins' ? (
            <div className="space-y-4">
              {userPins.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📌</div>
                  <p className="text-gray-500">No pins yet</p>
                  <p className="text-sm text-gray-400">Create your first NFT pin!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userPins.map((pin) => (
                    <div key={pin._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="relative mb-3">
                        {pin.image_url ? (
                          <img
                            src={pin.image_url}
                            alt={pin.title}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🖼️</span>
                          </div>
                        )}
                        {pin.for_sale && (
                          <div className="absolute top-2 right-2 bg-[#51FED6] text-gray-900 px-2 py-1 rounded-full text-xs font-bold">
                            {pin.price} ETH
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {pin.title}
                      </h3>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{pin.likes || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{pin.comments || 0}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDeletePin(pin._id)}
                          disabled={deletingPin === pin._id}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {deletingPin === pin._id ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Deleting...
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {likedPins.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No liked pins yet</p>
                  <p className="text-sm text-gray-400">Like some pins to see them here!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {likedPins.map((pin) => (
                    <div key={pin._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="relative mb-3">
                        {pin.image_url ? (
                          <img
                            src={pin.image_url}
                            alt={pin.title}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🖼️</span>
                          </div>
                        )}
                        {pin.for_sale && (
                          <div className="absolute top-2 right-2 bg-[#51FED6] text-gray-900 px-2 py-1 rounded-full text-xs font-bold">
                            {pin.price} ETH
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {pin.title}
                      </h3>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span>{pin.likes || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{pin.comments || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal; 