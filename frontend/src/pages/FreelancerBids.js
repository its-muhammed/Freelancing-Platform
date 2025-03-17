import { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { freelanceJobABI } from "../contracts/FreelanceJobABI.js";

export default function FreelancerBids() {
  const [bids, setBids] = useState([]);
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize wallet connection
  useEffect(() => {
    async function init() {
      if (!window.ethereum) {
        setError("MetaMask is not installed");
        return;
      }
      try {
        // Switch to Polygon Amoy testnet
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x13882" }],
        });
        // Connect wallet
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
        console.log("Connected account:", accounts[0]);
      } catch (error) {
        console.error("Error connecting MetaMask:", error);
        setError("Failed to connect wallet: " + error.message);
      }
    }
    init();
  }, []); // Run once on mount

  // Fetch bids when account changes
  useEffect(() => {
    async function fetchBids() {
      if (!account) return;
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`http://localhost:5000/api/bids/freelancer/${account}`);
        console.log("Fetched bids for account", account, ":", response.data);
        setBids(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching bids:", error);
        setError("Failed to load bids: " + error.message);
      } finally {
        setLoading(false);
      }
    }

    if (account) {
      fetchBids();
    }
  }, [account]);

  // Handle contract acceptance
  const handleAcceptContract = async (bidId, contractAddress) => {
    try {
      setLoading(true);
      if (!window.ethereum) throw new Error("MetaMask is not installed");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, freelanceJobABI, signer);

      const tx = await contract.acceptJob();
      await tx.wait();

      await axios.post("http://localhost:5000/api/bids/update", { bidId, status: "Accepted" });
      alert("Contract accepted!");
      // Refresh bids to ensure UI reflects latest state
      const response = await axios.get(`http://localhost:5000/api/bids/freelancer/${account}`);
      setBids(response.data);
    } catch (error) {
      console.error("Error accepting contract:", error);
      alert("Failed to accept contract: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh handler
  const handleRefresh = async () => {
    if (!account) return;
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`http://localhost:5000/api/bids/freelancer/${account}`);
      setBids(response.data);
    } catch (error) {
      console.error("Error refreshing bids:", error);
      setError("Failed to refresh bids: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-md max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Your Bids</h2>
        {account && (
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh Bids"}
          </button>
        )}
      </div>

      {/* Wallet Connection Status */}
      {!account && !error && (
        <p className="text-gray-600">Connecting to wallet...</p>
      )}
      {error && (
        <p className="text-red-600 bg-red-50 p-3 rounded-md mb-4">{error}</p>
      )}

      {/* Bids Display */}
      {account && !error && (
        <>
          {loading && !bids.length ? (
            <p className="text-gray-600">Loading bids...</p>
          ) : bids.length === 0 ? (
            <p className="text-gray-600">No bids available for {account}.</p>
          ) : (
            <div className="space-y-4">
              {bids.map((bid) => (
                <div key={bid._id} className="border p-4 rounded-md bg-gray-50">
                  <p><strong>Client:</strong> {bid.clientId}</p>
                  <p><strong>Amount:</strong> {bid.amount} LKR</p> {/* Assuming LKR from backend */}
                  <p><strong>Message:</strong> {bid.message}</p>
                  <p><strong>Status:</strong> {bid.status}</p>
                  {bid.contractAddress && (
                    <p>
                      <strong>Contract:</strong>{" "}
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
                  {bid.status === "Contract Sent" && (
                    <button
                      onClick={() => handleAcceptContract(bid._id, bid.contractAddress)}
                      className="mt-3 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Accept Contract"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}