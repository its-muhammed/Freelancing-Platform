import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ManageBids() {
  const [bids, setBids] = useState([]);
  const [account, setAccount] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchBids() {
      if (!account) return;
      try {
        const response = await axios.get(`http://localhost:5000/api/bids/client/${account}`);
        setBids(response.data);
      } catch (error) {
        console.error("Error fetching bids:", error);
      }
    }

    async function getAccount() {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          setAccount(accounts[0]);
        } catch (error) {
          console.error("Error fetching MetaMask account", error);
        }
      }
    }

    getAccount();
    fetchBids();
  }, [account]);

  const handleBidUpdate = async (bidId, status) => {
    try {
      await axios.post("http://localhost:5000/api/bids/update", { bidId, status });
      alert(`Bid ${status.toLowerCase()} successfully!`);
      setBids(bids.map(bid => bid._id === bidId ? { ...bid, status } : bid));
    } catch (error) {
      console.error("Error updating bid:", error);
      alert("Failed to update bid.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 text-gray-900">
      <header className="w-full bg-blue-700 py-4 flex justify-between px-8">
        <h1 className="text-white text-2xl font-bold">Manage Bids</h1>
        <button
          onClick={() => navigate("/client-dashboard")}
          className="bg-white text-blue-700 px-4 py-2 rounded-md"
        >
          Back
        </button>
      </header>

      <div className="mt-8 w-2/3">
        {bids.length === 0 ? (
          <p className="text-center text-gray-600">No bids available.</p>
        ) : (
          bids.map((bid) => (
            <div key={bid._id} className="bg-white p-4 shadow-md rounded-md mb-4">
              <p className="text-gray-700"><strong>Freelancer:</strong> {bid.freelancerId}</p>
              <p className="text-gray-700"><strong>Bid Amount:</strong> LKR {bid.amount}</p>
              <p className="text-gray-500"><strong>Message:</strong> {bid.message}</p>
              <p className="text-gray-500"><strong>Status:</strong> {bid.status}</p>

              {bid.status === "Pending" && (
                <div className="mt-3">
                  <button
                    onClick={() => handleBidUpdate(bid._id, "Accepted")}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mr-2"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleBidUpdate(bid._id, "Rejected")}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
