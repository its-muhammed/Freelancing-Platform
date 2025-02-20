import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ClientProfile() {
  const [account, setAccount] = useState(""); // MetaMask Account
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchProfile() {
      if (!account) return;
      try {
        const response = await axios.get(`http://localhost:5000/api/users/${account}`);
        if (response.data) {
          setName(response.data.name);
          setEmail(response.data.email || ""); // Default to empty if not set
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
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
    fetchProfile();
  }, [account]);

  const handleUpdateProfile = async () => {
    try {
      await axios.put("http://localhost:5000/api/users/update", {
        account,
        name,
        email
      });
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 text-gray-900">
      <header className="w-full bg-blue-700 py-4 flex justify-between px-8">
        <h1 className="text-white text-2xl font-bold">Client Profile</h1>
        <button
          onClick={() => navigate("/client-dashboard")}
          className="bg-white text-blue-700 px-4 py-2 rounded-md"
        >
          Back
        </button>
      </header>

      <div className="mt-8 w-1/3">
        <label className="block text-gray-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md"
        />

        <label className="block text-gray-700 mt-4">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md"
        />

        <button
          onClick={handleUpdateProfile}
          className="mt-6 bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-800 transition w-full"
        >
          Update Profile
        </button>
      </div>
    </div>
  );
}
