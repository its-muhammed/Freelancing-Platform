import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Web3Context } from "../context/Web3Context";

export default function FreelancerNavbar() {
  const navigate = useNavigate();
  const web3Context = useContext(Web3Context);
  const { account } = web3Context || { account: "" };

  const formatAccount = (acc) =>
    acc && typeof acc === "string" ? `${acc.slice(0, 6)}...${acc.slice(-4)}` : "Not connected";

  return (
    <nav className="bg-slate-800 text-white p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Freelancer Portal</h1>
        <div className="flex items-center space-x-6">
          <span className="text-sm text-gray-300">{formatAccount(account)}</span>
          <button
            onClick={() => navigate("/freelancer-dashboard")}
            className="px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 transition"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate("/available-tasks")}
            className="px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 transition"
          >
            Available Tasks
          </button>
          <button
            onClick={() => navigate("/ongoing-tasks")}
            className="px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 transition"
          >
            Ongoing Tasks
          </button>
          <button
            onClick={() => navigate("/freelancer-profile")}
            className="px-4 py-2 rounded-md bg-teal-600 hover:bg-teal-700 transition"
          >
            Profile
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}