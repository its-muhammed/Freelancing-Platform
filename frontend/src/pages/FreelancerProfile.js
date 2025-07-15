import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Web3Context } from "../context/Web3Context";
import axios from "axios";
import { motion } from "framer-motion";

export default function FreelancerProfile() {
  const web3Context = useContext(Web3Context);
  const { account } = web3Context || { account: "" };
  const navigate = useNavigate();
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
        const response = await axios.get(`http://localhost:5000/api/profiles/freelancers/${account}`);
        const defaultProfile = {
          name: "Freelancer Name",
          title: "Professional Freelancer",
          bio: "I am a skilled freelancer.",
          skills: [],
          portfolio: [],
          reviews: [],
          completedJobs: 0,
          rating: 0,
          profilePicture: "",
        };
        const fetchedProfile = response.data || defaultProfile;
        setProfile({
          ...defaultProfile,
          ...fetchedProfile,
          skills: Array.isArray(fetchedProfile.skills) ? fetchedProfile.skills : [],
          portfolio: Array.isArray(fetchedProfile.portfolio) ? fetchedProfile.portfolio : [],
          reviews: Array.isArray(fetchedProfile.reviews) ? fetchedProfile.reviews : [],
        });
        setEditedProfile({
          ...defaultProfile,
          ...fetchedProfile,
          skills: Array.isArray(fetchedProfile.skills) ? fetchedProfile.skills : [],
          portfolio: Array.isArray(fetchedProfile.portfolio) ? fetchedProfile.portfolio : [],
          reviews: Array.isArray(fetchedProfile.reviews) ? fetchedProfile.reviews : [],
        });
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

  const handleSkillChange = (e, index) => {
    const newSkills = [...(editedProfile.skills || [])];
    newSkills[index] = e.target.value;
    setEditedProfile((prev) => ({ ...prev, skills: newSkills }));
  };

  const addSkill = () => {
    setEditedProfile((prev) => ({ ...prev, skills: [...(prev.skills || []), ""] }));
  };

  const handlePortfolioChange = (e, index, field) => {
    const newPortfolio = [...(editedProfile.portfolio || [])];
    newPortfolio[index] = { ...newPortfolio[index], [field]: e.target.value };
    setEditedProfile((prev) => ({ ...prev, portfolio: newPortfolio }));
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
        `http://localhost:5000/api/profiles/freelancers/update/${account}`,
        editedProfile
      );
      const updatedProfile = response.data || {};
      setProfile({
        ...profile,
        ...updatedProfile,
        skills: Array.isArray(updatedProfile.skills) ? updatedProfile.skills : [],
        portfolio: Array.isArray(updatedProfile.portfolio) ? updatedProfile.portfolio : [],
        reviews: Array.isArray(updatedProfile.reviews) ? updatedProfile.reviews : [],
      });
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      setError("Failed to update profile: " + error.message);
    }
  };

  const formatString = (str) =>
    str && typeof str === "string" ? `${str.slice(0, 6)}...${str.slice(-4)}` : "Not available";

  function FreelancerNavbar() {
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

  function FreelancerFooter() {
    return (
      <footer className="bg-slate-800 text-white p-4 text-center">
        <p className="text-sm">© 2025 FreeWork. Built for Freelancers, by Freelancers.</p>
      </footer>
    );
  }

  if (loading) {
    return (
      <div className="bg-white">
        <FreelancerNavbar />
        <div className="flex justify-center items-center h-screen bg-gray-100">
          <div className="animate-spin h-12 w-12 border-4 border-teal-600 border-t-transparent rounded-full"></div>
        </div>
        <FreelancerFooter />
      </div>
    );
  }

  return (
    <div className="bg-white">
      <FreelancerNavbar />

      <main className="max-w-7xl mx-auto px-4 py-8 min-h-screen bg-gray-100">
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
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  name="title"
                  value={editedProfile.title || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  name="bio"
                  value={editedProfile.bio || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 h-24"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Skills</label>
                {(editedProfile.skills || []).map((skill, index) => (
                  <input
                    key={index}
                    type="text"
                    value={skill || ""}
                    onChange={(e) => handleSkillChange(e, index)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 mb-2"
                    required
                  />
                ))}
                <button
                  type="button"
                  onClick={addSkill}
                  className="mt-2 bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300"
                >
                  Add Skill
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Portfolio</label>
                {(editedProfile.portfolio || []).map((item, index) => (
                  <div key={index} className="space-y-2 mb-4">
                    <input
                      type="text"
                      placeholder="Title"
                      value={item.title || ""}
                      onChange={(e) => handlePortfolioChange(e, index, "title")}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description || ""}
                      onChange={(e) => handlePortfolioChange(e, index, "description")}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Link"
                      value={item.link || ""}
                      onChange={(e) => handlePortfolioChange(e, index, "link")}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                      required
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPortfolioItem}
                  className="mt-2 bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300"
                >
                  Add Portfolio Item
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Profile Picture URL</label>
                <input
                  type="text"
                  name="profilePicture"
                  value={editedProfile.profilePicture || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                />
              </div>
              <button
                type="submit"
                className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition"
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
                  className="w-36 h-36 rounded-full object-cover border-4 border-teal-500"
                />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profile.name || "Unnamed Freelancer"}</h2>
                  <p className="text-lg text-gray-600">{profile.title || "No title"}</p>
                  <p className="text-gray-700">
                    <strong>Rating:</strong> {profile.rating ? profile.rating.toFixed(1) : "0.0"}/5
                  </p>
                </div>
              </div>
              <p className="text-gray-700">
                <strong>Bio:</strong> {profile.bio || "No bio available"}
              </p>
              <p className="text-gray-700">
                <strong>Skills:</strong>{" "}
                {Array.isArray(profile.skills) && profile.skills.length > 0 ? profile.skills.join(", ") : "None"}
              </p>
              <div>
                <p className="text-gray-700 font-medium">Portfolio</p>
                {Array.isArray(profile.portfolio) && profile.portfolio.length > 0 ? (
                  <ul className="list-disc pl-5 mt-2 space-y-2">
                    {profile.portfolio.map((item, index) => (
                      <li key={index} className="text-gray-600">
                        <strong>{item.title || "Untitled"}</strong>: {item.description || "No description"} (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:underline"
                        >
                          {item.link ? "Link" : "No link"}
                        </a>
                        )
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">No portfolio items</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <p className="text-gray-700">
                  <strong>Completed Jobs:</strong> {profile.completedJobs || 0}
                </p>
                <p className="text-gray-700">
                  <strong>Rating:</strong> {profile.rating ? profile.rating.toFixed(1) : "0.0"}/5
                </p>
              </div>
              <p className="text-gray-700">
                <strong>Wallet:</strong> {formatString(account)}
              </p>
              <div>
                <p className="text-gray-700 font-medium">Reviews</p>
                {Array.isArray(profile.reviews) && profile.reviews.length > 0 ? (
                  <ul className="list-disc pl-5 mt-2 space-y-2">
                    {profile.reviews.map((review, index) => (
                      <li key={index} className="text-gray-600">
                        {review.comment || "No comment"} (Rating: {review.rating || 0}/5 by {review.client || "Anonymous"})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-600">No reviews yet</p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <FreelancerFooter />
    </div>
  );
}