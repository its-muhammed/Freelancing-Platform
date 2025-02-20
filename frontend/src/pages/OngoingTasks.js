import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function OngoingTasks() {
  const [tasks, setTasks] = useState([]);
  const [account, setAccount] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTasks() {
      if (!account) return;

      try {
        const response = await axios.get(`http://localhost:5000/api/tasks/ongoing/${account}`);
        setTasks(response.data);
      } catch (error) {
        console.error("Error fetching ongoing tasks:", error);
        alert("Failed to load ongoing tasks.");
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
  }, [account]);

  const markAsCompleted = async (taskId) => {
    try {
      await axios.post("http://localhost:5000/api/tasks/complete-task", { taskId });
      alert("Task marked as completed!");
      setTasks(tasks.filter(task => task._id !== taskId)); // Remove from UI
    } catch (error) {
      console.error("Error marking task as completed:", error);
      alert("Failed to complete task.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 text-gray-900">
      <header className="w-full bg-blue-700 py-4 flex justify-between px-8">
        <h1 className="text-white text-2xl font-bold">Ongoing Tasks</h1>
        <button
          onClick={() => navigate("/freelancer-dashboard")}
          className="bg-white text-blue-700 px-4 py-2 rounded-md"
        >
          Back
        </button>
      </header>

      <div className="mt-8 w-2/3">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-600">No ongoing tasks.</p>
        ) : (
          tasks.map((task) => (
            <div key={task._id} className="bg-white p-4 shadow-md rounded-md mb-4">
              <h3 className="text-xl font-semibold">{task.title}</h3>
              <p className="text-gray-700 mt-2">{task.description}</p>
              <p className="text-blue-600 font-semibold mt-2">Budget: LKR {task.budget}</p>
              <p className="text-gray-500 mt-2">Deadline: {new Date(task.deadline).toDateString()}</p>

              <button
                onClick={() => markAsCompleted(task._id)}
                className="mt-3 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Mark as Completed
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

