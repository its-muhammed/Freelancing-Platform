import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Web3Context } from "../context/Web3Context";
import { useToast } from "../components/ToastContainer"; // Adjust path based on your file structure
import Layout from "../components/Layout";

export default function PostTaskPage() {
  const web3Context = useContext(Web3Context);
  const { account } = web3Context || { account: "" };
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    async function getAccount() {
      if (!window.ethereum) {
        addToast("MetaMask is not installed. Please install it to continue.", "error");
        return;
      }
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        if (accounts.length === 0) {
          addToast("No MetaMask account found. Please connect your wallet.", "error");
        }
      } catch (error) {
        console.error("Error fetching MetaMask account:", error);
        addToast("Failed to connect MetaMask: " + error.message, "error");
      }
    }
    getAccount();
  }, [addToast]);

  const handleConnectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log("Wallet connection requested");
        addToast("Wallet connected successfully!", "success");
      } catch (error) {
        console.error("Error connecting wallet:", error);
        addToast("Failed to connect wallet: " + error.message, "error");
      }
    } else {
      addToast("MetaMask not detected.", "error");
    }
  };

  const handlePostTask = async () => {
    if (!title || !description || !budget || !deadline) {
      addToast("All fields are required.", "error");
      return;
    }

    if (!account) {
      addToast("MetaMask account is missing. Please connect your wallet.", "error");
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

    try {
      const response = await axios.post("http://localhost:5000/api/tasks/create", taskData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 201) {
        addToast("Task posted successfully!", "success");
        setTimeout(() => navigate("/manage-tasks"), 2000);
      } else {
        addToast("Failed to post task. Try again later.", "error");
      }
    } catch (error) {
      console.error("Error posting task:", error);
      addToast(
        "Failed to post task: " + (error.response?.data?.message || error.message),
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="bg-white">
        <header className="bg-slate-800 text-white p-6 shadow-md">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">Post a New Task</h2>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8 min-h-screen bg-gray-100">
          {!account ? (
            <div className="text-center bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600 mb-4">Please connect your wallet to post a task.</p>
              <button
                onClick={handleConnectWallet}
                className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 transition"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="title">
                    Task Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter task title (e.g., Build a website)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 h-32 resize-none"
                    placeholder="Describe your task in detail..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="budget">
                    Budget (LKR)
                  </label>
                  <input
                    id="budget"
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus-outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Enter budget in LKR (e.g., 5000)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="deadline">
                    Deadline
                  </label>
                  <input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <button
                  onClick={handlePostTask}
                  disabled={isLoading || !account}
                  className={`w-full bg-teal-600 text-white px-6 py-3 rounded-md hover:bg-teal-700 transition ${
                    isLoading || !account ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white inline"
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l-2.647z"
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
        </main>

        <footer className="bg-slate-800 text-white p-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm">© 2025 FreeWork. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Layout>
  );
}