import React, { createContext, useContext, useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import {
  WalletProvider,
  useWallet,
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
require('@solana/wallet-adapter-react-ui/styles.css');

const SolanaWalletContext = createContext();

export const useSolanaWallet = () => {
  const context = useContext(SolanaWalletContext);
  if (!context) {
    throw new Error('useSolanaWallet must be used within a SolanaWalletProvider');
  }
  return context;
};

const SolanaWalletProvider = ({ children }) => {
  const [network, setNetwork] = useState(WalletAdapterNetwork.Devnet);
  const [endpoint, setEndpoint] = useState(clusterApiUrl(WalletAdapterNetwork.Devnet));

  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new BackpackWalletAdapter(),
  ];

  const connection = new Connection(endpoint, 'confirmed');

  const value = {
    connection,
    network,
    setNetwork,
    endpoint,
    setEndpoint,
  };

  return (
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <SolanaWalletContext.Provider value={value}>
          {children}
        </SolanaWalletContext.Provider>
      </WalletModalProvider>
    </WalletProvider>
  );
};

export default SolanaWalletProvider; 