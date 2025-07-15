import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { freelanceJobABI } from "../contracts/FreelanceJobABI.js";
import { motion, AnimatePresence } from "framer-motion";
import { Web3Context } from "../context/Web3Context";
import { useToast } from "../components/ToastContainer"; // Import useToast

const PINATA_API_KEY = "7d990cc95bf0720db5a0";
const PINATA_API_SECRET = "5525b3dfae1091ca269d7f3d48cae818b10d26659c3fa8ed7ae97af03ef61989";
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export default function OngoingTasks() {
  const web3Context = useContext(Web3Context);
  const { account: contextAccount } = web3Context || { account: "" };
  const [account, setAccount] = useState(contextAccount);
  const [tasks, setTasks] = useState([]);
  const [proof, setProof] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState({});
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [contractTask, setContractTask] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [ratingTask, setRatingTask] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();
  const { addToast } = useToast(); // Initialize useToast

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
        console.log("Fetched bids with clientIds:", fetchedTasks.map(t => ({ id: t._id, clientId: t.clientId, status: t.status })));
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
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x13882" }],
        });
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
        setError(null);
      } catch (error) {
        console.error("Error connecting wallet:", error);
        setError("Failed to connect wallet: " + error.message);
      }
    } else {
      setError("MetaMask is not installed. Please install it to continue.");
    }
  };

  const ensureCorrectNetwork = async () => {
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== "0x13882") {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x13882" }],
        });
      }
    } catch (error) {
      throw new Error("Failed to switch to Polygon Amoy testnet: " + error.message);
    }
  };

  const getGasEstimates = async (provider) => {
    try {
      const gasPrice = await provider.getFeeData();
      return {
        gasPrice: gasPrice.gasPrice,
        gasLimit: 2000000, // Default gas limit for contract deployment and calls
      };
    } catch (error) {
      console.error("Error fetching gas estimates:", error);
      return {
        gasPrice: ethers.parseUnits("30", "gwei"), // Fallback gas price
        gasLimit: 2000000,
      };
    }
  };

  const checkWalletBalance = async (signer, value = 0n) => {
    const signerAddress = await signer.getAddress();
    const balance = await signer.provider.getBalance(signerAddress);
    const { gasPrice, gasLimit } = await getGasEstimates(signer.provider);
    
    // Use ethers.js for big number operations
    const gasCost = gasPrice * ethers.getBigInt(gasLimit);
    const totalCost = gasCost + ethers.getBigInt(value);
    
    if (balance < totalCost) {
      throw new Error(
        `Insufficient funds: ${ethers.formatEther(balance)} POL available, ${ethers.formatEther(totalCost)} POL required`
      );
    }
  };

  const handleAcceptJob = async (contractAddress, bidId) => {
    if (!contractAddress) {
      addToast("Error: No contract address available for this bid", "error");
      return;
    }
    try {
      setLoadingTasks((prev) => ({ ...prev, [bidId]: "accepting" }));
      if (!window.ethereum) throw new Error("MetaMask is not installed");

      await ensureCorrectNetwork();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      await checkWalletBalance(signer);

      const { gasPrice, gasLimit } = await getGasEstimates(provider);
      const contract = new ethers.Contract(contractAddress, freelanceJobABI, signer);
      const tx = await contract.acceptJob({ gasPrice, gasLimit });
      await tx.wait();

      const clientAddress = await contract.client();
      console.log("Client address from contract:", clientAddress);

      const updateResponse = await axios.post("http://localhost:5000/api/bids/update", {
        bidId,
        status: "Accepted",
        clientId: clientAddress,
      }, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Bid update response:", updateResponse.data);

      addToast("Job accepted successfully!", "success");
      const updatedTasks = await axios.get(`http://localhost:5000/api/bids/freelancer/${account}`);
      setTasks(updatedTasks.data);
      setContractTask(null);
    } catch (error) {
      console.error("Error accepting job:", error);
      addToast(
        "Failed to accept job: " +
        (error.reason || error.message) +
        ". Ensure you have enough test MATIC (get more from the Amoy faucet) and try resetting your MetaMask account (Account > Settings > Advanced > Reset Account).",
        "error"
      );
    } finally {
      setLoadingTasks((prev) => ({ ...prev, [bidId]: undefined }));
    }
  };

  const handleSubmitProof = async (contractAddress, bidId) => {
    try {
      setLoadingTasks((prev) => ({ ...prev, [bidId]: "submitting" }));
      let proofData;

      if (pdfFile) {
        const formData = new FormData();
        formData.append("file", pdfFile);
        formData.append("bidId", bidId);

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
        proofData = `${PINATA_GATEWAY}${ipfsHash}`;
      } else {
        if (!proof) throw new Error("Please enter proof of work or upload a PDF");
        proofData = proof;
      }

      const bid = tasks.find((t) => t._id === bidId);
      if (bid.status === "Manual Accepted") {
        await axios.post("http://localhost:5000/api/b/ids/update", {
          bidId,
          status: "Work Submitted",
          ipfsUrl: proofData,
        });
      } else if (contractAddress) {
        if (!window.ethereum) throw new Error("MetaMask is not installed");
        await ensureCorrectNetwork();
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        await checkWalletBalance(signer);

        const { gasPrice, gasLimit } = await getGasEstimates(provider);
        const contract = new ethers.Contract(contractAddress, freelanceJobABI, signer);
        const tx = await contract.submitWork(proofData, { gasPrice, gasLimit });
        await tx.wait();

        await axios.post("http://localhost:5000/api/bids/update", {
          bidId,
          status: "Work Submitted",
        });
      } else {
        throw new Error("No valid submission method available for this bid");
      }

      addToast("Proof submitted successfully!", "success");
      const updatedTasks = await axios.get(`http://localhost:5000/api/bids/freelancer/${account}`);
      setTasks(updatedTasks.data);
      setProof("");
      setPdfFile(null);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error submitting proof:", error);
      addToast(
        "Failed to submit proof: " +
        (error.reason || error.message) +
        ". Ensure you have enough test MATIC (get more from the Amoy faucet) and try resetting your MetaMask account (Account > Settings > Advanced > Reset Account).",
        "error"
      );
    } finally {
      setLoadingTasks((prev) => ({ ...prev, [bidId]: undefined }));
    }
  };

  const submitRating = async (bidId, clientId) => {
    try {
      setLoadingTasks((prev) => ({ ...prev, [bidId]: "rating" }));
      const reviewData = { taskId: bidId, rating, comment, reviewerId: account };
      console.log("Submitting rating for clientId (address):", clientId);
      console.log("Review data:", reviewData);

      const response = await axios.post(`http://localhost:5000/api/reviews/clients/${clientId}`, reviewData, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Server response:", response.data);

      setTasks(tasks.map((t) => (t._id === bidId ? { ...t, rated: true } : t)));
      setRatingTask(null);
      setRating(0);
      setComment("");
      addToast("Rating submitted successfully!", "success");
    } catch (err) {
      console.error("Rating error:", err.response ? err.response.data : err.message);
      setError("Failed to submit rating: " + (err.response?.data?.message || err.message));
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

      const clientAddr = await contract.client();
      const freelancerAddr = await contract.freelancer();
      const payment = await contract.payment();
      const dueDate = await contract.dueDate();
      const workSubmitted = await contract.workSubmitted();
      const workApproved = await contract.workApproved();

      const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=lkr");
      const lkrPerPol = response.data["matic-network"].lkr || 200;
      const lkrAmount = (Number(ethers.formatEther(payment)) * lkrPerPol).toFixed(2);

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
    "Manual Accepted": "bg-indigo-100 text-indigo-800",
    "Work Submitted": "bg-green-100 text-green-800",
    Completed: "bg-gray-100 text-gray-800",
  };

  const formatString = (str) =>
    str && typeof str === "string" ? `${str.slice(0, 6)}...${str.slice(-4)}` : "Not available";

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
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Ongoing Tasks</h2>
        {!account || account === "" ? (
          <div className="text-center bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">
              {error || "Please connect your wallet to view ongoing tasks."}
            </p>
            <button
              onClick={handleConnectWallet}
              disabled={Object.keys(loadingTasks).length > 0}
              className={`bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 transition ${
                Object.keys(loadingTasks).length > 0 ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Connect Wallet
            </button>
          </div>
        ) : loadingTasks.fetching ? (
          <div className="text-center">
            <p className="text-gray-600">Loading tasks...</p>
            <div className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mt-4"></div>
          </div>
        ) : error ? (
          <p className="text-center text-red-600 bg-red-50 p-4 rounded-lg">{error}</p>
        ) : (
          <>
            <div className="flex space-x-4 mb-6">
              {["All", "Contract Sent", "Accepted", "Manual Accepted", "Work Submitted", "Completed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveFilter(status)}
                  className={`px-4 py-2 rounded-md ${
                    activeFilter === status
                      ? "bg-teal-600 text-white"
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
                            className="text-teal-600 hover:underline"
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
                                : task.status === "Accepted" || task.status === "Manual Accepted"
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
                            className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
                            disabled={loadingTasks[task._id] || !task.contractAddress}
                          >
                            {loadingTasks[task._id] === "accepting" ? "Accepting..." : "Accept Job"}
                          </button>
                        </div>
                      )}
                      {(task.status === "Accepted" || task.status === "Manual Accepted" || task.status === "Work Submitted") && (
                        <div className="space-y-3">
                          <button
                            onClick={() => navigate(`/chat/${task._id}`)}
                            className="w-full bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
                            disabled={loadingTasks[task._id]}
                          >
                            Chat with Client
                          </button>
                          {(task.status === "Accepted" || task.status === "Manual Accepted") && (
                            <button
                              onClick={() => setSelectedTask(task)}
                              className="w-full bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
                              disabled={loadingTasks[task._id]}
                            >
                              {loadingTasks[task._id] === "submitting" ? "Submitting..." : "Submit Proof"}
                            </button>
                          )}
                        </div>
                      )}
                      {task.status === "Completed" && !task.rated && (
                        <button
                          onClick={() => setRatingTask(task)}
                          className="w-full bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition mt-3"
                          disabled={loadingTasks[task._id]}
                        >
                          Rate Client
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
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
                        className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
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
                        Proof of Work (e.g., IPFS Hash or Text)
                      </label>
                      <textarea
                        id="proof"
                        value={proof}
                        onChange={(e) => setProof(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 h-24 resize-none"
                        placeholder="Enter proof of work (e.g., IPFS hash or description)"
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
                      className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
                      disabled={loadingTasks[selectedTask._id] || (!proof && !pdfFile)}
                    >
                      {loadingTasks[selectedTask._id] === "submitting" ? "Submitting..." : "Submit Proof"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {ratingTask && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Rate Client</h3>
                  <div className="space-y-4">
                    <label className="block text-gray-700 font-medium">Rating (1-5):</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={rating}
                      onChange={(e) => setRating(Math.min(5, Math.max(1, e.target.value)))}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <label className="block text-gray-700 font-medium">Comment (optional):</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 h-24"
                    />
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setRatingTask(null)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => submitRating(ratingTask._id, ratingTask.clientId)}
                      className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
                      disabled={loadingTasks[ratingTask._id] || !rating}
                    >
                      {loadingTasks[ratingTask._id] === "rating" ? "Submitting..." : "Submit Rating"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <FreelancerFooter />
    </div>
  );
}