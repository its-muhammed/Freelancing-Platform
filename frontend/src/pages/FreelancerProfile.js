import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";
import { motion } from "framer-motion";

export default function FreelancerProfile() {
  const [account, setAccount] = useState("");
  const [profile, setProfile] = useState({
    name: "",
    title: "",
    bio: "",
    skills: [],
    portfolio: [],
    reviews: [],
    completedJobs: 0,
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
        const response = await axios.get(`http://localhost:5000/api/users/freelancers/${account}`);
        setProfile(response.data || {
          name: "Freelancer Name",
          title: "Professional Freelancer",
          bio: "I am a skilled freelancer.",
          skills: [],
          portfolio: [],
          reviews: [],
          completedJobs: 0,
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

  const handleSkillChange = (e, index) => {
    const newSkills = [...editedProfile.skills];
    newSkills[index] = e.target.value;
    setEditedProfile((prev) => ({
      ...prev,
      skills: newSkills,
    }));
  };

  const addSkill = () => {
    setEditedProfile((prev) => ({
      ...prev,
      skills: [...(prev.skills || []), ""],
    }));
  };

  const handlePortfolioChange = (e, index, field) => {
    const newPortfolio = [...editedProfile.portfolio];
    newPortfolio[index] = { ...newPortfolio[index], [field]: e.target.value };
    setEditedProfile((prev) => ({
      ...prev,
      portfolio: newPortfolio,
    }));
  };

  const addPortfolioItem = () => {
    setEditedProfile((prev) => ({
      ...prev,
      portfolio: [...(prev.portfolio || []), { title: "", description: "", link: "" }],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `http://localhost:5000/api/users/freelancers/update/${account}`,
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
    <Layout userType="freelancer">
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <div className="w-64 bg-gradient-to-b from-indigo-600 to-indigo-800 text-white p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-8">Freelancer Dashboard</h2>
          <nav className="space-y-4">
            <button
              onClick={() => navigate("/freelancer-dashboard")}
              className="w-full text-left px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-400 transition"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/available-tasks")}
              className="w-full text-left px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-400 transition"
            >
              Available Tasks
            </button>
            <button
              onClick={() => navigate("/ongoing-tasks")}
              className="w-full text-left px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-400 transition"
            >
              Ongoing Tasks
            </button>
            <button
              onClick={() => navigate("/freelancer-profile")}
              className="w-full text-left px-4 py-2 rounded-md bg-indigo-700 hover:bg-indigo-600 transition"
            >
              Profile
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <header className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white p-6 rounded-lg mb-8 shadow-md">
            <h2 className="text-3xl font-bold">Freelancer Profile</h2>
          </header>

          {!account || account === "" ? (
            <div className="text-center bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600 mb-4">
                {error || "Please connect your wallet to view your profile."}
              </p>
              <button
                onClick={handleConnectWallet}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition"
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
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
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
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={editedProfile.title || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Bio</label>
                    <textarea
                      name="bio"
                      value={editedProfile.bio || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Skills</label>
                    {editedProfile.skills &&
                      editedProfile.skills.map((skill, index) => (
                        <input
                          key={index}
                          type="text"
                          value={skill || ""}
                          onChange={(e) => handleSkillChange(e, index)}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                        />
                      ))}
                    <button
                      type="button"
                      onClick={addSkill}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
                    >
                      Add Skill
                    </button>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Portfolio</label>
                    {editedProfile.portfolio &&
                      editedProfile.portfolio.map((item, index) => (
                        <div key={index} className="space-y-2 mb-4">
                          <input
                            type="text"
                            placeholder="Title"
                            value={item.title || ""}
                            onChange={(e) => handlePortfolioChange(e, index, "title")}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={item.description || ""}
                            onChange={(e) => handlePortfolioChange(e, index, "description")}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            type="text"
                            placeholder="Link"
                            value={item.link || ""}
                            onChange={(e) => handlePortfolioChange(e, index, "link")}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      ))}
                    <button
                      type="button"
                      onClick={addPortfolioItem}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
                    >
                      Add Portfolio Item
                    </button>
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Profile Picture URL</label>
                    <input
                      type="text"
                      name="profilePicture"
                      value={editedProfile.profilePicture || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition"
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
                      className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
                      <p className="text-gray-600">{profile.title}</p>
                    </div>
                  </div>
                  <p className="text-gray-700"><strong>Bio:</strong> {profile.bio}</p>
                  <p className="text-gray-700"><strong>Skills:</strong> {profile.skills.join(", ") || "None"}</p>
                  <div>
                    <p className="text-gray-700"><strong>Portfolio:</strong></p>
                    {profile.portfolio.length > 0 ? (
                      <ul className="list-disc pl-5">
                        {profile.portfolio.map((item, index) => (
                          <li key={index} className="text-gray-600">
                            <strong>{item.title}</strong>: {item.description} (<a href={item.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Link</a>)
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600">No portfolio items</p>
                    )}
                  </div>
                  <p className="text-gray-700"><strong>Completed Jobs:</strong> {profile.completedJobs}</p>
                  <p className="text-gray-700"><strong>Rating:</strong> {profile.rating.toFixed(1)}/5</p>
                  <p className="text-gray-700"><strong>Wallet:</strong> {formatString(account)}</p>
                  <p className="text-gray-700"><strong>Reviews:</strong> {profile.reviews.length > 0 ? profile.reviews.map(r => `${r.comment} (${r.rating}/5)`).join(", ") : "None"}</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}