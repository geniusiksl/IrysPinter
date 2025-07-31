import React from "react";

// Логотипы кошельков
export const MetaMaskLogo = ({ className = "w-6 h-6" }) => (
  <img 
    src="/images/metamask-logo.png" 
    alt="MetaMask" 
    className={className}
  />
);

export const RabbyLogo = ({ className = "w-6 h-6" }) => (
  <img 
    src="/images/rabby-logo.png" 
    alt="Rabby Wallet" 
    className={className}
  />
);

export const WalletConnectLogo = ({ className = "w-6 h-6" }) => (
  <img 
    src="/images/walletconnect-logo.png" 
    alt="WalletConnect" 
    className={className}
  />
);