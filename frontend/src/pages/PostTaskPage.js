import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function PostTaskPage() {
  const [account, setAccount] = useState(""); // Store MetaMask Account
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const navigate = useNavigate();

  // ✅ Retrieve MetaMask Account when component loads
  useEffect(() => {
    async function getAccount() {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          setAccount(accounts[0]); // Set the first MetaMask account
        } catch (error) {
          console.error("Error fetching MetaMask account:", error);
        }
      } else {
        alert("MetaMask is not installed. Please install it to continue.");
      }
    }

    getAccount();
  }, []);

  const handlePostTask = async () => {
    if (!title || !description || !budget || !deadline) {
      alert("All fields are required");
      return;
    }
    
    if (!account) {
      alert("MetaMask account is missing. Please reconnect.");
      return;
    }

    const taskData = {
      title,
      description,
      budget,
      deadline,
      clientId: account, // Use the retrieved MetaMask account
      status: "Open" // Ensure the task is Open
    };

    try {
      const response = await axios.post("http://localhost:5000/api/tasks/create", taskData, {
        headers: { "Content-Type": "application/json" }
      });

      if (response.status === 201) {
        alert("Task posted successfully!");
        navigate("/manage-tasks");
      } else {
        alert("Failed to post task. Try again later.");
      }
    } catch (error) {
      console.error("Error posting task:", error);
      alert("Failed to post task. Please check your connection.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 text-gray-900">
      <h1 className="text-2xl font-bold">Post a Task</h1>

      <div className="mt-6 w-1/3">
        <label className="block text-gray-700">Title</label>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md"
          placeholder="Task title"
        />
      </div>

      <div className="mt-4 w-1/3">
        <label className="block text-gray-700">Description</label>
        <textarea 
          value={description} 
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md"
          placeholder="Task description"
        />
      </div>

      <div className="mt-4 w-1/3">
        <label className="block text-gray-700">Budget (LKR)</label>
        <input 
          type="number" 
          value={budget} 
          onChange={(e) => setBudget(e.target.value)}
          className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md"
          placeholder="Budget in LKR"
        />
      </div>

      <div className="mt-4 w-1/3">
        <label className="block text-gray-700">Deadline</label>
        <input 
          type="date" 
          value={deadline} 
          onChange={(e) => setDeadline(e.target.value)}
          className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md"
        />
      </div>

      <button 
        onClick={handlePostTask} 
        className="mt-6 bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-800 transition"
      >
        Post Task
      </button>
    </div>
  );
}
