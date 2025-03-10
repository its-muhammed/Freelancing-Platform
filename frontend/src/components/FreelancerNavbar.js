import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Web3Context } from "../context/Web3Context";

export default function FreelancerNavbar() {
  const navigate = useNavigate();
  const web3Context = useContext(Web3Context);
  const { account } = web3Context || { account: "" };

  const formatAccount = (acc) => {
    return acc && typeof acc === "string" ? `${acc.slice(0, 6)}...${acc.slice(-4)}` : "Not connected";
  };

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">Freelancer Portal</h1>
        <div className="flex space-x-4">
          <span className="text-sm self-center">{formatAccount(account)}</span>
          <button
            onClick={() => navigate("/freelancer-dashboard")}
            className="px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-400 transition"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate("/available-tasks")}
            className="px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-400 transition"
          >
            Available Tasks
          </button>
          <button
            onClick={() => navigate("/ongoing-tasks")}
            className="px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-400 transition"
          >
            Ongoing Tasks
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}