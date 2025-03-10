import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { freelanceJobABI } from "../contracts/FreelanceJobABI.js";
import Layout from "../components/Layout";
import { motion, AnimatePresence } from "framer-motion"; // For animations

export default function OngoingTasks() {
  const [account, setAccount] = useState(""); // Local state for account
  const [tasks, setTasks] = useState([]);
  const [proof, setProof] = useState("");
  const [loadingTasks, setLoadingTasks] = useState({}); // Track loading per task
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null); // For proof submission modal
  const [contractTask, setContractTask] = useState(null); // For contract view modal
  const [activeFilter, setActiveFilter] = useState("All");
  const navigate = useNavigate();

  // Fetch tasks and connect MetaMask
  useEffect(() => {
    async function fetchTasks() {
      if (!account) {
        setError("Please connect your wallet to view ongoing tasks.");
        return;
      }
      setLoadingTasks({}); // Reset loading states
      setError(null);
      try {
        const response = await axios.get(`http://localhost:5000/api/bids/freelancer/${account}`);
        console.log("Fetched tasks:", response.data); // Debug log
        const fetchedTasks = Array.isArray(response.data) ? response.data : [];
        setTasks(fetchedTasks);
        setFilteredTasks(fetchedTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setError("Failed to fetch tasks: " + error.message);
      }
    }

    async function getAccount() {
      if (window.ethereum) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x13882" }], // Polygon Amoy
          });
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          setAccount(accounts[0]); // Update local account state
          console.log("Connected account:", accounts[0]); // Debug log
        } catch (error) {
          console.error("Error connecting MetaMask:", error);
          setError("Failed to connect MetaMask: " + error.message);
        }
      } else {
        setError("MetaMask not detected. Please install it to continue.");
      }
    }

    getAccount();
    fetchTasks();
  }, [account]); // Re-run when account changes

  // Filter tasks by status
  const [filteredTasks, setFilteredTasks] = useState([]);
  useEffect(() => {
    if (activeFilter === "All") {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter(task => task.status === activeFilter));
    }
  }, [activeFilter, tasks]);

  const handleConnectWallet = async () => {
    if (window.ethereum) {
      setLoadingTasks({}); // Reset loading states
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        setError(null);
      } catch (error) {
        console.error("Error connecting wallet:", error);
        setError("Failed to connect wallet: " + error.message);
      }
    } else {
      setError("MetaMask is not installed. Please install it to continue.");
    }
  };

  // Accept a job
  const handleAcceptJob = async (contractAddress, bidId) => {
    try {
      setLoadingTasks(prev => ({ ...prev, [bidId]: "accepting" })); // Set loading for this task
      if (!window.ethereum) throw new Error("MetaMask is not installed");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, freelanceJobABI, signer);
      const tx = await contract.acceptJob();
      await tx.wait();

      await axios.post("http://localhost:5000/api/bids/update", {
        bidId,
        status: "Accepted",
      });

      alert("Job accepted successfully!");
      setTasks(tasks.map(task => (task._id === bidId ? { ...task, status: "Accepted" } : task)));
      setContractTask(null); // Close the contract modal after accepting
    } catch (error) {
      console.error("Error accepting job:", error);
      alert("Failed to accept job: " + error.message);
    } finally {
      setLoadingTasks(prev => ({ ...prev, [bidId]: undefined })); // Clear loading for this task
    }
  };

  // Submit proof of work
  const handleSubmitProof = async (contractAddress, bidId) => {
    try {
      setLoadingTasks(prev => ({ ...prev, [bidId]: "submitting" })); // Set submitting for this task
      if (!proof) throw new Error("Please enter proof of work");
      if (!window.ethereum) throw new Error("MetaMask is not installed");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, freelanceJobABI, signer);
      const tx = await contract.submitWork(proof);
      await tx.wait();

      await axios.post("http://localhost:5000/api/bids/update", {
        bidId,
        status: "Work Submitted",
      });

      alert("Proof submitted successfully!");
      setTasks(tasks.map(task => (task._id === bidId ? { ...task, status: "Work Submitted" } : task)));
      setProof(""); // Clear input
      setSelectedTask(null);
    } catch (error) {
      console.error("Error submitting proof:", error);
      alert("Failed to submit proof: " + error.message);
    } finally {
      setLoadingTasks(prev => ({ ...prev, [bidId]: undefined })); // Clear submitting for this task
    }
  };

  const statusColors = {
    "Contract Sent": "bg-yellow-100 text-yellow-800",
    "Accepted": "bg-blue-100 text-blue-800",
    "Work Submitted": "bg-green-100 text-green-800",
    "Completed": "bg-gray-100 text-gray-800",
  };

  const formatString = (str) => {
    return str && typeof str === "string" ? `${str.slice(0, 6)}...${str.slice(-4)}` : "Not available";
  };

  return (
    <Layout userType="freelancer">
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-64 bg-gradient-to-b from-indigo-600 to-indigo-800 text-white p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-8">Freelancer Dashboard</h2>
          <nav className="space-y-4">
            <button
              onClick={() => navigate("/freelancer-dashboard")}
              className="w-full text-left px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-400 transition"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/available-tasks")}
              className="w-full text-left px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-400 transition"
            >
              Available Tasks
            </button>
            <button
              onClick={() => navigate("/ongoing-tasks")}
              className="w-full text-left px-4 py-2 rounded-md bg-indigo-700 hover:bg-indigo-600 transition"
            >
              Ongoing Tasks
            </button>
            <button
              onClick={() => navigate("/freelancer-profile")}
              className="w-full text-left px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-400 transition"
            >
              Profile
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <header className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white p-6 rounded-lg mb-8 shadow-md">
            <h2 className="text-3xl font-bold">Ongoing Tasks</h2>
          </header>

          {!account || account === "" ? (
            <div className="text-center bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600 mb-4">
                {error || "Please connect your wallet to view ongoing tasks."}
              </p>
              <button
                onClick={handleConnectWallet}
                disabled={Object.keys(loadingTasks).length > 0} // Disable if any task is loading
                className={`bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition ${
                  Object.keys(loadingTasks).length > 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Connect Wallet
              </button>
            </div>
          ) : loadingTasks["fetching"] ? (
            <div className="text-center">
              <p className="text-gray-600">Loading tasks...</p>
              <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mt-4"></div>
            </div>
          ) : error ? (
            <p className="text-center text-red-600 bg-red-50 p-4 rounded-lg">{error}</p>
          ) : (
            <>
              {/* Status Filters */}
              <div className="flex space-x-4 mb-6">
                {["All", "Contract Sent", "Accepted", "Work Submitted", "Completed"].map(status => (
                  <button
                    key={status}
                    onClick={() => setActiveFilter(status)}
                    className={`px-4 py-2 rounded-md ${
                      activeFilter === status
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    } transition`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Task List */}
              {filteredTasks.length === 0 ? (
                <p className="text-center text-gray-600 bg-white p-6 rounded-lg shadow-md">
                  No ongoing tasks for {formatString(account)}.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredTasks.map(task => (
                      <motion.div
                        key={task._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition transform hover:-translate-y-1"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Task ID: {task._id.slice(0, 8)}...
                            </h3>
                            <p className="text-gray-600">Client: {formatString(task.clientId)}</p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              statusColors[task.status] || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">
                          <strong>Amount:</strong> {task.amount} POL
                        </p>
                        <p className="text-gray-700 mb-4 line-clamp-2">
                          <strong>Message:</strong> {task.message}
                        </p>
                        {task.contractAddress && (
                          <p className="text-gray-600 text-sm mb-4">
                            <strong>Contract:</strong>{" "}
                            <a
                              href={`https://amoy.polygonscan.com/address/${task.contractAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline"
                            >
                              {formatString(task.contractAddress)}
                            </a>
                          </p>
                        )}

                        {/* Progress Tracker */}
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                          </div>
                          <div className="relative w-full h-2 bg-gray-200 rounded-full">
                            <div
                              className={`absolute h-full rounded-full ${
                                task.status === "Contract Sent"
                                  ? "w-1/3 bg-yellow-500"
                                  : task.status === "Accepted"
                                  ? "w-2/3 bg-blue-500"
                                  : "w-full bg-green-500"
                              } transition-all duration-500`}
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        {task.status === "Contract Sent" && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setContractTask(task)}
                              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
                              disabled={loadingTasks[task._id]}
                            >
                              View Contract
                            </button>
                            <button
                              onClick={() => handleAcceptJob(task.contractAddress, task._id)}
                              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                              disabled={loadingTasks[task._id]}
                            >
                              {loadingTasks[task._id] === "accepting" ? "Accepting..." : "Accept Job"}
                            </button>
                          </div>
                        )}
                        {task.status === "Accepted" && (
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                            disabled={loadingTasks[task._id]}
                          >
                            {loadingTasks[task._id] === "submitting" ? "Submitting..." : "Submit Proof"}
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}

          {/* Contract View Modal */}
          {contractTask && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Contract Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-700">
                      <strong>Task ID:</strong> {contractTask._id}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700">
                      <strong>Client Address:</strong> {contractTask.clientId}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700">
                      <strong>Amount:</strong> {contractTask.amount} POL
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700">
                      <strong>Message:</strong> {contractTask.message}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700">
                      <strong>Contract Address:</strong>{" "}
                      <a
                        href={`https://amoy.polygonscan.com/address/${contractTask.contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        {contractTask.contractAddress}
                      </a>
                    </p>
                  </div>
                  {/* Add more contract details if available */}
                  <div>
                    <p className="text-gray-700">
                      <strong>Terms:</strong> Payment will be released upon successful submission of work as per the agreed timeline.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setContractTask(null)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleAcceptJob(contractTask.contractAddress, contractTask._id)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                    disabled={loadingTasks[contractTask._id]}
                  >
                    {loadingTasks[contractTask._id] === "accepting" ? "Accepting..." : "Accept Job"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Proof Submission Modal */}
          {selectedTask && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Submit Proof for Task
                </h3>
                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-gray-700 font-medium mb-1"
                      htmlFor="proof"
                    >
                      Proof of Work (e.g., IPFS Hash)
                    </label>
                    <textarea
                      id="proof"
                      value={proof}
                      onChange={(e) => setProof(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                      placeholder="Enter proof of work (e.g., IPFS hash)"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedTask(null)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSubmitProof(selectedTask.contractAddress, selectedTask._id)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                    disabled={loadingTasks[selectedTask._id] || !proof}
                  >
                    {loadingTasks[selectedTask._id] === "submitting" ? "Submitting..." : "Submit Proof"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}