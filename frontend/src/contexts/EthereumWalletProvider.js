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
    infuraId: "762f3049a4ce44d4887f9ba4eb411a23",
    chainId: 42161 // Arbitrum One
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
    web3Modal = new Web3Modal({
      cacheProvider: true, // Включаем кэширование для сохранения состояния
      providerOptions,
      theme: "light",
      accentColor: "red",
      overlayClassName: "web3modal-overlay",
      disableInjectedProvider: false,
      network: "arbitrum"
    });

    // Автоматически восстанавливаем подключение при загрузке
    const restoreConnection = async () => {
      try {
        // Проверяем, есть ли сохраненный провайдер в Web3Modal
        if (web3Modal.cachedProvider) {
          console.log("Restoring cached provider connection...");
          
          // Проверяем, подключен ли MetaMask
          if (typeof window.ethereum !== 'undefined' && window.ethereum.isConnected()) {
            try {
              // Запрашиваем аккаунты
              const accounts = await window.ethereum.request({ method: 'eth_accounts' });
              if (accounts && accounts.length > 0) {
                console.log("MetaMask is connected with accounts:", accounts);
                
                const instance = await web3Modal.connect();
                const ethersProvider = new ethers.providers.Web3Provider(instance);
                const signer = ethersProvider.getSigner();
                const address = await signer.getAddress();
                
                setProvider(ethersProvider);
                setSigner(signer);
                setAddress(address);
                setIsConnected(true);
                console.log("Connection restored successfully");
                return;
              }
            } catch (error) {
              console.log("MetaMask connection check failed:", error);
            }
          }
          
          // Если MetaMask не подключен, пытаемся восстановить через Web3Modal
          const instance = await web3Modal.connect();
          const ethersProvider = new ethers.providers.Web3Provider(instance);
          const signer = ethersProvider.getSigner();
          const address = await signer.getAddress();
          
          setProvider(ethersProvider);
          setSigner(signer);
          setAddress(address);
          setIsConnected(true);
          console.log("Connection restored successfully via Web3Modal");
        } else {
          // Проверяем localStorage для дополнительной проверки
          const savedWalletType = localStorage.getItem('connectedWalletType');
          const savedAddress = localStorage.getItem('walletAddress');
          
          if (savedWalletType && savedAddress && typeof window.ethereum !== 'undefined') {
            console.log("Found saved wallet connection in localStorage");
            
            try {
              // Проверяем, подключен ли MetaMask
              const accounts = await window.ethereum.request({ method: 'eth_accounts' });
              if (accounts && accounts.length > 0 && accounts[0].toLowerCase() === savedAddress.toLowerCase()) {
                console.log("MetaMask is connected with saved account");
                
                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const address = await signer.getAddress();
                
                setProvider(provider);
                setSigner(signer);
                setAddress(address);
                setIsConnected(true);
                console.log("Connection restored from localStorage");
                return;
              }
            } catch (error) {
              console.log("Failed to restore from localStorage:", error);
            }
          }
        }
      } catch (error) {
        console.error("Failed to restore connection:", error);
        // Очищаем кэш если восстановление не удалось
        try {
          await web3Modal.clearCachedProvider();
          localStorage.removeItem('connectedWalletType');
          localStorage.removeItem('walletAddress');
        } catch (clearError) {
          console.error("Failed to clear cached provider:", clearError);
        }
      }
    };

    // Добавляем небольшую задержку для стабильности
    setTimeout(restoreConnection, 100);

    // Добавляем слушатели событий MetaMask
    const handleAccountsChanged = async (accounts) => {
      console.log("Accounts changed:", accounts);
      if (accounts.length === 0) {
        // Пользователь отключил кошелек
        setProvider(null);
        setSigner(null);
        setAddress(null);
        setIsConnected(false);
        localStorage.removeItem('connectedWalletType');
        localStorage.removeItem('walletAddress');
      } else {
        // Обновляем адрес
        setAddress(accounts[0]);
        localStorage.setItem('walletAddress', accounts[0]);
      }
    };

    const handleChainChanged = () => {
      // Перезагружаем страницу при смене сети
      window.location.reload();
    };

    const handleConnect = async (connectInfo) => {
      console.log("Wallet connected:", connectInfo);
      // Обновляем состояние подключения
      if (web3Modal.cachedProvider) {
        try {
          const instance = await web3Modal.connect();
          const ethersProvider = new ethers.providers.Web3Provider(instance);
          const signer = ethersProvider.getSigner();
          const address = await signer.getAddress();
          
          setProvider(ethersProvider);
          setSigner(signer);
          setAddress(address);
          setIsConnected(true);
          
          // Сохраняем информацию о подключении
          localStorage.setItem('connectedWalletType', 'metamask');
          localStorage.setItem('walletAddress', address);
        } catch (error) {
          console.error("Failed to restore connection on connect:", error);
        }
      }
    };

    const handleDisconnect = () => {
      console.log("Wallet disconnected");
      setProvider(null);
      setSigner(null);
      setAddress(null);
      setIsConnected(false);
      localStorage.removeItem('connectedWalletType');
      localStorage.removeItem('walletAddress');
    };

    // Добавляем слушатели событий
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('connect', handleConnect);
      window.ethereum.on('disconnect', handleDisconnect);
    }

    // Очистка слушателей при размонтировании
    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('connect', handleConnect);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
    // eslint-disable-next-line
  }, []);

  const connectWallet = async (walletType = null) => {
    try {
      // Очищаем предыдущее состояние перед новым подключением
      setProvider(null);
      setSigner(null);
      setAddress(null);
      setIsConnected(false);
      
      // Очищаем кэш Web3Modal только если это принудительное новое подключение
      if (web3Modal && !web3Modal.cachedProvider && walletType) {
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
      
      // Just get network info without any messages
      const network = await ethersProvider.getNetwork();
      console.log(`Connected to network ${network.name} (chainId: ${network.chainId})`);
      
      setProvider(ethersProvider);
      const signer = ethersProvider.getSigner();
      setSigner(signer);
      const address = await signer.getAddress();
      setAddress(address);
      setIsConnected(true);
      
      // Сохраняем информацию о подключении
      localStorage.setItem('connectedWalletType', walletType || 'metamask');
      localStorage.setItem('walletAddress', address);
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
    
    // Очищаем состояние
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setIsConnected(false);
    
    // Очищаем сохраненную информацию о кошельке
    localStorage.removeItem('connectedWalletType');
    localStorage.removeItem('walletAddress');
    
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