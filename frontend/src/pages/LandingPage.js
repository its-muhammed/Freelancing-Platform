import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 text-gray-900">
      {/* Header */}
      <header className="w-full bg-blue-700 py-4 flex justify-center">
        <h1 className="text-white text-2xl font-bold">FREEWORK</h1>
      </header>
      
      <div className="mt-12 text-center">
        <h2 className="text-3xl font-bold">Blockchain-based decentralized freelancing platform.</h2>
        <p className="text-gray-700 mt-2">Powered by Polygon</p>
        <p className="mt-6 text-lg">Hi there, it seems you are new to FreeWork.</p>
      </div>

      <div className="mt-6 border-t w-3/4 border-gray-300"></div>

      <div className="mt-6 text-left w-3/4">
        <p><strong>01</strong> Download and install the MetaMask wallet extension on your browser. <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="text-blue-600 underline">Visit here</a></p>
        <p className="mt-2"><strong>02</strong> Link your Polygon wallet to the MetaMask extension.</p>
        <p className="mt-2"><strong>03</strong> You are all set. Click Sign Up to register for FreeWork.</p>
      </div>

      {/* Signup Button */}
      <Link to="/signup" className="mt-6 bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-800 transition">
        SIGN UP
      </Link>

      {/* Footer */}
      <footer className="mt-12 w-full bg-blue-700 py-4 flex justify-center text-white">
        <p>Copyright © FreeWork 2024</p>
      </footer>
    </div>
  );
}
