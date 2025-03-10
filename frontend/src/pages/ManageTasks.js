import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Web3Context } from "../context/Web3Context";
import Layout from "../components/Layout";

export default function ManageTasks() {
  const web3Context = useContext(Web3Context);
  const { account } = web3Context || { account: "" };
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    budget: "",
    deadline: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchClientTasks() {
      if (!account) {
        setError("Please connect your wallet to view tasks.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get(`http://localhost:5000/api/tasks/client/${account}`);
        setTasks(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching client tasks:", error);
        setError("Failed to fetch tasks: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchClientTasks();
  }, [account]);

  const handleConnectWallet = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        setError(null);
      } catch (error) {
        console.error("Error connecting wallet:", error);
        setError("Failed to connect wallet: " + error.message);
      }
    } else {
      setError("MetaMask is not installed. Please install it to continue.");
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description,
      budget: task.budget,
      deadline: task.deadline,
    });
  };

  const handleSaveEdit = async (taskId) => {
    if (
      !editForm.title ||
      !editForm.description ||
      !editForm.budget ||
      !editForm.deadline
    ) {
      setError("All fields are required!");
      return;
    }

    setIsLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/tasks/edit/${taskId}`, editForm);
      setTasks(tasks.map(task =>
        task._id === taskId ? { ...task, ...editForm } : task
      ));
      setError("Task updated successfully!");
      setEditingTask(null);
    } catch (error) {
      console.error("Error updating task:", error);
      setError("Failed to update task: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    setIsLoading(true);
    try {
      await axios.delete(`http://localhost:5000/api/tasks/delete/${taskId}`);
      setTasks(tasks.filter(task => task._id !== taskId));
      setError("Task deleted successfully!");
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Failed to delete task: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6 rounded-lg mb-6 shadow-md">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Manage Your Tasks</h2>
            <button
              onClick={() => navigate("/client-dashboard")}
              className="bg-white text-blue-700 px-4 py-2 rounded-md hover:bg-gray-100 transition"
            >
              Back
            </button>
          </div>
        </header>

        {!account ? (
          <div className="text-center bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 mb-4">Please connect your wallet to manage tasks.</p>
            <button
              onClick={handleConnectWallet}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Connect Wallet
            </button>
          </div>
        ) : isLoading ? (
          <div className="text-center">
            <p className="text-gray-600">Loading tasks...</p>
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mt-4"></div>
          </div>
        ) : error ? (
          <p className="text-center text-red-600 bg-red-50 p-4 rounded-lg mb-4">{error}</p>
        ) : tasks.length === 0 ? (
          <p className="text-center text-gray-600 bg-white p-6 rounded-lg shadow-md">
            No tasks posted yet for {account.slice(0, 6)}...{account.slice(-4)}.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
              >
                <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                <p className="text-gray-700 mt-2 line-clamp-3">{task.description}</p>
                <p className="text-blue-600 font-semibold mt-2">Budget: LKR {task.budget}</p>
                <p className="text-gray-500 mt-2">
                  Deadline: {new Date(task.deadline).toDateString()}
                </p>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => handleEditTask(task)}
                    className="bg-yellow-600 text-white px-3 py-1.5 rounded-md hover:bg-yellow-700 transition w-full"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTask(task._id)}
                    className="bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition w-full"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Task Modal */}
        {editingTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Task</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1" htmlFor="edit-title">
                    Title
                  </label>
                  <input
                    id="edit-title"
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1" htmlFor="edit-description">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1" htmlFor="edit-budget">
                    Budget (LKR)
                  </label>
                  <input
                    id="edit-budget"
                    type="number"
                    value={editForm.budget}
                    onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1" htmlFor="edit-deadline">
                    Deadline
                  </label>
                  <input
                    id="edit-deadline"
                    type="date"
                    value={editForm.deadline}
                    onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setEditingTask(null)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveEdit(editingTask._id)}
                  disabled={isLoading}
                  className={`bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition ${
                    isLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}