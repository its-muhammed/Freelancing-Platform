import { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { freelanceJobABI } from "../contracts/FreelanceJobABI.js";

export default function FreelancerBids() {
  const [bids, setBids] = useState([]);
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchBids() {
      if (!account) return;
      try {
        const response = await axios.get(`http://localhost:5000/api/bids/freelancer/${account}`);
        console.log("Fetched bids for account", account, ":", response.data);
        setBids(response.data);
      } catch (error) {
        console.error("Error fetching bids:", error);
      }
    }

    async function getAccount() {
      if (window.ethereum) {
        try {
          await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x13882" }] });
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          setAccount(accounts[0]);
          console.log("Connected account:", accounts[0]);
        } catch (error) {
          console.error("Error fetching MetaMask account:", error);
        }
      }
    }

    getAccount();
    fetchBids();
  }, [account]);

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
      setBids(bids.map(bid => bid._id === bidId ? { ...bid, status: "Accepted" } : bid));
    } catch (error) {
      console.error("Error accepting contract:", error);
      alert("Failed to accept contract: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-bold mb-4">Your Bids</h2>
      {bids.length === 0 ? (
        <p>No bids available.</p>
      ) : (
        bids.map((bid) => (
          <div key={bid._id} className="border p-4 mb-3 rounded-md">
            <p><strong>Client:</strong> {bid.clientId}</p>
            <p><strong>Amount:</strong> {bid.amount} POL</p>
            <p><strong>Message:</strong> {bid.message}</p>
            <p><strong>Status:</strong> {bid.status}</p>
            {bid.contractAddress && <p><strong>Contract:</strong> {bid.contractAddress}</p>}
            {bid.status === "Contract Sent" && (
              <button
                onClick={() => handleAcceptContract(bid._id, bid.contractAddress)}
                className="mt-3 bg-green-600 text-white px-4 py-2 rounded-md"
                disabled={loading}
              >
                {loading ? "Processing..." : "Accept Contract"}
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}