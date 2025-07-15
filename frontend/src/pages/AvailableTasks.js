import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Web3Context } from "../context/Web3Context";
import { useNavigate } from "react-router-dom";

export default function AvailableTasks() {
  const web3Context = useContext(Web3Context);
  const { account } = web3Context || { account: "" };
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [bidTask, setBidTask] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const [selectedClient, setSelectedClient] = useState(null); // New state for client profile modal
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTasks() {
      if (!account) {
        setError("Please connect your wallet to view available tasks.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get("http://localhost:5000/api/tasks/freelancer-available", {
          params: { status: "Open" },
        });
        console.log("Fetched Tasks:", response.data);
        setTasks(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setError("Failed to fetch tasks: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }

    async function switchChainAndGetAccount() {
      if (window.ethereum) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x13882" }],
          });
          console.log("Switched to Polygon Amoy testnet");
        } catch (error) {
          console.error("Error switching chain:", error);
          setError("Failed to switch to Polygon Amoy testnet: " + error.message);
        }
      } else {
        setError("MetaMask is not installed. Please install it to continue.");
      }
    }

    switchChainAndGetAccount();
    fetchTasks();
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

  const handleBidSubmit = async (taskId) => {
    if (!bidAmount || !bidMessage) {
      setError("Bid amount and message are required.");
      return;
    }
    try {
      const task = tasks.find((t) => t._id === taskId);
      if (!task) throw new Error("Task not found");

      const bidData = {
        taskId: taskId,
        freelancerId: account,
        clientId: task.clientId,
        amount: parseFloat(bidAmount),
        message: bidMessage,
      };
      console.log("Submitting bid:", bidData);

      const response = await axios.post("http://localhost:5000/api/bids/create", bidData, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Bid response:", response.data);
      setSuccess("Bid placed successfully!");
      setError(null);
      setBidTask(null);
      setBidAmount("");
      setBidMessage("");
    } catch (error) {
      console.error("Error placing bid:", error);
      setError("Failed to place bid: " + (error.response?.data?.message || error.message));
      setSuccess(null);
    }
  };

  const fetchClientProfile = async (clientId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/profiles/clients/${clientId}`);
      setSelectedClient(response.data || {});
    } catch (err) {
      setError("Failed to fetch client profile: " + err.message);
      setSelectedClient(null);
    }
  };

  const formatString = (str) =>
    str && typeof str === "string" ? `${str.slice(0, 6)}...${str.slice(-4)}` : "Not available";

  // FreelancerNavbar Component
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
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Available Tasks</h2>

        {!account ? (
          <div className="text-center bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">
              {error || "Please connect your wallet to view available tasks."}
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
            <p className="text-gray-600">Loading tasks...</p>
            <div className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mt-4"></div>
          </div>
        ) : error ? (
          <p className="text-center text-red-600 bg-red-50 p-4 rounded-lg">{error}</p>
        ) : success ? (
          <p className="text-center text-green-600 bg-green-50 p-4 rounded-lg mb-4">{success}</p>
        ) : tasks.length === 0 ? (
          <p className="text-center text-gray-600 bg-white p-6 rounded-lg shadow-md">
            No available tasks for {formatString(account)}.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
              >
                <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                <p className="text-gray-700 mt-2 line-clamp-3">{task.description}</p>
                <p className="text-teal-600 font-semibold mt-2">Budget: LKR {task.budget}</p>
                <p className="text-gray-500 mt-2">
                  Deadline: {new Date(task.deadline).toDateString()}
                </p>
                <p className="text-gray-500 mt-2">
                  Client: {formatString(task.clientId)}
                </p>
                <div className="mt-4 space-y-3">
                  <button
                    onClick={() => fetchClientProfile(task.clientId)}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
                    disabled={isLoading || !account}
                  >
                    View Client Profile
                  </button>
                  <button
                    onClick={() => setBidTask(task)}
                    className="w-full bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
                    disabled={isLoading || !account}
                  >
                    Place Bid
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {bidTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Place Bid for "{bidTask.title}"
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    className="block text-gray-700 font-medium mb-1"
                    htmlFor="bid-amount"
                  >
                    Bid Amount (LKR)
                  </label>
                  <input
                    id="bid-amount"
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter your bid amount"
                  />
                </div>
                <div>
                  <label
                    className="block text-gray-700 font-medium mb-1"
                    htmlFor="bid-message"
                  >
                    Message
                  </label>
                  <textarea
                    id="bid-message"
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 h-24 resize-none"
                    placeholder="Enter a message for the client"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setBidTask(null)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBidSubmit(bidTask._id)}
                  className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
                  disabled={isLoading || !account}
                >
                  {isLoading ? "Submitting..." : "Submit Bid"}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Client Profile</h3>
              <div className="space-y-4">
                <p><strong>Name:</strong> {selectedClient.name || "Unnamed Client"}</p>
                <p><strong>Rating:</strong> {selectedClient.rating ? selectedClient.rating.toFixed(1) : "0.0"}/5</p>
                <p><strong>Bio:</strong> {selectedClient.bio || "No bio available"}</p>
                <p>
                  <strong>Skills/Interests:</strong>{" "}
                  {Array.isArray(selectedClient.skills) && selectedClient.skills.length > 0
                    ? selectedClient.skills.join(", ")
                    : "None listed"}
                </p>
                <p><strong>Posted Tasks:</strong> {selectedClient.postedTasks || 0}</p>
                <p><strong>Completed Tasks:</strong> {selectedClient.completedTasks || 0}</p>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="mt-6 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>

      <FreelancerFooter />
    </div>
  );
}