import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";

export default function SignUpPage() {
  const [account, setAccount] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("Client");
  const navigate = useNavigate();

  useEffect(() => {
    async function getAccount() {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          setAccount(accounts[0]);
        } catch (error) {
          console.error("Error fetching MetaMask account", error);
        }
      } else {
        alert("MetaMask is not installed. Please install it to continue.");
      }
    }
    getAccount();
  }, []);

  const handleSignUp = async () => {
    const userData = { name, account, role };

    try {
      const response = await registerUser(userData);
      console.log("Signup Response:", response);

      if (response.message === "Name Invalid") {
        alert("Name Invalid. Please enter the correct name used during first signup.");
      } else {
        navigate(role === "Client" ? "/client-dashboard" : "/freelancer-dashboard");
      }
    } catch (error) {
      console.error("Signup Error:", error.message);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 text-gray-900">
      <header className="w-full bg-blue-700 py-4 flex justify-center">
        <h1 className="text-white text-2xl font-bold">FREEWORK</h1>
      </header>
      
      <div className="mt-12 text-center">
        <h2 className="text-3xl font-bold">Sign Up</h2>
      </div>

      <div className="mt-6 w-1/3">
        <label className="block text-gray-700">Name</label>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md"
          placeholder="Enter your name"
        />
      </div>

      <div className="mt-4 w-1/3">
        <label className="block text-gray-700">Your Account</label>
        <input 
          type="text" 
          value={account} 
          readOnly 
          className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
        />
      </div>
      
      <div className="mt-4 w-1/3">
        <label className="block text-gray-700">Register as</label>
        <select 
          className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md" 
          value={role} 
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="Client">Client</option>
          <option value="Freelancer">Freelancer</option>
        </select>
      </div>

      <button 
        onClick={handleSignUp} 
        className="mt-6 bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-800 transition"
      >
        SIGN UP
      </button>

      <footer className="mt-12 w-full bg-blue-700 py-4 flex justify-center text-white">
        <p>© FreeWork 2024</p>
      </footer>
    </div>
  );
}
