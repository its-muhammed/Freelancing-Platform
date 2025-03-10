import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Web3Provider } from "./context/Web3Context"; // Import the Web3Provider
import LandingPage from "./pages/LandingPage";
import SignUpPage from "./pages/SignUpPage";
import PostTaskPage from "./pages/PostTaskPage";
import TasksPage from "./pages/TasksPage";
import ClientDashboard from "./pages/ClientDashboard";
import ManageTasks from "./pages/ManageTasks";
import ClientProfile from "./pages/ClientProfile";
import ManageBids from "./pages/ManageBids";
import FreelancerDashboard from "./pages/FreelancerDashboard";
import OngoingTasks from "./pages/OngoingTasks";
import AvailableTasks from "./pages/AvailableTasks";
import FreelancerBids from "./pages/FreelancerBids";
import FreelancerProfile from "./pages/FreelancerProfile";
import "./index.css";
import axios from "axios";

// Set the default base URL for axios requests
axios.defaults.baseURL = "http://localhost:5000";

function App() {
  return (
    <Web3Provider> {/* Wrap the entire app with Web3Provider */}
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/post-task" element={<PostTaskPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/client-dashboard" element={<ClientDashboard />} />
          <Route path="/manage-tasks" element={<ManageTasks />} />
          <Route path="/profile" element={<ClientProfile />} />
          <Route path="/manage-bids" element={<ManageBids />} />
          <Route path="/freelancer-dashboard" element={<FreelancerDashboard />} />
          <Route path="/ongoing-tasks" element={<OngoingTasks />} />
          <Route path="/available-tasks" element={<AvailableTasks />} />
          <Route path="/freelancer-bids" element={<FreelancerBids />} />
          <Route path="/freelancer-profile" element={<FreelancerProfile />} />
        </Routes>
      </Router>
    </Web3Provider>
  );
}

export default App;