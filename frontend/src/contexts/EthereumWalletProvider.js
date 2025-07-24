import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { Web3ReactProvider, useWeb3React } from '@web3-react/core';
import { Injected } from '@web3-react/injected-v6';
import { WalletConnect } from '@web3-react/walletconnect-v2';

const injected = new Injected();
// Для WalletConnect нужен projectId (получить на https://cloud.walletconnect.com/)
const walletconnect = new WalletConnect({
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: [1, 42161], // Ethereum Mainnet и Arbitrum
  showQrModal: true,
});

const EthereumWalletContext = createContext(null);

export const useEthereumWallet = () => useContext(EthereumWalletContext);

function getLibrary(provider) {
  return new ethers.providers.Web3Provider(provider);
}

export default function EthereumWalletProvider({ children }) {
  return (
    <Web3ReactProvider getLibrary={getLibrary} connectors={[[injected], [walletconnect]]}>
      <EthereumWalletInner>{children}</EthereumWalletInner>
    </Web3ReactProvider>
  );
}

function EthereumWalletInner({ children }) {
  const { account, provider, connector, isActive, connect, disconnect } = useWeb3React();
  const [signer, setSigner] = useState(null);

  useEffect(() => {
    if (provider && typeof provider.getSigner === 'function') {
      try {
        const newSigner = provider.getSigner();
        setSigner(newSigner);
      } catch (error) {
        console.error('Error getting signer:', error);
        setSigner(null);
      }
    } else {
      setSigner(null);
    }
  }, [provider]);

  const connectWallet = useCallback(async () => {
    try {
      await connect(injected);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }, [connect]);

  const disconnectWallet = useCallback(() => {
    try {
      disconnect();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }, [disconnect]);

  return (
    <EthereumWalletContext.Provider
      value={{
        address: account || null,
        isConnected: isActive || false,
        provider: provider || null,
        signer,
        connectWallet,
        disconnectWallet
      }}
    >
      {children}
    </EthereumWalletContext.Provider>
  );
} 