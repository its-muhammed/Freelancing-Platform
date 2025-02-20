import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import "./index.css";
import axios from "axios";

axios.defaults.baseURL = "http://localhost:5000";

function App() {
  return (
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
      </Routes>
    </Router>
  );
}

export default App;
