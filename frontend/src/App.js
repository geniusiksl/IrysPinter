import React from "react";
import "./App.css";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BackpackWalletAdapter,
  GlowWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { useMemo } from "react";
import { Toaster } from "react-hot-toast";
import PinterestApp from "./components/PinterestApp";

// Import wallet adapter CSS
require("@solana/wallet-adapter-react-ui/styles.css");

function App() {
  // Use Solana mainnet
  const endpoint = "https://api.mainnet-beta.solana.com";

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new GlowWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="App">
            <PinterestApp />
            <Toaster position="bottom-right" />
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;