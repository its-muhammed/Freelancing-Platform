import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AvailableTasks() {
  const [tasks, setTasks] = useState([]);
  const [account, setAccount] = useState("");
  const [bidTaskId, setBidTaskId] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTasks() {
      try {
        const response = await axios.get("http://localhost:5000/api/tasks/freelancer-available");
        console.log("Fetched Tasks:", response.data); // Debugging Log
        setTasks(response.data);
      } catch (error) {
        console.error("Error fetching tasks:", error);
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
    fetchTasks();
  }, []);

  const handleBidSubmit = async (taskId) => {
    if (!bidAmount || !bidMessage) {
      alert("Enter bid amount and message.");
      return;
    }

    try {
      const bidData = { taskId, freelancerId: account, amount: bidAmount, message: bidMessage };
      await axios.post("http://localhost:5000/api/bids/place", bidData, {
        headers: { "Content-Type": "application/json" }
      });
      alert("Bid placed successfully!");
      setBidTaskId(null);
      setBidAmount("");
      setBidMessage("");
    } catch (error) {
      console.error("Error placing bid:", error);
      alert("Failed to place bid.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 text-gray-900">
      <header className="w-full bg-blue-700 py-4 flex justify-between px-8">
        <h1 className="text-white text-2xl font-bold">Available Tasks</h1>
        <button
          onClick={() => navigate("/freelancer-dashboard")}
          className="bg-white text-blue-700 px-4 py-2 rounded-md"
        >
          Back
        </button>
      </header>

      <div className="mt-8 w-2/3">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-600">No available tasks.</p>
        ) : (
          tasks.map((task) => (
            <div key={task._id} className="bg-white p-4 shadow-md rounded-md mb-4">
              <h3 className="text-xl font-semibold">{task.title}</h3>
              <p className="text-gray-700 mt-2">{task.description}</p>
              <p className="text-blue-600 font-semibold mt-2">Budget: LKR {task.budget}</p>
              <p className="text-gray-500 mt-2">Deadline: {new Date(task.deadline).toDateString()}</p>
              
              <button
                onClick={() => setBidTaskId(task._id)}
                className="mt-3 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Bid
              </button>

              {bidTaskId === task._id && (
                <div className="mt-4">
                  <input 
                    type="number" 
                    placeholder="Bid Amount" 
                    value={bidAmount} 
                    onChange={(e) => setBidAmount(e.target.value)} 
                    className="border px-3 py-2 rounded-md"
                  />
                  <input 
                    type="text" 
                    placeholder="Message" 
                    value={bidMessage} 
                    onChange={(e) => setBidMessage(e.target.value)} 
                    className="border px-3 py-2 rounded-md ml-2"
                  />
                  <button 
                    onClick={() => handleBidSubmit(task._id)} 
                    className="bg-blue-600 text-white px-4 py-2 rounded-md ml-2"
                  >
                    Submit Bid
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
