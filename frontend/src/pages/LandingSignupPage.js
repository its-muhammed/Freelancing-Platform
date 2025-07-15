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
          console.log("MetaMask account fetched:", accounts[0]);
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
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-white">
      <header className="w-full bg-slate-800 text-white p-3 md:p-4 shadow-md">
        <h1 className="text-lg md:text-xl font-bold tracking-tight text-center">FreeWork</h1>
      </header>

      <main className="flex-grow w-full bg-gray-100 flex flex-col items-center justify-center px-4">
        <div className="w-full text-center px-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
            Blockchain-based Decentralized Freelancing Platform
          </h2>
          <p className="text-sm md:text-base text-gray-700">Powered by Polygon</p>
          <p className="mt-2 text-sm md:text-base text-gray-600">
            Get started with FreeWork in three simple steps:
          </p>
        </div>

        {/* Updated instructions container with centered text */}
        <div className="mt-4 w-full px-4 text-gray-700 space-y-1 text-center">
          <p className="text-xs md:text-sm">
            <strong className="text-teal-600">01.</strong> Download and install the MetaMask wallet extension.{" "}
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:underline"
            >
              Visit here
            </a>
          </p>
          <p className="text-xs md:text-sm">
            <strong className="text-teal-600">02.</strong> Link your Polygon wallet to MetaMask.
          </p>
          <p className="text-xs md:text-sm">
            <strong className="text-teal-600">03.</strong> Connect your wallet and sign up below.
          </p>
        </div>

        {!isMetaMaskInstalled && error && (
          <div className="mt-4 w-full text-center text-red-600 bg-red-50 p-3">
            {error}
          </div>
        )}

        {isMetaMaskInstalled && (
          <div className="mt-4 w-full bg-white p-3 md:p-4 shadow-md max-w-sm">
            <form className="space-y-3">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2 py-1 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs md:text-sm"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700">Your Account</label>
                <input
                  type="text"
                  value={account || "Connecting..."}
                  readOnly
                  className="w-full px-2 py-1 mt-1 border border-gray-300 rounded-md bg-gray-100 text-gray-600 text-xs md:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700">Register as</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-2 py-1 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs md:text-sm"
                >
                  <option value="freelancer">Freelancer</option>
                  <option value="client">Client</option>
                </select>
              </div>

              {error && <p className="text-red-600 text-xs md:text-sm text-center">{error}</p>}

              <button
                type="button"
                onClick={handleSignUp}
                disabled={isLoading}
                className={`w-full bg-teal-600 text-white px-3 py-1 md:px-4 md:py-2 rounded-md hover:bg-teal-700 transition ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                } text-xs md:text-sm`}
              >
                {isLoading ? "Signing Up..." : "Sign Up"}
              </button>
            </form>
          </div>
        )}
      </main>

      <footer className="w-full bg-slate-800 text-white p-3">
        <p className="text-center text-xs md:text-sm">© 2025 FreeWork. All rights reserved.</p>
      </footer>
    </div>
  );
}
