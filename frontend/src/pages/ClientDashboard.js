import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Web3Context } from "../context/Web3Context";
import Layout from "../components/Layout";

export default function ClientDashboard() {
  const web3Context = useContext(Web3Context);
  const { account } = web3Context || { account: "" };
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!account) {
      setError("Please connect your wallet to access the dashboard.");
    }
  }, [account]);

  const handleConnectWallet = async () => {
    if (window.ethereum) {
      setIsLoading(true);
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        setError(null);
      } catch (error) {
        console.error("Error connecting wallet:", error);
        setError("Failed to connect wallet: " + error.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("MetaMask is not installed. Please install it to continue.");
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6 rounded-lg mb-6 shadow-md">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Client Dashboard</h2>
            <button
              onClick={() => navigate("/profile")}
              className="bg-white text-blue-700 px-4 py-2 rounded-md hover:bg-gray-100 transition"
            >
              Profile
            </button>
          </div>
        </header>

        {!account ? (
          <div className="text-center bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">
              {error || "Please connect your wallet to access the dashboard."}
            </p>
            <button
              onClick={handleConnectWallet}
              disabled={isLoading}
              className={`bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        ) : isLoading ? (
          <div className="text-center">
            <p className="text-gray-600">Loading dashboard...</p>
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mt-4"></div>
          </div>
        ) : error ? (
          <p className="text-center text-red-600 bg-red-50 p-4 rounded-lg mb-4">{error}</p>
        ) : (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-center mb-8 text-gray-900">
              Manage Your Work
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <button
                onClick={() => navigate("/post-task")}
                className="bg-green-600 text-white px-6 py-3 rounded-md shadow-md hover:bg-green-700 transition text-center"
              >
                Post a Task
              </button>
              <button
                onClick={() => navigate("/manage-tasks")}
                className="bg-blue-600 text-white px-6 py-3 rounded-md shadow-md hover:bg-blue-700 transition text-center"
              >
                View & Manage Tasks
              </button>
              <button
                onClick={() => navigate("/manage-bids")}
                className="bg-yellow-600 text-white px-6 py-3 rounded-md shadow-md hover:bg-yellow-700 transition text-center"
              >
                View Bids
              </button>
              <button
                onClick={() => navigate("/")}
                className="bg-red-600 text-white px-6 py-3 rounded-md shadow-md hover:bg-red-700 transition text-center"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}