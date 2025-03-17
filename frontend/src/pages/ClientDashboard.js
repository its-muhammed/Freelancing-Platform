import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Web3Context } from "../context/Web3Context";
import Layout from "../components/Layout";
import axios from "axios";

export default function ClientDashboard() {
  const web3Context = useContext(Web3Context);
  const { account } = web3Context || { account: "" };
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    name: "New Client",
    totalSpent: 0,
    rating: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!account) {
      setError("Please connect your wallet to access the dashboard.");
      return;
    }
    async function fetchProfile() {
      try {
        const response = await axios.get(`http://localhost:5000/api/profiles/clients/${account}`);
        setProfile(response.data || {
          name: "New Client",
          totalSpent: 0,
          rating: 0,
        });
        setError(null); // Clear error if fetch is successful
      } catch (error) {
        console.error("Error fetching profile:", error);
        if (error.response && error.response.status === 404) {
          setError("Profile not found. Please set up your profile.");
          setProfile({
            name: account ? "New Client" : "Unknown",
            totalSpent: 0,
            rating: 0,
          });
        } else {
          setError("Failed to fetch profile: " + error.message);
        }
      }
    }
    fetchProfile();
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

  const formatString = (str) =>
    str && typeof str === "string" ? `${str.slice(0, 6)}...${str.slice(-4)}` : "Not available";

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6 rounded-lg mb-6 shadow-md">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Client Dashboard</h2>
              <button
                onClick={() => navigate("/client-profile")}
                className="bg-white text-blue-700 px-4 py-2 rounded-md hover:bg-gray-100 transition"
              >
                Profile
              </button>
            </div>
            {/* Profile Card */}
            {account && error !== "Please connect your wallet to access the dashboard." && (
              <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4">
                <img
                  src={profile.profilePicture || "https://via.placeholder.com/50?text=Profile"}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{profile.name}</h3>
                  <p className="text-sm text-gray-600">Wallet: {formatString(account)}</p>
                  <p className="text-sm text-gray-600">
                    Spent: {profile.totalSpent} POL | Rating: {profile.rating.toFixed(1)}/5
                  </p>
                </div>
                <button
                  onClick={() => navigate("/client-profile")}
                  className="ml-auto bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition"
                >
                  View Full Profile
                </button>
              </div>
            )}
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
          <div className="text-center">
            <p className="text-red-600 bg-red-50 p-4 rounded-lg mb-4">{error}</p>
            {error === "Profile not found. Please set up your profile." && (
              <button
                onClick={() => navigate("/client-profile")}
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition"
              >
                Set Up Profile
              </button>
            )}
          </div>
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