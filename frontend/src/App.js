import React from "react";
import "./App.css";
import { Toaster } from "react-hot-toast";
import PinterestApp from "./components/PinterestApp";
import EthereumWalletProvider from "./contexts/EthereumWalletProvider";

function App() {
  return (
    <EthereumWalletProvider>
      <div className="App">
        <PinterestApp />
        <Toaster position="bottom-right" />
      </div>
    </EthereumWalletProvider>
  );
}

export default App;