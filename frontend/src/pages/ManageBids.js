import { useState, useEffect, useContext } from "react";
import axios from "axios";
//import { useNavigate } from "react-router-dom";
import { Web3Context } from "../context/Web3Context";
import Layout from "../components/Layout";

export default function ManageBids() {
  const web3Context = useContext(Web3Context);
  const { account, provider } = web3Context || { account: "", provider: null };
  const [bids, setBids] = useState([]);
  const [loadingStates, setLoadingStates] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBid, setSelectedBid] = useState(null);
  //const navigate = useNavigate();

  // Function to fetch bids
  useEffect(() => {
    async function fetchBids() {
      if (!account) {
        console.log("No account connected yet");
        setError("Please connect your wallet to view bids.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        console.log(`Fetching bids for client: ${account}`);
        const response = await axios.get(`http://localhost:5000/api/bids/client/${account}`);
        console.log("API response:", response.data);
        setBids(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching bids:", error.message);
        setError("Failed to fetch bids: " + error.message);
        setBids([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBids();
  }, [account]);

  const handleConnectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log("Wallet connection requested");
      } catch (error) {
        console.error("Error connecting wallet:", error);
        setError("Failed to connect wallet: " + error.message);
      }
    } else {
      setError("MetaMask not detected.");
    }
  };

  const handleBidAccept = async (bidId, freelancer, amount) => {
    if (!bidId) {
      console.error("Invalid bidId:", bidId);
      alert("Error: Bid ID missing");
      return;
    }

    setLoadingStates(prev => ({ ...prev, [bidId]: true }));
    try {
      console.log(`Accepting bid ${bidId} for freelancer ${freelancer} with amount ${amount} LKR`);
      const response = await axios.post("http://localhost:5000/api/bids/update", {
        bidId,
        status: "Contract Sent",
      });

      const updatedBid = response.data;
      console.log(`Bid ${bidId} updated:`, updatedBid);

      setBids(bids.map(bid => (bid._id === bidId ? updatedBid : bid)));
      const updatedBids = await axios.get(`http://localhost:5000/api/bids/client/${account}`);
      setBids(updatedBids.data);
    } catch (error) {
      console.error("Error accepting bid:", error);
      alert("Failed to accept bid: " + (error.response?.data?.message || error.message));
    } finally {
      setLoadingStates(prev => ({ ...prev, [bidId]: false }));
      setSelectedBid(null);
    }
  };

  const handleBidReject = async (bidId) => {
    if (!bidId) return alert("Error: Bid ID missing");
    setLoadingStates(prev => ({ ...prev, [bidId]: true }));
    try {
      await axios.post("http://localhost:5000/api/bids/update", { bidId, status: "Rejected" });
      alert("Bid rejected successfully!");
      setBids(bids.map(bid => (bid._id === bidId ? { ...bid, status: "Rejected" } : bid)));
      const response = await axios.get(`http://localhost:5000/api/bids/client/${account}`);
      setBids(response.data);
    } catch (error) {
      console.error("Error rejecting bid:", error);
      alert("Failed to reject bid: " + error.message);
    } finally {
      setLoadingStates(prev => ({ ...prev, [bidId]: false }));
    }
  };

  const handleApproveWork = async (contractAddress, bidId) => {
    if (!bidId || !provider) return alert("Error: Bid ID or MetaMask connection missing");
    setLoadingStates(prev => ({ ...prev, [bidId]: true }));
    try {
      const { ethers } = require("ethers");
      const signer = await provider.getSigner();
      const { freelanceJobABI } = require("../contracts/FreelanceJobABI.js");

      const contract = new ethers.Contract(contractAddress, freelanceJobABI, signer);
      console.log(`Approving work for contract: ${contractAddress}`);

      const gasEstimate = await contract.estimateGas.approveWork();
      console.log("Estimated gas:", gasEstimate.toString());

      const gasLimit = gasEstimate * 120n / 100n;
      const tx = await contract.approveWork({ gasLimit });
      console.log("Transaction sent, hash:", tx.hash);
      await tx.wait();
      console.log("Transaction confirmed");

      await axios.post("http://localhost:5000/api/bids/update", { bidId, status: "Completed" });
      alert("Work approved, funds transferred!");
      setBids(bids.map(bid => (bid._id === bidId ? { ...bid, status: "Completed" } : bid)));
    } catch (error) {
      console.error("Error approving work:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        data: error.data,
        reason: error.reason,
      });
      alert("Failed to approve work: " + (error.message || "Unknown error - check console"));
    } finally {
      setLoadingStates(prev => ({ ...prev, [bidId]: false }));
    }
  };

  const getSmartContractDetails = (bid) => {
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
    return {
      amount: `${bid.amount} LKR`,
      dueDate: dueDate,
      freelancer: bid.freelancerId,
      terms: "Payment will be released upon work approval.",
    };
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
            No bids available for {account.slice(0, 6)}...{account.slice(-4)}.
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
                    <p className="text-sm text-gray-600">
                      {bid.freelancerId.slice(0, 6)}...{bid.freelancerId.slice(-4)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      bid.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : bid.status === "Contract Sent"
                        ? "bg-blue-100 text-blue-800"
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
                      {bid.contractAddress.slice(0, 6)}...{bid.contractAddress.slice(-4)}
                    </a>
                  </p>
                )}
                {bid.status === "Pending" && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSelectedBid(bid)}
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
                  <button
                    onClick={() => handleApproveWork(bid.contractAddress, bid._id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition w-full"
                    disabled={loadingStates[bid._id] || !account}
                  >
                    {loadingStates[bid._id] ? "Approving..." : "Approve Work"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Smart Contract Preview Modal */}
      {selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Smart Contract Preview</h3>
            <div className="space-y-3">
              <p>
                <strong>Amount:</strong> {getSmartContractDetails(selectedBid).amount}
              </p>
              <p>
                <strong>Due Date:</strong> {getSmartContractDetails(selectedBid).dueDate}
              </p>
              <p>
                <strong>Freelancer:</strong>{" "}
                {getSmartContractDetails(selectedBid).freelancer.slice(0, 6)}...
                {getSmartContractDetails(selectedBid).freelancer.slice(-4)}
              </p>
              <p>
                <strong>Terms:</strong> {getSmartContractDetails(selectedBid).terms}
              </p>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedBid(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleBidAccept(selectedBid._id, selectedBid.freelancerId, selectedBid.amount)
                }
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