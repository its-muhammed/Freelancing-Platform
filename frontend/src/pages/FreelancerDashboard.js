import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Web3Context } from "../context/Web3Context";
import axios from "axios";

export default function FreelancerDashboard() {
  const web3Context = useContext(Web3Context);
  const { account } = web3Context || { account: "" };
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState({
    name: "Freelancer Name",
    completedJobs: 0,
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
        const response = await axios.get(`http://localhost:5000/api/profiles/freelancers/${account}`);
        setProfile(response.data || { name: "New Freelancer", completedJobs: 0, rating: 0 });
      } catch (error) {
        console.error("Error fetching profile:", error);
        if (error.response && error.response.status === 404) {
          setError("Profile not found. Please set up your profile.");
          setProfile({ name: account ? "New Freelancer" : "Unknown", completedJobs: 0, rating: 0 });
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

  // FreelancerNavbar Component with Profile button added
  function FreelancerNavbar() {
    const formatAccount = (acc) =>
      acc && typeof acc === "string" ? `${acc.slice(0, 6)}...${acc.slice(-4)}` : "Not connected";

    return (
      <nav className="bg-slate-800 text-white p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Freelancer Portal</h1>
          <div className="flex items-center space-x-6">
            <span className="text-sm text-gray-300">{formatAccount(account)}</span>
            <button
              onClick={() => navigate("/freelancer-dashboard")}
              className="px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 transition"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/available-tasks")}
              className="px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 transition"
            >
              Available Tasks
            </button>
            <button
              onClick={() => navigate("/ongoing-tasks")}
              className="px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 transition"
            >
              Ongoing Tasks
            </button>
            <button
              onClick={() => navigate("/freelancer-profile")}
              className="px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 transition"
            >
              Profile
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // FreelancerFooter Component
  function FreelancerFooter() {
    return (
      <footer className="bg-slate-800 text-white p-4 text-center">
        <p className="text-sm">© 2025 Freelancer Portal. Built for Freelancers, by Freelancers.</p>
      </footer>
    );
  }

  return (
    <div className="bg-white">
      <FreelancerNavbar />

      <main className="max-w-7xl mx-auto px-4 py-8 min-h-screen bg-gray-100">
        {!account ? (
          <div className="text-center bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">
              {error || "Please connect your wallet to access the dashboard."}
            </p>
            <button
              onClick={handleConnectWallet}
              disabled={isLoading}
              className={`bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 transition ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        ) : isLoading ? (
          <div className="text-center">
            <p className="text-gray-600">Loading dashboard...</p>
            <div className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mt-4"></div>
          </div>
        ) : error ? (
          <p className="text-center text-red-600 bg-red-50 p-4 rounded-lg mb-4">{error}</p>
        ) : (
          <>
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{profile.name}</h3>
              <p className="text-sm text-gray-600">Wallet: {formatString(account)}</p>
              <p className="text-sm text-gray-600">
                Jobs: {profile.completedJobs} | Rating: {profile.rating.toFixed(1)}/5
              </p>
              <button
                onClick={() => navigate("/freelancer-profile")}
                className="mt-4 bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
              >
                View Profile
              </button>
            </div>
            <div className="mt-12">
              <h2 className="text-2xl font-semibold text-center mb-8 text-gray-900">
                Find & Manage Work
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <button
                  onClick={() => navigate("/available-tasks")}
                  className="bg-teal-600 text-white px-6 py-3 rounded-md shadow-md hover:bg-teal-700 transition text-center"
                >
                  View Available Tasks
                </button>
                <button
                  onClick={() => navigate("/ongoing-tasks")}
                  className="bg-teal-600 text-white px-6 py-3 rounded-md shadow-md hover:bg-teal-700 transition text-center"
                >
                  Ongoing Tasks
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <FreelancerFooter />
    </div>
  );
}