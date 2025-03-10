import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Web3Context } from "../context/Web3Context";
import Layout from "../components/Layout";

export default function PostTaskPage() {
  const web3Context = useContext(Web3Context);
  const { account } = web3Context || { account: "" };
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Retrieve MetaMask Account when component loads
  useEffect(() => {
    async function getAccount() {
      if (!window.ethereum) {
        setError("MetaMask is not installed. Please install it to continue.");
        return;
      }
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts.length === 0) {
          setError("No MetaMask account found. Please connect your wallet.");
        }
      } catch (error) {
        console.error("Error fetching MetaMask account:", error);
        setError("Failed to connect MetaMask: " + error.message);
      }
    }
    getAccount();
  }, []);

  const handleConnectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log("Wallet connection requested");
        setError(null);
      } catch (error) {
        console.error("Error connecting wallet:", error);
        setError("Failed to connect wallet: " + error.message);
      }
    } else {
      setError("MetaMask not detected.");
    }
  };

  const handlePostTask = async () => {
    if (!title || !description || !budget || !deadline) {
      setError("All fields are required.");
      return;
    }

    if (!account) {
      setError("MetaMask account is missing. Please connect your wallet.");
      return;
    }

    const taskData = {
      title,
      description,
      budget,
      deadline,
      clientId: account,
      status: "Open",
    };

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post("http://localhost:5000/api/tasks/create", taskData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 201) {
        alert("Task posted successfully!");
        navigate("/manage-tasks"); // navigate is used here
      } else {
        setError("Failed to post task. Try again later.");
      }
    } catch (error) {
      console.error("Error posting task:", error);
      setError("Failed to post task: " + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6 rounded-lg mb-6 shadow-md">
          <h2 className="text-3xl font-bold">Post a New Task</h2>
        </header>

        {!account ? (
          <div className="text-center bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">Please connect your wallet to post a task.</p>
            <button
              onClick={handleConnectWallet}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md">
            {error && (
              <p className="text-center text-red-600 bg-red-50 p-4 rounded-lg mb-4">{error}</p>
            )}
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="title">
                  Task Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    title || !error ? "border-gray-300" : "border-red-500"
                  }`}
                  placeholder="Enter task title (e.g., Build a website)"
                />
                {error && !title && (
                  <p className="text-red-500 text-sm mt-1">Task title is required.</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none ${
                    description || !error ? "border-gray-300" : "border-red-500"
                  }`}
                  placeholder="Describe your task in detail..."
                />
                {error && !description && (
                  <p className="text-red-500 text-sm mt-1">Description is required.</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="budget">
                  Budget (LKR)
                </label>
                <input
                  id="budget"
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    budget || !error ? "border-gray-300" : "border-red-500"
                  }`}
                  placeholder="Enter budget in LKR (e.g., 5000)"
                />
                {error && !budget && (
                  <p className="text-red-500 text-sm mt-1">Budget is required.</p>
                )}
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2" htmlFor="deadline">
                  Deadline
                </label>
                <input
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    deadline || !error ? "border-gray-300" : "border-red-500"
                  }`}
                />
                {error && !deadline && (
                  <p className="text-red-500 text-sm mt-1">Deadline is required.</p>
                )}
              </div>

              <button
                onClick={handlePostTask}
                disabled={isLoading || !account}
                className={`w-full bg-blue-600 text-white px-6 py-3 rounded-md shadow-lg hover:bg-blue-700 transition flex items-center justify-center ${
                  isLoading || !account ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Posting Task...
                  </>
                ) : (
                  "Post Task"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}