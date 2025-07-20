import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const Header = ({ onCreateClick, onRoyaltyClick }) => {
  const { publicKey, connected } = useWallet();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">
              SolPinter
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {connected && (
            <>
              <button
                onClick={onCreateClick}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full font-semibold transition-colors flex items-center space-x-2"
              >
                <span>+</span>
                <span>Create Pin</span>
              </button>
              
              <button
                onClick={onRoyaltyClick}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full font-semibold transition-colors flex items-center space-x-2"
              >
                <span>💰</span>
                <span>Royalties</span>
              </button>
            </>
          )}
          
          {/* Solana Wallet Connection */}
          <WalletMultiButton className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full font-semibold transition-colors" />
          
          {connected && publicKey && (
            <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-full">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700 font-medium text-sm">
                {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)} (Connected)
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;