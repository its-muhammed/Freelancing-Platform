import { createContext, useState, useEffect } from "react";
import { ethers } from "ethers";

export const Web3Context = createContext({
  provider: null,
  signer: null,
  account: "",
});

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");

  useEffect(() => {
    async function initWeb3() {
      if (!window.ethereum) {
        console.error("MetaMask not detected");
        return;
      }
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const chainId = await provider.getNetwork().then(net => net.chainId);

        if (chainId !== 80002n) {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x13882" }],
          });
        }

        setProvider(provider);
        setSigner(signer);
        setAccount(address);
        console.log("Web3 initialized:", { account: address, chainId });

        window.ethereum.on("accountsChanged", (accounts) => {
          const newAccount = accounts[0] || "";
          setAccount(newAccount);
          console.log("Account changed:", newAccount || "Disconnected");
        });
        window.ethereum.on("chainChanged", () => {
          console.log("Chain changed - reloading page");
          window.location.reload();
        });
      } catch (error) {
        console.error("Failed to initialize Web3:", error.message);
        setAccount("");
      }
    }
    initWeb3();
  }, []);

  return (
    <Web3Context.Provider value={{ provider, signer, account }}>
      {children}
    </Web3Context.Provider>
  );
};