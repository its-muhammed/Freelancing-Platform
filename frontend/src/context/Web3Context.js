import React, { createContext, useState, useEffect } from "react";
import Web3 from "web3";

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
      window.ethereum.request({ method: "eth_requestAccounts" }).then((accounts) => {
        setAccount(accounts[0]);
      });
    } else {
      console.log("MetaMask not detected");
    }
  }, []);

  return (
    <Web3Context.Provider value={{ web3, account }}>
      {children}
    </Web3Context.Provider>
  );
};
