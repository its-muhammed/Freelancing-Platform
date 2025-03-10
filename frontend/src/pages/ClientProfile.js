import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import { motion } from "framer-motion";

export default function ClientProfile() {
  const [account, setAccount] = useState("");
  const [profile, setProfile] = useState({
    name: "",
    company: "",
    bio: "",
    preferences: [],
    pastProjects: [],
    reviewsGiven: [],
    totalSpent: 0,
    rating: 0,
    profilePicture: "",
  });
  const [editedProfile, setEditedProfile] = useState({});
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  // Fetch profile and connect MetaMask
  useEffect(() => {
    async function getAccount() {
      if (window.ethereum) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x13882" }], // Polygon Amoy
          });
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          setAccount(accounts[0]);
        } catch (error) {
          console.error("Error connecting MetaMask:", error);
          setError("Failed to connect MetaMask: " + error.message);
        }
      } else {
        setError("MetaMask not detected. Please install it to continue.");
      }
    }

    async function fetchProfile() {
      if (!account) return;
      try {
        const response = await axios.get(`http://localhost:5000/api/users/clients/${account}`);
        setProfile(response.data || {
          name: "Client Name",
          company: "Company Name",
          bio: "I am a client looking for talent.",
          preferences: [],
          pastProjects: [],
          reviewsGiven: [],
          totalSpent: 0,
          rating: 0,
          profilePicture: "",
        });
        setEditedProfile(response.data || {});
      } catch (error) {
        console.error("Error fetching profile:", error);
        setError("Failed to fetch profile: " + error.message);
      }
    }

    getAccount();
    fetchProfile();
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePreferenceChange = (e, index) => {
    const newPreferences = [...editedProfile.preferences];
    newPreferences[index] = e.target.value;
    setEditedProfile((prev) => ({
      ...prev,
      preferences: newPreferences,
    }));
  };

  const addPreference = () => {
    setEditedProfile((prev) => ({
      ...prev,
      preferences: [...(prev.preferences || []), ""],
    }));
  };

  const handleProjectChange = (e, index, field) => {
    const newProjects = [...editedProfile.pastProjects];
    newProjects[index] = { ...newProjects[index], [field]: e.target.value };
    setEditedProfile((prev) => ({
      ...prev,
      pastProjects: newProjects,
    }));
  };

  const addProject = () => {
    setEditedProfile((prev) => ({
      ...prev,
      pastProjects: [...(prev.pastProjects || []), { title: "", description: "", budget: "" }],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `http://localhost:5000/api/users/clients/update/${account}`,
        editedProfile
      );
      setProfile(response.data);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile: " + error.message);
    }
  };

  const formatString = (str) => {
    return str && typeof str === "string" ? `${str.slice(0, 6)}...${str.slice(-4)}` : "Not available";
  };

  return (
    <Layout userType="client">
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-64 bg-gradient-to-b from-blue-600 to-blue-800 text-white p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-8">Client Dashboard</h2>
          <nav className="space-y-4">
            <button
              onClick={() => navigate("/client-dashboard")}
              className="w-full text-left px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-400 transition"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/post-task")}
              className="w-full text-left px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-400 transition"
            >
              Post a Task
            </button>
            <button
              onClick={() => navigate("/manage-tasks")}
              className="w-full text-left px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-400 transition"
            >
              Manage Tasks
            </button>
            <button
              onClick={() => navigate("/manage-bids")}
              className="w-full text-left px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-400 transition"
            >
              Manage Bids
            </button>
            <button
              onClick={() => navigate("/client-profile")}
              className="w-full text-left px-4 py-2 rounded-md bg-blue-700 hover:bg-blue-600 transition"
            >
              Profile
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <header className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6 rounded-lg mb-8 shadow-md">
            <h2 className="text-3xl font-bold">Client Profile</h2>
          </header>

          {!account || account === "" ? (
            <div className="text-center bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600 mb-4">
                {error || "Please connect your wallet to view your profile."}
              </p>
              <button
                onClick={handleConnectWallet}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
              >
                Connect Wallet
              </button>
            </div>
          ) : error ? (
            <p className="text-center text-red-600 bg-red-50 p-4 rounded-lg">{error}</p>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">My Profile</h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={editedProfile.name || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Company</label>
                    <input
                      type="text"
                      name="company"
                      value={editedProfile.company || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Bio</label>
                    <textarea
                      name="bio"
                      value={editedProfile.bio || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Preferences</label>
                    {editedProfile.preferences &&
                      editedProfile.preferences.map((pref, index) => (
                        <input
                          key={index}
                          type="text"
                          value={pref || ""}
                          onChange={(e) => handlePreferenceChange(e, index)}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                        />
                      ))}
                    <button
                      type="button"
                      onClick={addPreference}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
                    >
                      Add Preference
                    </button>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Past Projects</label>
                    {editedProfile.pastProjects &&
                      editedProfile.pastProjects.map((project, index) => (
                        <div key={index} className="space-y-2 mb-4">
                          <input
                            type="text"
                            placeholder="Title"
                            value={project.title || ""}
                            onChange={(e) => handleProjectChange(e, index, "title")}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={project.description || ""}
                            onChange={(e) => handleProjectChange(e, index, "description")}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            placeholder="Budget"
                            value={project.budget || ""}
                            onChange={(e) => handleProjectChange(e, index, "budget")}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    <button
                      type="button"
                      onClick={addProject}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
                    >
                      Add Project
                    </button>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Profile Picture URL</label>
                    <input
                      type="text"
                      name="profilePicture"
                      value={editedProfile.profilePicture || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
                  >
                    Save Changes
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <img
                      src={profile.profilePicture || "https://via.placeholder.com/100?text=Profile"}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-blue-500"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
                      <p className="text-gray-600">{profile.company}</p>
                    </div>
                  </div>
                  <p className="text-gray-700"><strong>Bio:</strong> {profile.bio}</p>
                  <p className="text-gray-700"><strong>Preferences:</strong> {profile.preferences.join(", ") || "None"}</p>
                  <div>
                    <p className="text-gray-700"><strong>Past Projects:</strong></p>
                    {profile.pastProjects.length > 0 ? (
                      <ul className="list-disc pl-5">
                        {profile.pastProjects.map((project, index) => (
                          <li key={index} className="text-gray-600">
                            <strong>{project.title}</strong>: {project.description} (Budget: {project.budget})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600">No past projects</p>
                    )}
                  </div>
                  <p className="text-gray-700"><strong>Total Spent:</strong> {profile.totalSpent} POL</p>
                  <p className="text-gray-700"><strong>Rating:</strong> {profile.rating.toFixed(1)}/5</p>
                  <p className="text-gray-700"><strong>Wallet:</strong> {formatString(account)}</p>
                  <p className="text-gray-700"><strong>Reviews Given:</strong> {profile.reviewsGiven.length > 0 ? profile.reviewsGiven.map(r => `${r.comment} (${r.rating}/5)`).join(", ") : "None"}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}