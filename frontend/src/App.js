import React from "react";
import "./App.css";
import { Toaster } from "react-hot-toast";
import PinterestApp from "./components/PinterestApp";
import SolanaWalletProvider from "./contexts/SolanaWalletProvider";

function App() {
  return (
    <SolanaWalletProvider>
      <div className="App">
        <PinterestApp />
        <Toaster position="bottom-right" />
      </div>
    </SolanaWalletProvider>
  );
}

export default App;