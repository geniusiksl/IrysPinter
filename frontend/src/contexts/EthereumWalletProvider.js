import React, { createContext, useContext, useState, useEffect } from "react";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers } from "ethers";

const EthereumWalletContext = createContext(null);
export const useEthereumWallet = () => useContext(EthereumWalletContext);

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: "YOUR_INFURA_ID" // Получи на https://infura.io/
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
      providerOptions
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
      setProvider(ethersProvider);
      const signer = ethersProvider.getSigner();
      setSigner(signer);
      const address = await signer.getAddress();
      setAddress(address);
      setIsConnected(true);
    } catch (e) {
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

  return (
    <EthereumWalletContext.Provider
      value={{
        address,
        isConnected,
        provider,
        signer,
        connectWallet,
        disconnectWallet
      }}
    >
      {children}
    </EthereumWalletContext.Provider>
  );
} 