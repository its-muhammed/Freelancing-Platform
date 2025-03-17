import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { freelanceJobABI } from "../contracts/FreelanceJobABI.js";
import Layout from "../components/Layout";
import { motion, AnimatePresence } from "framer-motion";

const PINATA_API_KEY = "7d990cc95bf0720db5a0"; // Replace with your Pinata API Key
const PINATA_API_SECRET = "5525b3dfae1091ca269d7f3d48cae818b10d26659c3fa8ed7ae97af03ef61989"; // Replace with your Pinata API Secret
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export default function OngoingTasks() {
  const [account, setAccount] = useState("");
  const [tasks, setTasks] = useState([]);
  const [proof, setProof] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState({});
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [contractTask, setContractTask] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [filteredTasks, setFilteredTasks] = useState([]);
  const navigate = useNavigate();


  useEffect(() => {
    async function getAccount() {
      if (window.ethereum) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x13882" }],
          });
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          setAccount(accounts[0]);
        } catch (error) {
          console.error("Error connecting MetaMask:", error);
          setError("Failed to connect MetaMask: " + error.message);
        }
      } else {
        setError("MetaMask not detected. Please install it to continue.");
      }
    }
    getAccount();
  }, []);

  useEffect(() => {
    async function fetchTasks() {
      if (!account) {
        setError("Please connect your wallet to view ongoing tasks.");
        return;
      }
      setLoadingTasks((prev) => ({ ...prev, fetching: true }));
      setError(null);
      try {
        const response = await axios.get(`http://localhost:5000/api/bids/freelancer/${account}`);
        const fetchedTasks = Array.isArray(response.data) ? response.data : [];
        console.log("Fetched bids in OngoingTasks:", fetchedTasks);
        setTasks(fetchedTasks);
        setFilteredTasks(fetchedTasks);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setError("Failed to fetch tasks: " + error.message);
      } finally {
        setLoadingTasks((prev) => ({ ...prev, fetching: false }));
      }
    }
    if (account) {
      fetchTasks();
    }
  }, [account]);

  useEffect(() => {
    if (activeFilter === "All") {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter((task) => task.status === activeFilter));
    }
  }, [activeFilter, tasks]);

  const handleConnectWallet = async () => {
    if (window.ethereum) {
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

  const handleAcceptJob = async (contractAddress, bidId) => {
    if (!contractAddress) {
      alert("Error: No contract address available for this bid");
      return;
    }
    try {
      setLoadingTasks((prev) => ({ ...prev, [bidId]: "accepting" }));
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
      const updatedTasks = await axios.get(`http://localhost:5000/api/bids/freelancer/${account}`);
      setTasks(updatedTasks.data);
      setContractTask(null);
    } catch (error) {
      console.error("Error accepting job:", error);
      alert("Failed to accept job: " + (error.reason || error.message));
    } finally {
      setLoadingTasks((prev) => ({ ...prev, [bidId]: undefined }));
    }
  };

  const handleSubmitProof = async (contractAddress, bidId) => {
    if (!contractAddress) {
      alert("Error: No contract address available for this bid");
      return;
    }
    try {
      setLoadingTasks((prev) => ({ ...prev, [bidId]: "submitting" }));
      let proofData;

      if (pdfFile) {
        // Upload PDF to Pinata
        const formData = new FormData();
        formData.append("file", pdfFile);

        const pinataResponse = await axios.post(
          "https://api.pinata.cloud/pinning/pinFileToIPFS",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              pinata_api_key: PINATA_API_KEY,
              pinata_secret_api_key: PINATA_API_SECRET,
            },
          }
        );

        const ipfsHash = pinataResponse.data.IpfsHash;
        proofData = `${PINATA_GATEWAY}${ipfsHash}`; // e.g., https://gateway.pinata.cloud/ipfs/<hash>
      } else {
        if (!proof) throw new Error("Please enter proof of work or upload a PDF");
        proofData = proof; // Use text proof as-is
      }

      if (!window.ethereum) throw new Error("MetaMask is not installed");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, freelanceJobABI, signer);
      const tx = await contract.submitWork(proofData);
      await tx.wait();

      await axios.post("http://localhost:5000/api/bids/update", {
        bidId,
        status: "Work Submitted",
      });

      alert("Proof submitted successfully!");
      const updatedTasks = await axios.get(`http://localhost:5000/api/bids/freelancer/${account}`);
      setTasks(updatedTasks.data);
      setProof("");
      setPdfFile(null);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error submitting proof:", error);
      alert("Failed to submit proof: " + (error.reason || error.message));
    } finally {
      setLoadingTasks((prev) => ({ ...prev, [bidId]: undefined }));
    }
  };

  const fetchContractDetails = async (contractAddress, bid) => {
    if (!contractAddress) {
      return { error: "No contract address available" };
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, freelanceJobABI, provider);

      // Read public variables from the contract
      const clientAddr = await contract.client();
      const freelancerAddr = await contract.freelancer();
      const payment = await contract.payment();
      const dueDate = await contract.dueDate();
      const workSubmitted = await contract.workSubmitted();
      const workApproved = await contract.workApproved();

      const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=lkr");
      const lkrPerPol = response.data["matic-network"].lkr || 200;
      const lkrAmount = (Number(ethers.formatEther(payment)) * lkrPerPol).toFixed(2);

      // Fetch task details if bid.taskId is not populated
      let taskTitle = "N/A";
      let taskDescription = "N/A";
      if (bid.taskId) {
        if (typeof bid.taskId === "object") {
          taskTitle = bid.taskId.title || "N/A";
          taskDescription = bid.taskId.description || "N/A";
        } else {
          const taskResponse = await axios.get(`http://localhost:5000/api/tasks/${bid.taskId}`);
          taskTitle = taskResponse.data.title || "N/A";
          taskDescription = taskResponse.data.description || "N/A";
        }
      }

      return {
        taskTitle,
        taskDescription,
        freelancerAddress: freelancerAddr,
        clientAddress: clientAddr,
        lkrAmount: `${lkrAmount} LKR`,
        polAmount: `${ethers.formatEther(payment)} POL`,
        dueDate: new Date(Number(dueDate) * 1000).toLocaleDateString(),
        workSubmitted,
        workApproved,
        terms: "Payment will be released upon successful submission of work as per the agreed timeline.",
      };
    } catch (error) {
      console.error("Error fetching contract details:", error);
      return { error: "Failed to fetch contract details: " + error.message };
    }
  };

  const statusColors = {
    "Contract Sent": "bg-yellow-100 text-yellow-800",
    Accepted: "bg-blue-100 text-blue-800",
    "Work Submitted": "bg-green-100 text-green-800",
    Completed: "bg-gray-100 text-gray-800",
  };

  const formatString = (str) => {
    return str && typeof str === "string" ? `${str.slice(0, 6)}...${str.slice(-4)}` : "Not available";
  };

  return (
    <Layout userType="freelancer">
      <div className="flex min-h-screen bg-gray-100">
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
                disabled={Object.keys(loadingTasks).length > 0}
                className={`bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition ${
                  Object.keys(loadingTasks).length > 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                Connect Wallet
              </button>
            </div>
          ) : loadingTasks.fetching ? (
            <div className="text-center">
              <p className="text-gray-600">Loading tasks...</p>
              <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mt-4"></div>
            </div>
          ) : error ? (
            <p className="text-center text-red-600 bg-red-50 p-4 rounded-lg">{error}</p>
          ) : (
            <>
              <div className="flex space-x-4 mb-6">
                {["All", "Contract Sent", "Accepted", "Work Submitted", "Completed"].map((status) => (
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

              {filteredTasks.length === 0 ? (
                <p className="text-center text-gray-600 bg-white p-6 rounded-lg shadow-md">
                  No ongoing tasks for {formatString(account)}.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filteredTasks.map((task) => (
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
                              Bid ID: {task._id.slice(0, 8)}...
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
                          <strong>Amount:</strong> {task.amount} LKR
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

                        {task.status === "Contract Sent" && (
                          <div className="flex space-x-2">
                            <button
                              onClick={async () => {
                                const details = await fetchContractDetails(task.contractAddress, task);
                                setContractTask({ ...task, contractDetails: details });
                              }}
                              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
                              disabled={loadingTasks[task._id]}
                            >
                              View Contract
                            </button>
                            <button
                              onClick={() => handleAcceptJob(task.contractAddress, task._id)}
                              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                              disabled={loadingTasks[task._id] || !task.contractAddress}
                            >
                              {loadingTasks[task._id] === "accepting" ? "Accepting..." : "Accept Job"}
                            </button>
                          </div>
                        )}
                        {task.status === "Accepted" && (
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                            disabled={loadingTasks[task._id] || !task.contractAddress}
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

          {contractTask && contractTask.contractDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Contract Details</h3>
                {contractTask.contractDetails.error ? (
                  <div>
                    <p className="text-red-600">{contractTask.contractDetails.error}</p>
                    <p className="text-gray-600 mt-2">
                      Please ensure the task exists or contact support.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p><strong>Task Title:</strong> {contractTask.contractDetails.taskTitle}</p>
                    <p><strong>Description:</strong> {contractTask.contractDetails.taskDescription}</p>
                    <p><strong>Freelancer Address:</strong> {formatString(contractTask.contractDetails.freelancerAddress)}</p>
                    <p><strong>Client Address:</strong> {formatString(contractTask.contractDetails.clientAddress)}</p>
                    <p><strong>Amount (LKR):</strong> {contractTask.contractDetails.lkrAmount}</p>
                    <p><strong>Amount (POL):</strong> {contractTask.contractDetails.polAmount}</p>
                    <p><strong>Due Date:</strong> {contractTask.contractDetails.dueDate}</p>
                    <p><strong>Work Submitted:</strong> {contractTask.contractDetails.workSubmitted ? "Yes" : "No"}</p>
                    <p><strong>Work Approved:</strong> {contractTask.contractDetails.workApproved ? "Yes" : "No"}</p>
                    <p><strong>Terms:</strong> {contractTask.contractDetails.terms}</p>
                  </div>
                )}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setContractTask(null)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
                  >
                    Close
                  </button>
                  {!contractTask.contractDetails.error && (
                    <button
                      onClick={() => handleAcceptJob(contractTask.contractAddress, contractTask._id)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                      disabled={loadingTasks[contractTask._id]}
                    >
                      {loadingTasks[contractTask._id] === "accepting" ? "Accepting..." : "Accept Job"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedTask && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Submit Proof for Bid</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1" htmlFor="proof">
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
                  <div>
                    <label className="block text-gray-700 font-medium mb-1" htmlFor="pdfUpload">
                      Upload PDF (optional)
                    </label>
                    <input
                      type="file"
                      id="pdfUpload"
                      accept="application/pdf"
                      onChange={(e) => {
                        if (e.target.files.length > 0) {
                          setPdfFile(e.target.files[0]);
                        }
                      }}
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
                    disabled={loadingTasks[selectedTask._id] || (!proof && !pdfFile)}
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
