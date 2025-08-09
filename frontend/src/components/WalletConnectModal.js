import React, { useState } from "react";
import { Wallet, Shield, Zap, X, CheckCircle, AlertCircle, Download } from "lucide-react";
import { useEthereumWallet } from "../contexts/EthereumWalletProvider";
import { MetaMaskLogo, RabbyLogo, WalletConnectLogo } from "./WalletIcons";
import toast from "react-hot-toast";

const WalletConnectModal = ({ isOpen, onClose }) => {
  const { connectWallet, isConnected } = useEthereumWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async (walletType) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Показываем пользователю, какой кошелек подключается
      const walletName = wallets.find(w => w.id === walletType)?.name || walletType;
      console.log(`Connecting to ${walletName}...`);
      
      // Добавляем небольшую задержку для очистки состояния
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await connectWallet(walletType);
      onClose();
    } catch (err) {
      console.error("Wallet connection error:", err);
      
      let errorMessage = "Failed to connect wallet";
      
      if (err.message.includes("MetaMask not found")) {
        errorMessage = "MetaMask not found. Please install MetaMask extension.";
      } else if (err.message.includes("Failed to connect MetaMask")) {
        errorMessage = "Failed to connect MetaMask. Please check if wallet is unlocked.";
      } else if (err.message.includes("Rabby Wallet not found")) {
        errorMessage = "Rabby Wallet not found. Please install Rabby Wallet extension.";
      } else if (err.message.includes("Failed to connect Rabby Wallet")) {
        errorMessage = "Failed to connect Rabby Wallet. Please check if wallet is unlocked.";
      } else if (err.message.includes("Failed to connect via WalletConnect")) {
        errorMessage = "WalletConnect connection failed. Please try again or use another wallet.";
      } else if (err.message.includes("Connection timeout")) {
        errorMessage = "Connection timeout. Please try again.";
      } else if (err.message.includes("User rejected")) {
        errorMessage = "Connection was cancelled by user.";
      } else if (err.message.includes("User denied")) {
        errorMessage = "Connection was denied by user.";
      } else if (err.message.includes("Already processing")) {
        errorMessage = "Wallet connection already in progress. Please wait.";
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const wallets = [
    {
      id: "metamask",
      name: "MetaMask",
      description: "Most popular Ethereum wallet",
      icon: MetaMaskLogo,
      installUrl: "https://metamask.io/download/"
    },
    {
      id: "rabby",
      name: "Rabby Wallet",
      description: "Secure DeFi wallet with built-in protection",
      icon: RabbyLogo,
      installUrl: "https://rabby.io/"
    },
    {
      id: "walletconnect",
      name: "WalletConnect",
      description: "Connect any wallet via QR code",
      icon: WalletConnectLogo,
      installUrl: null
    }
  ];

  const handleWalletClick = (wallet) => {
    if (isConnecting) {
      return; // Предотвращаем повторные клики
    }
    
    // Проверяем, установлен ли MetaMask или Rabby Wallet
    if ((wallet.id === "metamask" || wallet.id === "rabby") && typeof window.ethereum === 'undefined') {
      setError(`Please install ${wallet.name} first.`);
      return;
    }
    
    handleConnect(wallet.id);
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
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#51FED6] rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-gray-900" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Connect Wallet</h2>
              <p className="text-sm text-gray-600">Choose your wallet to connect</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 animate-pulse">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Wallet Options */}
          <div className="space-y-3 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose your wallet</h3>
            
            {wallets.map((wallet, index) => {
              const IconComponent = wallet.icon;
              return (
                <div key={wallet.id} className="space-y-2" style={{ animationDelay: `${index * 100}ms` }}>
                  <button
                    onClick={() => handleWalletClick(wallet)}
                    disabled={isConnecting}
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 flex items-center space-x-3 disabled:opacity-50 transform hover:scale-[1.02] animate-fade-in-up"
                  >
                    <div className="w-10 h-10 flex items-center justify-center">
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-gray-900">{wallet.name}</p>
                      <p className="text-sm text-gray-600">{wallet.description}</p>
                    </div>
                    {isConnecting && (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </button>
                  
                  {/* Install Link for MetaMask and Rabby - показываем только если кошелек недоступен */}
                  {(wallet.id === "metamask" || wallet.id === "rabby") && (
                    <div className="flex items-center justify-between px-2">
                      <span className="text-xs text-gray-500">Don't have {wallet.name}?</span>
                      <button
                        onClick={() => window.open(wallet.installUrl, '_blank')}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>Install</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Loading State */}
          {isConnecting && (
            <div className="mt-4 p-4 bg-[#51FED6]/10 rounded-lg flex items-center space-x-3 animate-pulse">
              <div className="w-5 h-5 border-2 border-[#51FED6] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-700 font-medium">Connecting wallet...</span>
            </div>
          )}

          {/* Info */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              By connecting your wallet, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletConnectModal;