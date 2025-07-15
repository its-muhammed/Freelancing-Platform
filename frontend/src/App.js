import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastProvider } from "./components/ToastContainer"; // Adjust path if needed
import { Web3Provider } from "./context/Web3Context";
import LandingSignupPage from "./pages/LandingSignupPage";
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
import Chat from "./pages/Chat";
import "./index.css";
import axios from "axios";

// Set the default base URL for axios requests
axios.defaults.baseURL = "http://localhost:5000";

function App() {
  return (
    // Wrap the app with Web3Provider for blockchain context (MetaMask, account management)
    <Web3Provider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Landing and signup page */}
            <Route path="/" element={<LandingSignupPage />} />
            {/* Client routes */}
            <Route path="/post-task" element={<PostTaskPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/client-dashboard" element={<ClientDashboard />} />
            <Route path="/manage-tasks" element={<ManageTasks />} />
            <Route path="/manage-bids" element={<ManageBids />} />
            <Route path="/client-profile" element={<ClientProfile />} />
            {/* Freelancer routes */}
            <Route path="/freelancer-dashboard" element={<FreelancerDashboard />} />
            <Route path="/ongoing-tasks" element={<OngoingTasks />} />
            <Route path="/available-tasks" element={<AvailableTasks />} />
            <Route path="/freelancer-bids" element={<FreelancerBids />} />
            <Route path="/freelancer-profile" element={<FreelancerProfile />} />
            {/* Chat route with dynamic bidId */}
            <Route path="/chat/:bidId" element={<Chat />} />
            {/* Note: /profile route may be redundant with /client-profile; consider redirecting based on user role */}
            <Route path="/profile" element={<ClientProfile />} />
          </Routes>
        </Router>
      </ToastProvider>
    </Web3Provider>
  );
}

export default App;