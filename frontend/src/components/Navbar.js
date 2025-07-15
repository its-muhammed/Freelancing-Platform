import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Web3Context } from "../context/Web3Context";

export default function Navbar() {
  const web3Context = useContext(Web3Context);
  const { account } = web3Context || { account: "" };
  const navigate = useNavigate();

  const handleConnectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log("Wallet connection requested");
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("MetaMask not detected.");
    }
  };

  const formatAddress = (address) => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
  };

  return (
    <nav className="fixed top-0 w-full bg-slate-800 text-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center">
            <h1
              className="text-2xl font-bold tracking-tight cursor-pointer hover:text-gray-300 transition"
              onClick={() => navigate("/")}
            >
              FreeWork
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => navigate("/")}
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition"
            >
              Home
            </button>
            <button
              onClick={() => navigate("/client-dashboard")}
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/manage-bids")}
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition"
            >
              Manage Bids
            </button>
            <button
              onClick={() => navigate("/manage-tasks")}
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition"
            >
              Manage Tasks
            </button>

            {/* Wallet Connection */}
            {account ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">Connected: {formatAddress(account)}</span>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="bg-teal-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-700 transition"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}