import { useState, useEffect, useContext } from "react";
import axios from "axios";
//import { useNavigate } from "react-router-dom";
import { Web3Context } from "../context/Web3Context";
import Layout from "../components/Layout";

export default function AvailableTasks() {
  const web3Context = useContext(Web3Context);
  const { account } = web3Context || { account: "" };
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bidTask, setBidTask] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
 // const navigate = useNavigate();

  useEffect(() => {
    async function fetchTasks() {
      if (!account) {
        setError("Please connect your wallet to view available tasks.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get("http://localhost:5000/api/tasks/freelancer-available");
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
          // Switch to Polygon Amoy testnet (chainId: 0x13882)
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
      const task = tasks.find(t => t._id === taskId);
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
      setError("Bid placed successfully!");
      setBidTask(null);
      setBidAmount("");
      setBidMessage("");
    } catch (error) {
      console.error("Error placing bid:", error);
      setError("Failed to place bid: " + (error.response?.data?.message || error.message));
    }
  };

  const formatString = (str) => {
    return str && typeof str === "string" ? `${str.slice(0, 6)}...${str.slice(-4)}` : "Not available";
  };

  return (
    <Layout userType="freelancer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white p-6 rounded-lg mb-6 shadow-md">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Available Tasks</h2>
          </div>
        </header>

        {!account ? (
          <div className="text-center bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">
              {error || "Please connect your wallet to view available tasks."}
            </p>
            <button
              onClick={handleConnectWallet}
              disabled={isLoading}
              className={`bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        ) : isLoading ? (
          <div className="text-center">
            <p className="text-gray-600">Loading tasks...</p>
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mt-4"></div>
          </div>
        ) : error ? (
          <p className="text-center text-red-600 bg-red-50 p-4 rounded-lg">{error}</p>
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
                <p className="text-indigo-600 font-semibold mt-2">Budget: LKR {task.budget}</p>
                <p className="text-gray-500 mt-2">
                  Deadline: {new Date(task.deadline).toDateString()}
                </p>
                <p className="text-gray-500 mt-2">
                  Client: {formatString(task.clientId)}
                </p>
                <button
                  onClick={() => setBidTask(task)}
                  className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition w-full"
                  disabled={isLoading || !account}
                >
                  Place Bid
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bid Submission Modal */}
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
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
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
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                  disabled={isLoading || !account}
                >
                  {isLoading ? "Submitting..." : "Submit Bid"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}