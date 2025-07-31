import React, { useState, useEffect } from "react";
import { useEthereumWallet } from "../contexts/EthereumWalletProvider";
import { Plus, Wallet, LogOut, User, Settings, Bell, Home } from "lucide-react";
import WalletConnectModal from "./WalletConnectModal";
import NotificationsModal from "./NotificationsModal";
import ProfileModal from "./ProfileModal";
import { profileService } from "../services/profileService";

const Header = ({ onCreateClick, isWalletConnected, onConnectWallet, walletAddress, onRoyaltyClick }) => {
  const { address, isConnected, connectWallet, disconnectWallet } = useEthereumWallet();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [balance, setBalance] = useState(null);

  // Загружаем баланс при подключении кошелька
  useEffect(() => {
    if (address && isConnected) {
      loadBalance();
    } else {
      setBalance(null);
    }
  }, [address, isConnected]);

  const loadBalance = async () => {
    if (!address) return;
    
    try {
      const balanceData = await profileService.getUserBalance(address);
      setBalance(balanceData);
    } catch (error) {
      console.error("Error loading balance:", error);
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

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
                <img 
                  src="/images/logo.png" 
                  alt="IrysPinter Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">
                IrysPinter
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <>
                {/* Create Pin Button */}
                <button
                  onClick={onCreateClick}
                  className="bg-[#51FED6] hover:bg-[#4AE8C7] text-gray-900 px-6 py-2.5 rounded-full font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Pin</span>
                </button>

                {/* Notifications Button */}
                <button
                  onClick={() => setShowNotificationsModal(true)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-full font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <Bell className="w-4 h-4" />
                  <span>Notifications</span>
                </button>

                {/* Profile Button */}
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-full font-semibold transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                >
                  <Home className="w-4 h-4" />
                  <span>Profile</span>
                </button>

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
                      {balance && (
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
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </button>
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
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

 
    </>
  );
};

export default Header;