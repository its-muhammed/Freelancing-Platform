import { useNavigate } from "react-router-dom";

export default function ClientDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 text-gray-900">
      {/* Header with Navigation */}
      <header className="w-full bg-blue-700 py-4 flex justify-between px-8">
        <h1 className="text-white text-2xl font-bold">Client Dashboard</h1>
        <button
          onClick={() => navigate("/profile")}
          className="bg-white text-blue-700 px-4 py-2 rounded-md"
        >
          Profile
        </button>
      </header>

      <div className="mt-12 w-2/3 flex flex-col items-center">
        <h2 className="text-2xl font-semibold mb-6">Manage Your Work</h2>

        <button
          onClick={() => navigate("/post-task")}
          className="bg-green-600 text-white px-6 py-3 rounded-md shadow-md hover:bg-green-700 mb-4 w-1/2"
        >
          Post a Task
        </button>

        <button
          onClick={() => navigate("/manage-tasks")}
          className="bg-blue-600 text-white px-6 py-3 rounded-md shadow-md hover:bg-blue-700 mb-4 w-1/2"
        >
          View & Manage Tasks
        </button>

        <button
          onClick={() => navigate("/manage-bids")}
          className="bg-yellow-600 text-white px-6 py-3 rounded-md shadow-md hover:bg-yellow-700 mb-4 w-1/2"
        >
          View Bids
        </button>

        <button
          onClick={() => navigate("/")}
          className="bg-red-600 text-white px-6 py-3 rounded-md shadow-md hover:bg-red-700 w-1/2"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
