import { useState, useEffect, useContext } from "react";
//import { useNavigate } from "react-router-dom";
import { Web3Context } from "../context/Web3Context";
import Layout from "../components/Layout";
import axios from "axios";
import { motion } from "framer-motion";

export default function ClientProfile() {
  const web3Context = useContext(Web3Context);
  const { account } = web3Context || { account: "" };
  //const navigate = useNavigate();
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
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) {
      setError("Please connect your wallet to view your profile.");
      setLoading(false);
      return;
    }
    async function fetchProfile() {
      try {
        const response = await axios.get(`http://localhost:5000/api/profiles/clients/${account}`);
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
        setError("Failed to fetch profile: " + error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [account]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePreferenceChange = (e, index) => {
    const newPreferences = [...(editedProfile.preferences || [])];
    newPreferences[index] = e.target.value;
    setEditedProfile((prev) => ({ ...prev, preferences: newPreferences }));
  };

  const addPreference = () => {
    setEditedProfile((prev) => ({ ...prev, preferences: [...(prev.preferences || []), ""] }));
  };

  const handleProjectChange = (e, index, field) => {
    const newProjects = [...(editedProfile.pastProjects || [])];
    newProjects[index] = { ...newProjects[index], [field]: e.target.value };
    setEditedProfile((prev) => ({ ...prev, pastProjects: newProjects }));
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
        `http://localhost:5000/api/profiles/clients/update/${account}`,
        editedProfile
      );
      setProfile(response.data);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      setError("Failed to update profile: " + error.message);
    }
  };

  const formatString = (str) =>
    str && typeof str === "string" ? `${str.slice(0, 6)}...${str.slice(-4)}` : "Not available";

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {error && <p className="text-red-600 mb-4">{error}</p>}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={editedProfile.name || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <input
                  type="text"
                  name="company"
                  value={editedProfile.company || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  name="bio"
                  value={editedProfile.bio || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-24"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Preferences</label>
                {(editedProfile.preferences || []).map((pref, index) => (
                  <input
                    key={index}
                    type="text"
                    value={pref || ""}
                    onChange={(e) => handlePreferenceChange(e, index)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 mb-2"
                    required
                  />
                ))}
                <button
                  type="button"
                  onClick={addPreference}
                  className="mt-2 bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300"
                >
                  Add Preference
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Past Projects</label>
                {(editedProfile.pastProjects || []).map((project, index) => (
                  <div key={index} className="space-y-2 mb-4">
                    <input
                      type="text"
                      placeholder="Title"
                      value={project.title || ""}
                      onChange={(e) => handleProjectChange(e, index, "title")}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={project.description || ""}
                      onChange={(e) => handleProjectChange(e, index, "description")}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Budget"
                      value={project.budget || ""}
                      onChange={(e) => handleProjectChange(e, index, "budget")}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addProject}
                  className="mt-2 bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300"
                >
                  Add Project
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Profile Picture URL</label>
                <input
                  type="text"
                  name="profilePicture"
                  value={editedProfile.profilePicture || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Save Changes
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center space-x-6">
                <img
                  src={profile.profilePicture || "https://via.placeholder.com/150"}
                  alt="Profile"
                  className="w-36 h-36 rounded-full object-cover border-4 border-blue-500"
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                  <p className="text-lg text-gray-600">{profile.company}</p>
                </div>
              </div>
              <p className="text-gray-700"><strong>Bio:</strong> {profile.bio || "No bio available"}</p>
              <p className="text-gray-700"><strong>Preferences:</strong> {profile.preferences.join(", ") || "None"}</p>
              <div>
                <p className="text-gray-700 font-medium">Past Projects</p>
                {profile.pastProjects.length > 0 ? (
                  <ul className="list-disc pl-5 mt-2 space-y-2">
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
              <div className="grid grid-cols-2 gap-4">
                <p className="text-gray-700"><strong>Total Spent:</strong> {profile.totalSpent} POL</p>
                <p className="text-gray-700"><strong>Rating:</strong> {profile.rating.toFixed(1)}/5</p>
              </div>
              <p className="text-gray-700"><strong>Wallet:</strong> {formatString(account)}</p>
              <div>
                <p className="text-gray-700 font-medium">Reviews Given</p>
                {profile.reviewsGiven.length > 0 ? (
                  <ul className="list-disc pl-5 mt-2 space-y-2">
                    {profile.reviewsGiven.map((review, index) => (
                      <li key={index} className="text-gray-600">
                        {review.comment} (Rating: {review.rating}/5 for {review.freelancer})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">No reviews given</p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}