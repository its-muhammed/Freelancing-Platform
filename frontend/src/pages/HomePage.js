// src/pages/Home.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";
const HomePage = () => {
const navigate = useNavigate();
  return (
    <div className="container">
      <header className="header">FreeWork</header>
      <main className="main-content">
        <h1>FreeWork</h1>
        <p>Blockchain-based decentralized freelancing platform.</p>
        <a href="https://metamask.io/download/" className="metamask-link" target="_blank" rel="noopener noreferrer">
          Download MetaMask
        </a>
        <button className="signup-button" onClick={() => navigate("/signup")}>Sign Up</button>
      </main>
      <footer className="footer">&copy; 2025 FreeWork</footer>
    </div>
  );
};

export default HomePage;