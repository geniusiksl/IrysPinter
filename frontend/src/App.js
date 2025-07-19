import React from "react";
import "./App.css";
import { Toaster } from "react-hot-toast";
import PinterestApp from "./components/PinterestApp";

function App() {
  return (
    <div className="App">
      <PinterestApp />
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;