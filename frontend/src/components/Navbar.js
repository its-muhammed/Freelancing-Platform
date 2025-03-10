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

  return (
    <nav className="fixed top-0 w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold tracking-tight">FreelancePro</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/")} // Using navigate here
              className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Home
            </button>
            <button
              onClick={() => navigate("/client-dashboard")} // Using navigate here
              className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/manage-bids")} // Using navigate here
              className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Manage Bids
            </button>
            <button
              onClick={() => navigate("/manage-tasks")} // Using navigate here
              className="hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
            >
              Manage Tasks
            </button>
            {account ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </div>
            ) : (
              <button
                onClick={handleConnectWallet}
                className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded-md text-sm"
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