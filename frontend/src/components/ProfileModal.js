import React, { useState, useEffect } from "react";
import { User, X, Heart, MessageCircle, Eye, Download } from "lucide-react";
import { profileService } from "../services/profileService";
import { useEthereumWallet } from "../contexts/EthereumWalletProvider";

const ProfileModal = ({ isOpen, onClose }) => {
  const { address } = useEthereumWallet();
  const [activeTab, setActiveTab] = useState('pins');
  const [userPins, setUserPins] = useState([]);
  const [likedPins, setLikedPins] = useState([]);
  const [stats, setStats] = useState({
    totalPins: 0,
    totalLikes: 0,
    totalViews: 0,
    totalDownloads: 0
  });
  const [loading, setLoading] = useState(false);

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
              <div className="text-2xl font-bold text-gray-900">{stats.totalLikes}</div>
              <div className="text-xs text-gray-500">Likes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalViews}</div>
              <div className="text-xs text-gray-500">Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalDownloads}</div>
              <div className="text-xs text-gray-500">Downloads</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('pins')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'pins' 
                  ? 'bg-[#51FED6] text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Pins
            </button>
            <button
              onClick={() => setActiveTab('liked')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'liked' 
                  ? 'bg-[#51FED6] text-gray-900' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Liked Pins
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#51FED6] mx-auto mb-4"></div>
              <p className="text-gray-500">Loading profile data...</p>
            </div>
          ) : activeTab === 'pins' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {userPins.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <div className="text-6xl mb-4">📌</div>
                  <h3 className="text-xl font-medium text-gray-900">No pins yet</h3>
                  <p className="text-gray-500">Start creating your first pin!</p>
                </div>
              ) : (
                userPins.map((pin) => (
                  <div key={pin.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100 relative">
                      {pin.image_url ? (
                        <img
                          src={pin.image_url}
                          alt={pin.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-2xl">🖼️</div>
                        </div>
                      )}
                      {pin.for_sale && pin.price && (
                        <div className="absolute top-2 right-2 bg-[#51FED6] text-gray-900 px-2 py-1 rounded-full text-xs font-bold">
                          {pin.price} ETH
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 text-sm truncate">
                        {pin.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Heart className="w-3 h-3" />
                          <span>{pin.likes || 0}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Eye className="w-3 h-3" />
                          <span>{pin.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {likedPins.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No liked pins yet</p>
                </div>
              ) : (
                likedPins.map((pin) => (
                  <div key={pin.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100 relative">
                      {pin.image_url ? (
                        <img
                          src={pin.image_url}
                          alt={pin.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-2xl">🖼️</div>
                        </div>
                      )}
                      {pin.for_sale && pin.price && (
                        <div className="absolute top-2 right-2 bg-[#51FED6] text-gray-900 px-2 py-1 rounded-full text-xs font-bold">
                          {pin.price} ETH
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-gray-900 text-sm truncate">
                        {pin.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Heart className="w-3 h-3" />
                          <span>{pin.likes || 0}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Eye className="w-3 h-3" />
                          <span>{pin.views || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal; 