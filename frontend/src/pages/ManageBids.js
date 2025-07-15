import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Web3Context } from "../context/Web3Context";
import Layout from "../components/Layout";
import { ethers } from "ethers";
import { freelanceJobABI } from "../contracts/FreelanceJobABI.js";
import freelanceJobBytecode from "../contracts/FreelanceJobBytecode.js";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastContainer"; // Import useToast

export default function ManageBids() {
  const web3Context = useContext(Web3Context);
  const { account, provider } = web3Context || { account: "", provider: null };
  const [bids, setBids] = useState([]);
  const [loadingStates, setLoadingStates] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBid, setSelectedBid] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [viewingWork, setViewingWork] = useState(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [filteredBids, setFilteredBids] = useState([]);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [ratingBid, setRatingBid] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const navigate = useNavigate();
  const { addToast } = useToast(); // Initialize useToast

  useEffect(() => {
    async function fetchBidsAndTasks() {
      if (!account) {
        setError("Please connect your wallet to view bids.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const [bidsResponse, tasksResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/bids/client/${account}`),
          axios.get(`http://localhost:5000/api/tasks/client/${account}`),
        ]);
        const fetchedBids = Array.isArray(bidsResponse.data) ? bidsResponse.data : [];
        console.log("Fetched bids:", fetchedBids);
        setBids(fetchedBids);
        setFilteredBids(fetchedBids);
        setTasks(Array.isArray(tasksResponse.data) ? tasksResponse.data : []);
      } catch (error) {
        console.error("Error fetching bids or tasks:", error.message);
        setError("Failed to fetch bids or tasks: " + error.message);
        setBids([]);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBidsAndTasks();
  }, [account]);

  useEffect(() => {
    console.log("Active filter:", activeFilter);
    console.log("All bids before filtering:", bids);
    if (activeFilter === "All") {
      setFilteredBids(bids);
    } else if (activeFilter === "Completed") {
      setFilteredBids(bids.filter((bid) => bid.status === "Completed"));
    } else if (activeFilter === "On Progress") {
      setFilteredBids(
        bids.filter((bid) =>
          ["Pending", "Contract Sent", "Accepted", "Manual Accepted", "Work Submitted"].includes(bid.status)
        )
      );
    }
    console.log("Filtered bids:", filteredBids);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, bids]);

  const handleConnectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x13882" }],
        });
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (error) {
        console.error("Error connecting wallet:", error);
        setError("Failed to connect wallet: " + error.message);
      }
    } else {
      setError("MetaMask not detected.");
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

  const handleBidAccept = async (bidId, freelancer, amount) => {
    if (!bidId || !provider) {
      addToast("Error: Bid ID or wallet connection missing", "error");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, [bidId]: true }));
    try {
      await ensureCorrectNetwork();

      const bid = bids.find((b) => b._id === bidId);
      let task = bid.taskId && typeof bid.taskId === "object" ? bid.taskId : tasks.find((t) => t._id === bid.taskId);
      if (!task) throw new Error("Task not found for this bid");

      if (!ethers.isAddress(freelancer)) {
        throw new Error("Invalid freelancer address");
      }

      const dueDate = Math.floor(new Date(task.deadline).getTime() / 1000);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      if (dueDate <= currentTimestamp) {
        throw new Error("Due date must be in the future");
      }

      const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=lkr");
      const lkrPerPol = response.data["matic-network"].lkr || 200;
      const polAmount = ethers.parseEther((amount / lkrPerPol).toFixed(18));
      if (polAmount === 0n) {
        throw new Error("Payment amount must be greater than 0");
      }

      const signer = await provider.getSigner();
      await checkWalletBalance(signer, polAmount);

      const { gasPrice, gasLimit } = await getGasEstimates(provider);
      const factory = new ethers.ContractFactory(freelanceJobABI, freelanceJobBytecode, signer);
      const contract = await factory.deploy(freelancer, dueDate, {
        value: polAmount,
        gasPrice,
        gasLimit,
      });
      await contract.waitForDeployment();
      const contractAddress = await contract.getAddress();

      const updateResponse = await axios.post("http://localhost:5000/api/bids/update", {
        bidId,
        status: "Contract Sent",
        contractAddress,
      });
      console.log("Bid update response:", updateResponse.data);

      const updatedBidsResponse = await axios.get(`http://localhost:5000/api/bids/client/${account}`);
      const updatedBids = Array.isArray(updatedBidsResponse.data) ? updatedBidsResponse.data : [];
      console.log("Updated bids after accept:", updatedBids);
      setBids(updatedBids);
      setFilteredBids(updatedBids);
      addToast("Contract sent successfully!", "success");
    } catch (error) {
      console.error("Error accepting bid:", error);
      addToast(
        "Failed to accept bid: " +
        (error.reason || error.message) +
        ". Ensure you have enough test MATIC (get more from the Amoy faucet) and try resetting your MetaMask account (Account > Settings > Advanced > Reset Account).",
        "error"
      );
    } finally {
      setLoadingStates((prev) => ({ ...prev, [bidId]: false }));
      setSelectedBid(null);
    }
  };

  const handleSkipSmartContracts = async (bidId) => {
    if (!bidId) {
      addToast("Error: Bid ID missing", "error");
      return;
    }
    setLoadingStates((prev) => ({ ...prev, [bidId]: true }));
    try {
      await axios.post("http://localhost:5000/api/bids/update", {
        bidId,
        status: "Manual Accepted",
      });
      const updatedBidsResponse = await axios.get(`http://localhost:5000/api/bids/client/${account}`);
      setBids(Array.isArray(updatedBidsResponse.data) ? updatedBidsResponse.data : []);
      addToast("Bid accepted manually without smart contracts!", "success");
    } catch (error) {
      console.error("Error skipping smart contracts:", error);
      addToast("Failed to skip smart contracts: " + error.message, "error");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [bidId]: false }));
    }
  };

  const handleBidReject = async (bidId) => {
    if (!bidId) {
      addToast("Error: Bid ID missing", "error");
      return;
    }
    setLoadingStates((prev) => ({ ...prev, [bidId]: true }));
    try {
      await axios.post("http://localhost:5000/api/bids/update", { bidId, status: "Rejected Gainsight Pulse 2024" });
      const response = await axios.get(`http://localhost:5000/api/bids/client/${account}`);
      setBids(Array.isArray(response.data) ? response.data : []);
      addToast("Bid rejected successfully!", "success");
    } catch (error) {
      console.error("Error rejecting bid:", error);
      addToast("Failed to reject bid: " + error.message, "error");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [bidId]: false }));
    }
  };

  const handleViewWork = async (bid) => {
    try {
      if (bid.status === "Work Submitted" && bid.ipfsUrl) {
        setViewingWork({ ...bid, contractProof: bid.ipfsUrl });
      } else if (bid.contractAddress) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(bid.contractAddress, freelanceJobABI, provider);
        const proofOfWork = await contract.proofOfWork();
        setViewingWork({ ...bid, contractProof: proofOfWork });
      } else {
        setViewingWork({ ...bid, contractProof: "No proof available yet" });
      }
    } catch (error) {
      console.error("Error fetching work:", error);
      setViewingWork({ ...bid, contractProof: "Unable to fetch proof" });
    }
  };

  const handleApproveWork = async (contractAddress, bidId) => {
    if (!bidId) {
      addToast("Error: Bid ID missing", "error");
      return;
    }
    setLoadingStates((prev) => ({ ...prev, [bidId]: true }));
    try {
      const bid = bids.find((b) => b._id === bidId);
      if (!bid) throw new Error("Bid not found");

      if (bid.status === "Work Submitted") {
        if (bid.contractAddress && provider) {
          await ensureCorrectNetwork();
          const signer = await provider.getSigner();
          await checkWalletBalance(signer);

          const { gasPrice, gasLimit } = await getGasEstimates(provider);
          const contract = new ethers.Contract(bid.contractAddress, freelanceJobABI, signer);
          const tx = await contract.approveWork({ gasPrice, gasLimit });
          await tx.wait();
        }
        await axios.post("http://localhost:5000/api/bids/update", { bidId, status: "Completed" });
      } else {
        throw new Error("Work has not been submitted yet");
      }

      const updatedBidsResponse = await axios.get(`http://localhost:5000/api/bids/client/${account}`);
      setBids(Array.isArray(updatedBidsResponse.data) ? updatedBidsResponse.data : []);
      addToast("Work approved successfully!", "success");
      setViewingWork(null);
    } catch (error) {
      console.error("Error approving work:", error);
      addToast(
        "Failed to approve work: " +
        (error.reason || error.message) +
        ". Ensure you have enough test MATIC (get more from the Amoy faucet) and try resetting your MetaMask account (Account > Settings > Advanced > Reset Account).",
        "error"
      );
    } finally {
      setLoadingStates((prev) => ({ ...prev, [bidId]: false }));
    }
  };

  const fetchFreelancerProfile = async (freelancerId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/profiles/freelancers/${freelancerId}`);
      setSelectedFreelancer(response.data || {});
    } catch (err) {
      setError("Failed to fetch freelancer profile: " + err.message);
    }
  };

  const getSmartContractDetails = async (bid) => {
    let task = bid.taskId && typeof bid.taskId === "object" ? bid.taskId : tasks.find((t) => t._id === bid.taskId);
    if (!task) return { error: "Task not found" };

    const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=lkr");
    const lkrPerPol = response.data["matic-network"].lkr || 200;
    const polAmount = bid.amount / lkrPerPol;

    return {
      taskTitle: task.title,
      taskDescription: task.description,
      freelancerAddress: bid.freelancerId,
      clientAddress: account,
      lkrAmount: `${bid.amount} LKR`,
      polAmount: `${polAmount.toFixed(4)} POL`,
      dueDate: new Date(task.deadline).toLocaleDateString(),
      terms: "Payment will be released upon work approval.",
    };
  };

  const submitRating = async (bidId, freelancerId) => {
    try {
      setLoadingStates((prev) => ({ ...prev, [bidId]: "rating" }));
      const reviewData = { taskId: bidId, rating, comment, reviewerId: account };
      console.log("Submitting rating for freelancerId:", freelancerId);
      console.log("Review data:", reviewData);

      const response = await axios.post(`http://localhost:5000/api/reviews/freelancers/${freelancerId}`, reviewData, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Server response:", response.data);

      setBids(bids.map((b) => (b._id === bidId ? { ...b, rated: true } : b)));
      setRatingBid(null);
      setRating(0);
      setComment("");
      addToast("Rating submitted successfully!", "success");
    } catch (err) {
      console.error("Rating error:", err.response ? err.response.data : err.message);
      setError("Failed to submit rating: " + (err.response?.data?.message || err.message));
    } finally {
      setLoadingStates((prev) => ({ ...prev, [bidId]: undefined }));
    }
  };

  const formatAddress = (address) => {
    return address && typeof address === "string" ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not available";
  };

  return (
    <Layout>
      <div className="bg-white">
        <header className="bg-slate-800 text-white p-6 shadow-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Manage Your Bids</h1>
            {account && <span className="text-sm text-gray-300">Connected: {formatAddress(account)}</span>}
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8 min-h-screen bg-gray-100">
          {!account ? (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-gray-600 mb-4">Please connect your wallet to view and manage bids.</p>
              <button
                onClick={handleConnectWallet}
                className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 transition"
              >
                Connect Wallet
              </button>
            </div>
          ) : isLoading ? (
            <div className="text-center">
              <p className="text-gray-600">Loading bids...</p>
              <div className="animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mt-4"></div>
            </div>
          ) : error ? (
            <p className="text-center text-red-600 bg-red-50 p-4 rounded-lg">{error}</p>
          ) : (
            <>
              <div className="flex space-x-4 mb-6">
                {["All", "Completed", "On Progress"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      activeFilter === filter
                        ? "bg-teal-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    } transition`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {filteredBids.length === 0 ? (
                <p className="text-center text-gray-600 bg-white p-6 rounded-lg shadow-md">
                  No bids available for {formatAddress(account)}. Check your backend or filters.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBids.map((bid) => (
                    <div
                      key={bid._id}
                      className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Freelancer Bid</h3>
                          <p className="text-sm text-gray-500">{formatAddress(bid.freelancerId)}</p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            bid.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : bid.status === "Contract Sent"
                              ? "bg-blue-100 text-blue-800"
                              : bid.status === "Accepted" || bid.status === "Manual Accepted"
                              ? "bg-indigo-100 text-indigo-800"
                              : bid.status === "Work Submitted"
                              ? "bg-green-100 text-green-800"
                              : bid.status === "Completed"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {bid.status}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">
                        <strong>Amount:</strong> {bid.amount} LKR
                      </p>
                      <p className="text-gray-700 mb-4">
                        <strong>Message:</strong> {bid.message}
                      </p>
                      {bid.contractAddress && (
                        <p className="text-gray-600 text-sm mb-4">
                          <strong>Contract:</strong>{" "}
                          <a
                            href={`https://amoy.polygonscan.com/address/${bid.contractAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-600 hover:underline"
                          >
                            {formatAddress(bid.contractAddress)}
                          </a>
                        </p>
                      )}
                      <button
                        onClick={() => fetchFreelancerProfile(bid.freelancerId)}
                        className="w-full bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition mb-3"
                        disabled={loadingStates[bid._id] || !account}
                      >
                        View Freelancer Profile
                      </button>
                      {bid.status === "Pending" && (
                        <div className="space-y-3">
                          <button
                            onClick={async () => {
                              const details = await getSmartContractDetails(bid);
                              setSelectedBid({ ...bid, contractDetails: details });
                            }}
                            className="w-full bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
                            disabled={loadingStates[bid._id] || !account}
                          >
                            {loadingStates[bid._id] ? "Processing..." : "Review & Accept"}
                          </button>
                          <button
                            onClick={() => handleSkipSmartContracts(bid._id)}
                            className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
                            disabled={loadingStates[bid._id] || !account}
                          >
                            {loadingStates[bid._id] ? "Processing..." : "Skip Smart Contracts"}
                          </button>
                          <button
                            onClick={() => handleBidReject(bid._id)}
                            className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                            disabled={loadingStates[bid._id] || !account}
                          >
                            {loadingStates[bid._id] ? "Processing..." : "Reject"}
                          </button>
                        </div>
                      )}
                      {(bid.status === "Manual Accepted" || bid.status === "Accepted" || bid.status === "Work Submitted") && (
                        <div className="space-y-3">
                          <button
                            onClick={() => navigate(`/chat/${bid._id}`)}
                            className="w-full bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
                            disabled={loadingStates[bid._id] || !account}
                          >
                            Chat with Freelancer
                          </button>
                          {bid.status === "Work Submitted" && (
                            <button
                              onClick={() => handleViewWork(bid)}
                              className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
                              disabled={loadingStates[bid._id] || !account}
                            >
                              View Submitted Work
                            </button>
                          )}
                        </div>
                      )}
                      {bid.status === "Completed" && !bid.rated && (
                        <button
                          onClick={() => setRatingBid(bid)}
                          className="w-full bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition mt-3"
                          disabled={loadingStates[bid._id] || !account}
                        >
                          Rate Freelancer
                        </button>
                      )}
                      {bid.status === "Completed" && bid.rated && (
                        <p className="text-gray-600 text-sm mt-3">Freelancer Rated</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {selectedFreelancer && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Freelancer Profile</h3>
                <div className="space-y-4">
                  <p><strong>Name:</strong> {selectedFreelancer.name || "Unnamed Freelancer"}</p>
                  <p><strong>Title:</strong> {selectedFreelancer.title || "No title"}</p>
                  <p><strong>Rating:</strong> {selectedFreelancer.rating ? selectedFreelancer.rating.toFixed(1) : "0.0"}/5</p>
                  <p><strong>Bio:</strong> {selectedFreelancer.bio || "No bio"}</p>
                  <p>
                    <strong>Skills:</strong>{" "}
                    {Array.isArray(selectedFreelancer.skills) && selectedFreelancer.skills.length > 0
                      ? selectedFreelancer.skills.join(", ")
                      : "None"}
                  </p>
                  <p><strong>Completed Jobs:</strong> {selectedFreelancer.completedJobs || 0}</p>
                </div>
                <button
                  onClick={() => setSelectedFreelancer(null)}
                  className="mt-6 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {selectedBid && selectedBid.contractDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Contract Details</h3>
                {selectedBid.contractDetails.error ? (
                  <div>
                    <p className="text-red-600">{selectedBid.contractDetails.error}</p>
                    <p className="text-gray-600 mt-2">
                      Note: You can still proceed with the contract, but ensure the task exists.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 text-gray-700">
                    <div className="flex justify-between">
                      <span className="font-medium">Task Title:</span>
                      <span>{selectedBid.contractDetails.taskTitle || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Description:</span>
                      <span>{selectedBid.contractDetails.taskDescription || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Freelancer:</span>
                      <span>{formatAddress(selectedBid.contractDetails.freelancerAddress)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Client:</span>
                      <span>{formatAddress(selectedBid.contractDetails.clientAddress)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Amount (LKR):</span>
                      <span>{selectedBid.contractDetails.lkrAmount || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Amount (POL):</span>
                      <span>{selectedBid.contractDetails.polAmount || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Due Date:</span>
                      <span>{selectedBid.contractDetails.dueDate || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Terms:</span>
                      <span>{selectedBid.contractDetails.terms || "N/A"}</span>
                    </div>
                  </div>
                )}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setSelectedBid(null)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleBidAccept(selectedBid._id, selectedBid.freelancerId, selectedBid.amount)}
                    className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
                    disabled={loadingStates[selectedBid._id] || !account}
                  >
                    {loadingStates[selectedBid._id] ? "Sending..." : "Send Contract"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {viewingWork && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Submitted Work</h3>
                <div className="space-y-4 text-gray-700">
                  {viewingWork.ipfsUrl && (
                    <div>
                      <p className="font-medium">PDF Submission:</p>
                      <a
                        href={viewingWork.ipfsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 hover:underline"
                      >
                        View PDF
                      </a>
                    </div>
                  )}
                  {viewingWork.contractProof && (
                    <div>
                      <p className="font-medium">Contract Proof:</p>
                      {viewingWork.contractProof.startsWith("https://gateway.pinata.cloud/ipfs/") ? (
                        <a
                          href={viewingWork.contractProof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:underline"
                        >
                          View Proof on Pinata (IPFS)
                        </a>
                      ) : (
                        <p className="text-gray-600">{viewingWork.contractProof}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setViewingWork(null)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
                  >
                    Close
                  </button>
                  {viewingWork.status === "Work Submitted" && (
                    <button
                      onClick={() => handleApproveWork(viewingWork.contractAddress, viewingWork._id)}
                      className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
                      disabled={loadingStates[viewingWork._id] || !account}
                    >
                      {loadingStates[viewingWork._id] ? "Approving..." : "Approve Work"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {ratingBid && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Rate Freelancer</h3>
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
                    onClick={() => setRatingBid(null)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => submitRating(ratingBid._id, ratingBid.freelancerId)}
                    className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition"
                    disabled={loadingStates[ratingBid._id] || !rating}
                  >
                    {loadingStates[ratingBid._id] === "rating" ? "Submitting..." : "Submit Rating"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="bg-slate-800 text-white p-4 mt-8">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm">© 2025 FreeWork. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Layout>
  );
}