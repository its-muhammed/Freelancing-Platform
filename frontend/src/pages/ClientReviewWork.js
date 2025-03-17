import { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import { freelanceJobABI } from "../contracts/FreelanceJobABI.js";
import Layout from "../components/Layout";

export default function ClientReviewWork() {
  const [account, setAccount] = useState("");
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function getAccount() {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          setAccount(accounts[0]);
        } catch (error) {
          setError("Failed to connect wallet: " + error.message);
        }
      } else {
        setError("MetaMask not detected.");
      }
    }
    getAccount();
  }, []);

  useEffect(() => {
    async function fetchContracts() {
      if (!account) return;
      setLoading(true);
      try {
        // Fetch bids submitted by the client that have status "Work Submitted"
        // (Assuming your backend supports filtering by status via query parameters)
        const response = await axios.get(`http://localhost:5000/api/bids/client/${account}?status=Work Submitted`);
        setContracts(response.data);
      } catch (error) {
        setError("Failed to fetch contracts: " + error.message);
      } finally {
        setLoading(false);
      }
    }
    if (account) {
      fetchContracts();
    }
  }, [account]);

  const handleApproveWork = async (contractAddress, bidId) => {
    try {
      if (!window.ethereum) throw new Error("MetaMask is not installed");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, freelanceJobABI, signer);
      const tx = await contract.approveWork();
      await tx.wait();
      await axios.post("http://localhost:5000/api/bids/update", { bidId, status: "Completed" });
      alert("Work approved, funds transferred!");
      // Refresh list after approval
      const response = await axios.get(`http://localhost:5000/api/bids/client/${account}?status=Work Submitted`);
      setContracts(response.data);
    } catch (error) {
      alert("Failed to approve work: " + (error.reason || error.message));
    }
  };

  return (
    <Layout userType="client">
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-6">Review Freelancer Work</h2>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : contracts.length === 0 ? (
          <p>No work submissions available.</p>
        ) : (
          contracts.map((contract) => (
            <div key={contract._id} className="border p-4 rounded-md mb-4">
              <h3 className="text-xl font-semibold">Bid ID: {contract._id}</h3>
              <p>
                <strong>Freelancer:</strong> {contract.freelancerId}
              </p>
              <p>
                <strong>Message:</strong> {contract.message}
              </p>
              <p>
                <strong>Proof:</strong>{" "}
                {contract.proofOfWork ? (
                  contract.proofOfWork.endsWith(".pdf") ? (
                    <a href={contract.proofOfWork} target="_blank" rel="noopener noreferrer">
                      View PDF
                    </a>
                  ) : (
                    contract.proofOfWork
                  )
                ) : (
                  "N/A"
                )}
              </p>
              {contract.ipfsUrl && (
                <p>
                  <strong>IPFS Document:</strong>{" "}
                  <a href={contract.ipfsUrl} target="_blank" rel="noopener noreferrer">
                    View on IPFS
                  </a>
                </p>
              )}
              <button
                onClick={() => handleApproveWork(contract.contractAddress, contract._id)}
                className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Approve Work
              </button>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
