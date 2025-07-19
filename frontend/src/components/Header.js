import React from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const Header = ({ onCreateClick, isWalletConnected }) => {
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
          {isWalletConnected && (
            <button
              onClick={onCreateClick}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full font-semibold transition-colors flex items-center space-x-2"
            >
              <span>+</span>
              <span>Create Pin</span>
            </button>
          )}
          <WalletMultiButton className="!bg-gray-100 !text-gray-900 hover:!bg-gray-200" />
        </div>
      </div>
    </header>
  );
};

export default Header;