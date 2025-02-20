import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ManageTasks() {
  const [tasks, setTasks] = useState([]);
  const [account, setAccount] = useState(""); // MetaMask Account
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchClientTasks() {
      if (!account) return;
      try {
        const response = await axios.get(`http://localhost:5000/api/tasks/client/${account}`);
        setTasks(response.data);
      } catch (error) {
        console.error("Error fetching client tasks:", error);
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
    fetchClientTasks();
  }, [account]);

  const handleEditTask = async (taskId) => {
    const updatedTask = {
        title: prompt("Enter new title:", ""),
        description: prompt("Enter new description:", ""),
        budget: prompt("Enter new budget:", ""),
        deadline: prompt("Enter new deadline (YYYY-MM-DD):", ""),
    };

    if (!updatedTask.title || !updatedTask.description || !updatedTask.budget || !updatedTask.deadline) {
        alert("All fields are required!");
        return;
    }

    try {
        await axios.put(`http://localhost:5000/api/tasks/edit/${taskId}`, updatedTask);
        alert("Task updated successfully!");
        setTasks(tasks.map(task => task._id === taskId ? { ...task, ...updatedTask } : task));
    } catch (error) {
        console.error("Error updating task:", error);
        alert("Failed to update task.");
    }
};


  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/delete/${taskId}`);
      alert("Task deleted successfully!");
      setTasks(tasks.filter(task => task._id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 text-gray-900">
      <header className="w-full bg-blue-700 py-4 flex justify-between px-8">
        <h1 className="text-white text-2xl font-bold">Manage Tasks</h1>
        <button
          onClick={() => navigate("/client-dashboard")}
          className="bg-white text-blue-700 px-4 py-2 rounded-md"
        >
          Back
        </button>
      </header>

      <div className="mt-8 w-2/3">
        {tasks.length === 0 ? (
          <p className="text-center text-gray-600">No tasks posted yet.</p>
        ) : (
          tasks.map((task) => (
            <div key={task._id} className="bg-white p-4 shadow-md rounded-md mb-4">
              <h3 className="text-xl font-semibold">{task.title}</h3>
              <p className="text-gray-700 mt-2">{task.description}</p>
              <p className="text-blue-600 font-semibold mt-2">Budget: LKR {task.budget}</p>
              <p className="text-gray-500 mt-2">Deadline: {new Date(task.deadline).toDateString()}</p>

              <div className="mt-3 flex">
                <button
                  onClick={() => handleEditTask(`/edit-task/${task._id}`)}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTask(task._id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

