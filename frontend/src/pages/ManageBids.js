import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Web3Context } from "../context/Web3Context";
import Layout from "../components/Layout";
import { ethers } from "ethers";
import { freelanceJobABI } from "../contracts/FreelanceJobABI.js";
import freelanceJobBytecode from "../contracts/FreelanceJobBytecode.js";

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

  console.log("Current account:", account);

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
        console.log("Fetched bids:", bidsResponse.data);
        console.log("Fetched tasks:", tasksResponse.data);
        setBids(Array.isArray(bidsResponse.data) ? bidsResponse.data : []);
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

  const handleConnectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
      } catch (error) {
        console.error("Error connecting wallet:", error);
        setError("Failed to connect wallet: " + error.message);
      }
    } else {
      setError("MetaMask not detected.");
    }
  };

  const handleBidAccept = async (bidId, freelancer, amount) => {
    if (!bidId || !provider) {
      console.error("Invalid bidId or provider:", bidId, provider);
      alert("Error: Bid ID or wallet connection missing");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, [bidId]: true }));
    try {
      console.log(`Accepting bid ${bidId} for freelancer ${freelancer} with amount ${amount} LKR`);

      const bid = bids.find((b) => b._id === bidId);
      let task;
      if (bid.taskId && typeof bid.taskId === "object" && bid.taskId._id) {
        task = bid.taskId;
      } else {
        task = tasks.find((t) => t._id === bid.taskId);
      }
      if (!task) throw new Error("Task not found for this bid");

      const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=lkr");
      const lkrPerPol = response.data["matic-network"].lkr || 200;
      const polAmount = ethers.parseEther((amount / lkrPerPol).toFixed(18));

      const signer = await provider.getSigner();
      const factory = new ethers.ContractFactory(freelanceJobABI, freelanceJobBytecode, signer);
      const dueDate = Math.floor(new Date(task.deadline).getTime() / 1000);
      const contract = await factory.deploy(freelancer, dueDate, { value: polAmount });
      await contract.waitForDeployment();
      const contractAddress = await contract.getAddress();

      const updateResponse = await axios.post("http://localhost:5000/api/bids/update", {
        bidId,
        status: "Contract Sent",
        contractAddress,
      });
      console.log("Bid update response:", updateResponse.data);

      const updatedBidsResponse = await axios.get(`http://localhost:5000/api/bids/client/${account}`);
      console.log("Refreshed bids after accept:", updatedBidsResponse.data);
      setBids(Array.isArray(updatedBidsResponse.data) ? updatedBidsResponse.data : []);

      alert("Contract sent successfully!");
    } catch (error) {
      console.error("Error accepting bid:", error);
      alert("Failed to accept bid: " + (error.reason || error.message));
    } finally {
      setLoadingStates((prev) => ({ ...prev, [bidId]: false }));
      setSelectedBid(null);
    }
  };

  const handleBidReject = async (bidId) => {
    if (!bidId) return alert("Error: Bid ID missing");
    setLoadingStates((prev) => ({ ...prev, [bidId]: true }));
    try {
      await axios.post("http://localhost:5000/api/bids/update", { bidId, status: "Rejected" });
      const response = await axios.get(`http://localhost:5000/api/bids/client/${account}`);
      console.log("Refreshed bids after reject:", response.data);
      setBids(Array.isArray(response.data) ? response.data : []);
      alert("Bid rejected successfully!");
    } catch (error) {
      console.error("Error rejecting bid:", error);
      alert("Failed to reject bid: " + error.message);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [bidId]: false }));
    }
  };

  const handleViewWork = async (bid) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(bid.contractAddress, freelanceJobABI, provider);
      const proofOfWork = await contract.proofOfWork();

      setViewingWork({
        ...bid,
        contractProof: proofOfWork,
      });
    } catch (error) {
      console.error("Error fetching work:", error);
      setViewingWork({
        ...bid,
        contractProof: "Unable to fetch proof from contract",
      });
    }
  };

  const handleApproveWork = async (contractAddress, bidId) => {
    if (!bidId || !provider) return alert("Error: Bid ID or MetaMask connection missing");
    setLoadingStates((prev) => ({ ...prev, [bidId]: true }));
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, freelanceJobABI, signer);
      const tx = await contract.approveWork();
      await tx.wait();
      await axios.post("http://localhost:5000/api/bids/update", { 
        bidId, 
        status: "Completed" 
      });
      const updatedBidsResponse = await axios.get(`http://localhost:5000/api/bids/client/${account}`);
      console.log("Refreshed bids after approval:", updatedBidsResponse.data);
      setBids(Array.isArray(updatedBidsResponse.data) ? updatedBidsResponse.data : []);
      alert("Work approved, funds transferred!");
      setViewingWork(null);
    } catch (error) {
      console.error("Error approving work:", error);
      alert("Failed to approve work: " + (error.reason || error.message));
    } finally {
      setLoadingStates((prev) => ({ ...prev, [bidId]: false }));
    }
  };

  const getSmartContractDetails = async (bid) => {
    console.log("Bid taskId:", bid.taskId);
    console.log("Available tasks:", tasks);

    let task;
    if (bid.taskId && typeof bid.taskId === "object" && bid.taskId._id) {
      task = bid.taskId;
    } else {
      task = tasks.find((t) => t._id === bid.taskId);
    }
    if (!task) {
      console.error("Task not found for taskId:", bid.taskId);
      return { error: "Task not found. Proceed with caution or create the task first." };
    }

    const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=lkr");
    const lkrPerPol = response.data["matic-network"].lkr || 200;
    const polAmount = bid.amount / lkrPerPol;

    const dueDate = new Date(task.deadline).toLocaleDateString();
    return {
      taskTitle: task.title,
      taskDescription: task.description,
      freelancerAddress: bid.freelancerId,
      clientAddress: account,
      lkrAmount: `${bid.amount} LKR`,
      polAmount: `${polAmount.toFixed(4)} POL`,
      dueDate: dueDate,
      terms: "Payment will be released upon work approval.",
    };
  };

  const formatAddress = (address) => {
    if (!address || typeof address !== "string") return "Not available";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6 rounded-lg mb-6 shadow-md">
          <h2 className="text-3xl font-bold">Manage Your Bids</h2>
        </header>
        {!account ? (
          <div className="text-center bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">Please connect your wallet to view and manage bids.</p>
            <button
              onClick={handleConnectWallet}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Connect Wallet
            </button>
          </div>
        ) : isLoading ? (
          <div className="text-center">
            <p className="text-gray-600">Loading bids...</p>
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mt-4"></div>
          </div>
        ) : error ? (
          <p className="text-center text-red-600 bg-red-50 p-4 rounded-lg">{error}</p>
        ) : bids.length === 0 ? (
          <p className="text-center text-gray-600 bg-white p-6 rounded-lg shadow-md">
            No bids available for {formatAddress(account)}.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bids.map((bid) => (
              <div
                key={bid._id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Bid by Freelancer</h3>
                    <p className="text-sm text-gray-600">{formatAddress(bid.freelancerId)}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      bid.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : bid.status === "Contract Sent"
                        ? "bg-blue-100 text-blue-800"
                        : bid.status === "Accepted"
                        ? "bg-indigo-100 text-indigo-800"
                        : bid.status === "Work Submitted"
                        ? "bg-green-100 text-green-800"
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
                    <strong>Contract Address:</strong>{" "}
                    <a
                      href={`https://amoy.polygonscan.com/address/${bid.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {formatAddress(bid.contractAddress)}
                    </a>
                  </p>
                )}
                {bid.status === "Pending" && (
                  <div className="flex space-x-3">
                    <button
                      onClick={async () => {
                        const details = await getSmartContractDetails(bid);
                        setSelectedBid({ ...bid, contractDetails: details });
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition w-full"
                      disabled={loadingStates[bid._id] || !account}
                    >
                      {loadingStates[bid._id] ? "Processing..." : "Review & Accept"}
                    </button>
                    <button
                      onClick={() => handleBidReject(bid._id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition w-full"
                      disabled={loadingStates[bid._id] || !account}
                    >
                      {loadingStates[bid._id] ? "Processing..." : "Reject"}
                    </button>
                  </div>
                )}
                {bid.status === "Work Submitted" && (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleViewWork(bid)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition w-full"
                      disabled={loadingStates[bid._id] || !account}
                    >
                      View Submitted Work
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {viewingWork && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Submitted Work</h3>
              <div className="space-y-4">
                {viewingWork.submittedMessage && (
                  <div>
                    <p className="font-medium text-gray-700">Message:</p>
                    <p className="text-gray-600 bg-gray-100 p-2 rounded">{viewingWork.submittedMessage}</p>
                  </div>
                )}
                {viewingWork.proof && (
                  <div>
                    <p className="font-medium text-gray-700">Proof:</p>
                    <p className="text-gray-600 bg-gray-100 p-2 rounded">{viewingWork.proof}</p>
                  </div>
                )}
                {viewingWork.ipfsUrl && (
                  <div>
                    <p className="font-medium text-gray-700">PDF Submission:</p>
                    <a
                      href={viewingWork.ipfsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View PDF
                    </a>
                  </div>
                )}
                {viewingWork.contractProof && (
                  <div>
                    <p className="font-medium text-gray-700">Contract Proof:</p>
                    {viewingWork.contractProof.startsWith("https://gateway.pinata.cloud/ipfs/") ? (
                      <a
                        href={viewingWork.contractProof}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Proof on Pinata (IPFS)
                      </a>
                    ) : (
                      <p className="text-gray-600 bg-gray-100 p-2 rounded">{viewingWork.contractProof}</p>
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
                <button
                  onClick={() => handleApproveWork(viewingWork.contractAddress, viewingWork._id)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                  disabled={loadingStates[viewingWork._id] || !account}
                >
                  {loadingStates[viewingWork._id] ? "Approving..." : "Approve Work"}
                </button>
              </div>
            </div>
          </div>
        )}

      {selectedBid && selectedBid.contractDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Smart Contract Preview</h3>
            {selectedBid.contractDetails.error ? (
              <div>
                <p className="text-red-600">{selectedBid.contractDetails.error}</p>
                <p className="text-gray-600 mt-2">
                  Note: You can still proceed with the contract, but ensure the task exists.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p><strong>Task Title:</strong> {selectedBid.contractDetails.taskTitle || "N/A"}</p>
                <p><strong>Description:</strong> {selectedBid.contractDetails.taskDescription || "N/A"}</p>
                <p><strong>Freelancer Address:</strong> {formatAddress(selectedBid.contractDetails.freelancerAddress)}</p>
                <p><strong>Client Address:</strong> {formatAddress(selectedBid.contractDetails.clientAddress)}</p>
                <p><strong>Amount (LKR):</strong> {selectedBid.contractDetails.lkrAmount || "N/A"}</p>
                <p><strong>Amount (POL):</strong> {selectedBid.contractDetails.polAmount || "N/A"}</p>
                <p><strong>Due Date:</strong> {selectedBid.contractDetails.dueDate || "N/A"}</p>
                <p><strong>Terms:</strong> {selectedBid.contractDetails.terms || "N/A"}</p>
              </div>
            )}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedBid(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBidAccept(selectedBid._id, selectedBid.freelancerId, selectedBid.amount)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                disabled={loadingStates[selectedBid._id] || !account}
              >
                {loadingStates[selectedBid._id] ? "Sending..." : "Send Contract"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}