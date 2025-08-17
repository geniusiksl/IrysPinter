import React, { useState, useEffect } from "react";
import { useEthereumWallet } from "../contexts/EthereumWalletProvider";
import { Plus, Wallet, LogOut, User, Bell, Home, MessageCircle, Search } from "lucide-react";
import WalletConnectModal from "./WalletConnectModal";
import NotificationsModal from "./NotificationsModal";
import ProfileModal from "./ProfileModal";
import MessengerModal from "./MessengerModal";
import UserProfileModal from "./UserProfileModal";
import { profileService } from "../services/profileService";
import axios from "axios";
import toast from "react-hot-toast";

const BACKEND_URL = "https://iryspinter.onrender.com";
const API = `${BACKEND_URL}/api`;

const Header = ({ onCreateClick, isWalletConnected, onConnectWallet, walletAddress, onSearch, onPinClick, onLogoClick }) => {
  const { address, isConnected, connectWallet, disconnectWallet } = useEthereumWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMessengerModal, setShowMessengerModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserAddress, setSelectedUserAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  // Загружаем баланс и уведомления при подключении кошелька
  useEffect(() => {
    if (address && isConnected) {
      loadBalance();
      loadUnreadNotifications();
    } else {
      setBalance(null);
      setUnreadNotifications(0);
    }
  }, [address, isConnected]);

  // Периодически обновляем уведомления
  useEffect(() => {
    if (address && isConnected) {
      const interval = setInterval(loadUnreadNotifications, 30000); // каждые 30 секунд
      return () => clearInterval(interval);
    }
  }, [address, isConnected]);

  const loadBalance = async () => {
    if (!address) return;
    
    try {
      const response = await axios.get(`${API}/user/balance/${address}`);
      setBalance(response.data.balance);
    } catch (error) {
      console.error("Error loading balance:", error);
      setBalance(null);
    }
  };

  const loadUnreadNotifications = async () => {
    if (!address) return;
    
    try {
      const response = await axios.get(`${API}/notifications/${address}/unread-count`);
      setUnreadNotifications(response.data.unreadCount);
    } catch (error) {
      console.error("Error loading unread notifications:", error);
      setUnreadNotifications(0);
    }
  };

  const handleConnectWallet = async () => {
    // Если уже подключен, сначала отключаем
    if (isConnected) {
      console.log("Disconnecting current wallet before connecting new one...");
      await disconnectWallet();
      // Добавляем задержку
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setShowWalletModal(true);
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
    setShowUserMenu(false);
  };

  const formatAddress = (addr) => {
    if (!addr) return "";
    if (addr.length <= 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-gradient-to-r from-white/90 via-white/95 to-white/90 backdrop-blur-xl border-b border-gray-200/50 px-4 py-4 shadow-lg shadow-gray-900/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo - Left */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={onLogoClick}
              className="flex items-center cursor-pointer hover:opacity-80 transition-all duration-200 transform hover:scale-105 group"
              title="Go to Home"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden group-hover:shadow-lg transition-shadow duration-200">
                <img 
                  src="/images/logo.png" 
                  alt="IrysPinter Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900 group-hover:text-[#51FED6] transition-colors duration-200">
                IrysPinter
              </span>
            </button>
          </div>

          {/* Search Bar - Center */}
          <div className="flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Pins"
                  className="w-full pl-12 pr-20 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#51FED6] focus:border-[#51FED6] focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#51FED6] hover:bg-[#4AE8C7] text-gray-900 px-4 py-1.5 rounded-full font-medium transition-all duration-200 text-sm"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Actions - Right */}
          <div className="flex items-center space-x-4 ml-8">
            {isConnected ? (
              <>
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 px-4 py-2.5 rounded-full transition-all duration-200 border border-gray-200"
                  >
                    <div className="w-8 h-8 bg-[#51FED6] rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-900" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-mono text-sm text-gray-700 max-w-[120px] truncate">
                        {formatAddress(address)}
                      </span>
                      {balance !== null && (
                        <span className="text-xs text-gray-500">
                          {balance} ETH
                        </span>
                      )}
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">Connected Wallet</p>
                        <p className="text-xs text-gray-500 font-mono break-all">{address}</p>
                      </div>
                      
                      <div className="py-1">
                        <button 
                          onClick={handleDisconnect}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Disconnect</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="bg-[#51FED6] hover:bg-[#4AE8C7] text-gray-900 px-6 py-2.5 rounded-full font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Wallet className="w-5 h-5" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </header>

            {/* Wallet Connect Modal */}
      <WalletConnectModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        onNotificationRead={loadUnreadNotifications}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Messenger Modal */}
      <MessengerModal
        isOpen={showMessengerModal}
        onClose={() => setShowMessengerModal(false)}
        onPinClick={(pinId) => {
          setShowMessengerModal(false);
          if (onPinClick) {
            onPinClick(pinId);
          }
        }}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showUserProfileModal}
        onClose={() => setShowUserProfileModal(false)}
        userAddress={selectedUserAddress}
      />

      {/* Floating Vertical Navigation - только когда кошелек подключен */}
      {isConnected && (
        <>
          {/* Боковая панель в стиле верхней панели */}
          <div className="fixed top-0 right-0 bottom-0 w-20 bg-gradient-to-b from-white/90 via-white/95 to-white/90 backdrop-blur-xl border-l border-gray-200/50 shadow-lg shadow-gray-900/5 z-30">
            <div className="flex flex-col items-center py-6 space-y-4 mt-20">
            {/* Create Pin Button - главная кнопка */}
            <button
              onClick={onCreateClick}
              className="bg-gradient-to-br from-[#51FED6] to-[#4AE8C7] hover:from-[#4AE8C7] hover:to-[#51FED6] text-gray-900 p-4 rounded-2xl font-semibold transition-all duration-300 shadow-2xl hover:shadow-[#51FED6]/25 transform hover:scale-110 hover:-translate-y-1 border border-white/20"
              title="Create Pin"
            >
              <Plus className="w-6 h-6" />
            </button>

            {/* Messages Button */}
            <button
              onClick={() => setShowMessengerModal(true)}
              className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-[#51FED6] p-4 rounded-2xl font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl border border-gray-200/50 hover:border-[#51FED6]/30 transform hover:scale-105 hover:-translate-y-1"
              title="Messages"
            >
              <MessageCircle className="w-5 h-5" />
            </button>

            {/* Notifications Button */}
            <button
              onClick={() => setShowNotificationsModal(true)}
              className="relative bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-[#51FED6] p-4 rounded-2xl font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl border border-gray-200/50 hover:border-[#51FED6]/30 transform hover:scale-105 hover:-translate-y-1"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg border-2 border-white animate-pulse">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </div>
              )}
            </button>

            {/* Profile Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-[#51FED6] p-4 rounded-2xl font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl border border-gray-200/50 hover:border-[#51FED6]/30 transform hover:scale-105 hover:-translate-y-1"
              title="Profile"
            >
              <Home className="w-5 h-5" />
            </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
