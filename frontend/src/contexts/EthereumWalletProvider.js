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
    qrcode: true, // Включаем QR код
    pollingInterval: 8000, // Уменьшаем интервал
    bridge: "https://bridge.walletconnect.org",
    clientMeta: {
      name: "IrysPinter",
      description: "Decentralized Pinterest on Irys",
      url: window.location.origin,
      icons: ["https://your-app-icon.png"] // Добавьте иконку вашего приложения
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
      qrcode: true,
      pollingInterval: 8000,
      bridge: "https://bridge.walletconnect.org",
      clientMeta: {
        name: "IrysPinter",
        description: "Decentralized Pinterest on Irys",
        url: window.location.origin,
        icons: ["https://your-app-icon.png"]
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
    // Очищаем предыдущие подключения при загрузке
    const clearPreviousConnections = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          // Пытаемся отключить все разрешения
          await window.ethereum.request({ 
            method: 'wallet_revokePermissions', 
            params: [{ eth_accounts: {} }] 
          });
        } catch (error) {
          console.log("Clear previous connections failed:", error);
        }
      }
    };
    
    clearPreviousConnections();
    
    web3Modal = new Web3Modal({
      cacheProvider: false, // Отключаем кэширование для предотвращения путаницы
      providerOptions,
      theme: "light",
      accentColor: "red",
      overlayClassName: "web3modal-overlay",
      disableInjectedProvider: false,
      network: "arbitrum"
    });
    // Убираем автоматическое подключение к кэшированному провайдеру
    // eslint-disable-next-line
  }, []);

  const connectWallet = async (walletType = null) => {
    try {
      // Очищаем предыдущее состояние перед новым подключением
      setProvider(null);
      setSigner(null);
      setAddress(null);
      setIsConnected(false);
      
      // Очищаем кэш Web3Modal для принудительного нового подключения
      if (web3Modal) {
        await web3Modal.clearCachedProvider();
      }
      
      let instance;
      
      if (walletType === "metamask") {
        // Подключение к MetaMask
        if (typeof window.ethereum !== 'undefined') {
          // Принудительно отключаем предыдущие подключения
          try {
            await window.ethereum.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
          } catch (error) {
            console.log("Permission request failed, continuing...");
          }
          
          instance = window.ethereum;
          // Запрашиваем подключение аккаунтов
          try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            console.log("MetaMask accounts:", accounts);
          } catch (error) {
            console.error("MetaMask connection error:", error);
            throw new Error("Failed to connect MetaMask. Please check if wallet is unlocked.");
          }
        } else {
          throw new Error("MetaMask not found. Please install MetaMask extension.");
        }
      } else if (walletType === "rabby") {
        // Подключение к Rabby Wallet
        if (typeof window.ethereum !== 'undefined') {
          // Принудительно отключаем предыдущие подключения
          try {
            await window.ethereum.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
          } catch (error) {
            console.log("Permission request failed, continuing...");
          }
          
          instance = window.ethereum;
          
          // Запрашиваем подключение аккаунтов
          try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            console.log("Rabby accounts:", accounts);
          } catch (error) {
            console.error("Rabby connection error:", error);
            throw new Error("Failed to connect Rabby Wallet. Please check if wallet is unlocked.");
          }
        } else {
          throw new Error("Rabby Wallet not found. Please install Rabby Wallet extension.");
        }
      } else if (walletType === "walletconnect") {
        // Подключение через WalletConnect
        try {
          const walletConnectProvider = createWalletConnectProvider();
          
          // Добавляем таймаут для подключения
          const connectionPromise = walletConnectProvider.enable();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Connection timeout")), 30000)
          );
          
          await Promise.race([connectionPromise, timeoutPromise]);
          instance = walletConnectProvider;
        } catch (error) {
          console.error("WalletConnect error:", error);
          throw new Error("Failed to connect via WalletConnect. Please try again.");
        }

      } else {
        // Используем Web3Modal для автоматического выбора
        instance = await web3Modal.connect();
      }

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
      
      // Сохраняем тип подключенного кошелька
      localStorage.setItem('connectedWalletType', walletType);
    } catch (e) {
      console.error("Wallet connection error:", e);
      setIsConnected(false);
      throw e;
    }
  };

  const disconnectWallet = async () => {
    console.log("Disconnecting wallet...");
    
    // Очищаем кэш Web3Modal
    if (web3Modal) {
      await web3Modal.clearCachedProvider();
    }
    
    // Отключаемся от текущего провайдера
    if (provider) {
      try {
        // Для WalletConnect
        if (provider.wc) {
          await provider.wc.killSession();
        }
        // Для других провайдеров
        if (provider.removeAllListeners) {
          provider.removeAllListeners();
        }
      } catch (error) {
        console.log("Provider disconnect error:", error);
      }
    }
    
    // Принудительно отключаем от ethereum
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Пытаемся отключить все разрешения
        await window.ethereum.request({ 
          method: 'wallet_revokePermissions', 
          params: [{ eth_accounts: {} }] 
        });
      } catch (error) {
        console.log("Revoke permissions failed:", error);
      }
    }
    
    // Очищаем состояние
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setIsConnected(false);
    
    // Очищаем сохраненный тип кошелька
    localStorage.removeItem('connectedWalletType');
    
    console.log("Wallet disconnected successfully");
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