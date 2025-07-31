import React, { useState, useEffect } from "react";
import { Coins, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useEthereumWallet } from "../contexts/EthereumWalletProvider";
import { ethers } from "ethers";

const WalletBalance = () => {
  const { provider, address, isConnected } = useEthereumWallet();
  const [balance, setBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const fetchBalance = async () => {
    if (!provider || !address) return;
    
    setIsLoading(true);
    try {
      const balanceWei = await provider.getBalance(address);
      const balanceEth = ethers.utils.formatEther(balanceWei);
      setBalance(parseFloat(balanceEth));
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && provider && address) {
      fetchBalance();
      
      // Refresh balance every 30 seconds
      const interval = setInterval(fetchBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [provider, address, isConnected]);

  if (!isConnected || !address) return null;

  const formatBalance = (bal) => {
    if (bal === null) return "0.00";
    return bal.toFixed(4);
  };

  const getBalanceColor = (bal) => {
    if (bal === null) return "text-gray-400";
    if (bal < 0.01) return "text-red-500";
    if (bal < 0.1) return "text-yellow-500";
    return "text-green-500";
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
            <Coins className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Wallet Balance</p>
            <p className="text-xs text-gray-500 font-mono">{address.slice(0, 6)}...{address.slice(-4)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {showBalance ? (
              <EyeOff className="w-4 h-4 text-gray-500" />
            ) : (
              <Eye className="w-4 h-4 text-gray-500" />
            )}
          </button>
          
          <button
            onClick={fetchBalance}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {/* ETH Balance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">ETH</span>
          </div>
          <div className="flex items-center space-x-1">
            {showBalance ? (
              <span className={`font-mono font-semibold ${getBalanceColor(balance)}`}>
                {isLoading ? "..." : formatBalance(balance)}
              </span>
            ) : (
              <span className="font-mono font-semibold text-gray-400">••••</span>
            )}
          </div>
        </div>

        {/* Balance Status */}
        {balance !== null && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {balance < 0.01 ? (
              <div className="flex items-center space-x-2 text-xs text-red-600">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                <span>Low balance - Add ETH for transactions</span>
              </div>
            ) : balance < 0.1 ? (
              <div className="flex items-center space-x-2 text-xs text-yellow-600">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                <span>Moderate balance</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-xs text-green-600">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>Good balance for transactions</span>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => window.open(`https://arbiscan.io/address/${address}`, '_blank')}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 px-2 rounded-lg transition-colors"
            >
              View on Arbiscan
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(address)}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 px-2 rounded-lg transition-colors"
            >
              Copy Address
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletBalance; 