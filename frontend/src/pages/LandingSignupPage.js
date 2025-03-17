import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/api";

export default function LandingSignupPage() {
  const [account, setAccount] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("freelancer");
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (window.ethereum) {
      setIsMetaMaskInstalled(true);
      async function getAccount() {
        try {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          setAccount(accounts[0]);
          console.log("MetaMask account fetched:", accounts[0]); // Debug log
        } catch (error) {
          console.error("Error fetching MetaMask account", error);
          setError("Please ensure MetaMask is connected.");
        }
      }
      getAccount();
    } else {
      setError("MetaMask is not installed. Please install it to continue.");
    }
  }, []);

  const handleSignUp = async () => {
    if (!name || !account || !role) {
      setError("Please fill in all fields.");
      console.log("Validation failed: name, account, or role is missing", { name, account, role });
      return;
    }

    setIsLoading(true);
    const userData = { name, account, role: role.toLowerCase() };
    console.log("Sending signup request with data:", userData);

    try {
      const response = await registerUser(userData);
      console.log("Signup response from backend:", response);

      if (response.message === "Name Invalid") {
        setError("Name Invalid. Please enter the correct name used during first signup.");
      } else {
        setError(null);
        console.log("Navigating to:", role === "freelancer" ? "/freelancer-dashboard" : "/client-dashboard");
        navigate(role === "freelancer" ? "/freelancer-dashboard" : "/client-dashboard");
      }
    } catch (error) {
      console.error("Signup error:", error.message);
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 text-gray-900">
      <header className="w-full bg-blue-700 py-4 flex justify-center">
        <h1 className="text-white text-2xl font-bold">FREEWORK</h1>
      </header>

      <div className="mt-12 text-center max-w-2xl px-4">
        <h2 className="text-3xl font-bold">Blockchain-based Decentralized Freelancing Platform</h2>
        <p className="text-gray-700 mt-2">Powered by Polygon</p>
        <p className="mt-6 text-lg">Hi there! Get started with FreeWork by following these steps:</p>
      </div>

      <div className="mt-6 border-t w-3/4 border-gray-300"></div>

      <div className="mt-6 text-left w-3/4 max-w-md space-y-4">
        <p>
          <strong>01</strong> Download and install the MetaMask wallet extension on your browser.{" "}
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Visit here
          </a>
        </p>
        <p>
          <strong>02</strong> Link your Polygon wallet to the MetaMask extension.
        </p>
        <p>
          <strong>03</strong> Connect your wallet and sign up below to join FreeWork.
        </p>
      </div>

      {!isMetaMaskInstalled && error && (
        <div className="mt-6 text-center text-red-600">{error}</div>
      )}

      {isMetaMaskInstalled && (
        <div className="mt-6 w-1/3 max-w-md">
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Your Account</label>
              <input
                type="text"
                value={account || "Connecting..."}
                readOnly
                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Register as</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="freelancer">Freelancer</option>
                <option value="client">Client</option>
              </select>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              type="button"
              onClick={handleSignUp}
              disabled={isLoading}
              className={`w-full bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-800 transition ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Signing Up..." : "SIGN UP"}
            </button>
          </form>
        </div>
      )}

      <footer className="mt-12 w-full bg-blue-700 py-4 flex justify-center text-white">
        <p>© FreeWork 2025</p>
      </footer>
    </div>
  );
}