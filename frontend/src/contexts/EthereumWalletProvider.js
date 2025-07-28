import React, { createContext, useContext, useState, useEffect } from "react";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers } from "ethers";

// Альтернативная конфигурация для WalletConnect
const createWalletConnectProvider = () => {
  return new WalletConnectProvider({
    rpc: {
      42161: "https://arb1.arbitrum.io/rpc",
      1: "https://mainnet.infura.io/v3/762f3049a4ce44d4887f9ba4eb411a23"
    },
    chainId: 42161,
    qrcode: false,
    pollingInterval: 15000,
    bridge: "https://bridge.walletconnect.org",
    clientMeta: {
      name: "IrysPinter",
      description: "Decentralized Pinterest on Irys",
      url: window.location.origin,
      icons: []
    },
    infuraId: "762f3049a4ce44d4887f9ba4eb411a23"
  });
};

const EthereumWalletContext = createContext(null);
export const useEthereumWallet = () => useContext(EthereumWalletContext);

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      rpc: {
        42161: "https://arb1.arbitrum.io/rpc",
        1: "https://mainnet.infura.io/v3/762f3049a4ce44d4887f9ba4eb411a23"
      },
      chainId: 42161,
      qrcode: false,
      pollingInterval: 15000,
      bridge: "https://bridge.walletconnect.org",
      clientMeta: {
        name: "IrysPinter",
        description: "Decentralized Pinterest on Irys",
        url: window.location.origin,
        icons: []
      },
      infuraId: "762f3049a4ce44d4887f9ba4eb411a23"
    }
  }
};

let web3Modal;

export default function EthereumWalletProvider({ children }) {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    web3Modal = new Web3Modal({
      cacheProvider: true,
      providerOptions,
      theme: "light",
      accentColor: "red",
      overlayClassName: "web3modal-overlay",
      disableInjectedProvider: false,
      network: "arbitrum"
    });
    if (web3Modal.cachedProvider) {
      connectWallet();
    }
    // eslint-disable-next-line
  }, []);

  const connectWallet = async () => {
    try {
      const instance = await web3Modal.connect();
      const ethersProvider = new ethers.providers.Web3Provider(instance);
      
      // Проверяем и переключаем на Arbitrum
      const network = await ethersProvider.getNetwork();
      if (network.chainId !== 42161) { // Arbitrum One
        try {
          // Пытаемся переключиться на Arbitrum
          await instance.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xa4b1' }], // Arbitrum One chainId в hex
          });
        } catch (switchError) {
          // Если сеть не добавлена, добавляем её
          if (switchError.code === 4902) {
            await instance.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xa4b1',
                chainName: 'Arbitrum One',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://arb1.arbitrum.io/rpc'],
                blockExplorerUrls: ['https://arbiscan.io']
              }]
            });
          }
        }
      }
      
      setProvider(ethersProvider);
      const signer = ethersProvider.getSigner();
      setSigner(signer);
      const address = await signer.getAddress();
      setAddress(address);
      setIsConnected(true);
    } catch (e) {
      console.error("Wallet connection error:", e);
      setIsConnected(false);
    }
  };

  const disconnectWallet = async () => {
    if (web3Modal) await web3Modal.clearCachedProvider();
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setIsConnected(false);
  };

  const checkNetwork = async () => {
    if (provider) {
      try {
        const network = await provider.getNetwork();
        if (network.chainId !== 42161) {
          console.warn("Please switch to Arbitrum network");
          return false;
        }
        return true;
      } catch (error) {
        console.error("Network check error:", error);
        return false;
      }
    }
    return false;
  };

  return (
    <EthereumWalletContext.Provider
      value={{
        address,
        isConnected,
        provider,
        signer,
        connectWallet,
        disconnectWallet,
        checkNetwork
      }}
    >
      {children}
    </EthereumWalletContext.Provider>
  );
} 