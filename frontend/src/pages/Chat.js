import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layout";

export default function Chat() {
  const { bidId } = useParams();
  const [account, setAccount] = useState("");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [bidStatus, setBidStatus] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function getAccountAndChat() {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          setAccount(accounts[0]);
        } catch (err) {
          setError("Failed to connect MetaMask: " + err.message);
          return;
        }
      } else {
        setError("MetaMask not detected.");
        return;
      }

      try {
        const chatResponse = await axios.get(`http://localhost:5000/api/chat/${bidId}`);
        setMessages(chatResponse.data.messages || []);

        const bidResponse = await axios.get(`http://localhost:5000/api/bids/${bidId}`);
        setBidStatus(bidResponse.data.status);
      } catch (err) {
        console.error("API error:", err.response || err);
        if (err.response && err.response.status === 404) {
          setMessages([]);
          if (err.response.config.url.includes("/api/bids/")) {
            setError("Bid not found. Please check the bid ID.");
          }
        } else {
          setError("Failed to load chat or bid status: " + err.message);
        }
      }
    }
    getAccountAndChat();
  }, [bidId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || bidStatus === "Completed") return;
    try {
      const response = await axios.post("http://localhost:5000/api/chat/send", {
        bidId,
        sender: account,
        content: newMessage,
      });
      setMessages(response.data.chat.messages);
      setNewMessage("");
    } catch (err) {
      setError("Failed to send message: " + err.message);
    }
  };

  const formatAddress = (address) => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Unknown";
  };

  return (
    <Layout>
      <div className="bg-white">
        <header className="bg-slate-800 text-white p-6 shadow-md">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">
              Chat for Bid {bidId.slice(0, 8)}...
            </h2>
            <p className="mt-2 text-gray-300">Status: {bidStatus || "Loading..."}</p>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8 min-h-screen bg-gray-100">
          {error && <p className="text-red-600 bg-red-50 p-4 rounded-lg mb-4">{error}</p>}

          <div className="bg-white p-6 rounded-lg shadow-md h-96 overflow-y-auto mb-4">
            {messages.length === 0 ? (
              <p className="text-gray-600 text-center">
                {bidStatus ? "Start chatting with your counterpart!" : "Loading chat..."}
              </p>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-4 flex ${msg.sender === account ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg ${
                      msg.sender === account ? "bg-teal-100 text-teal-800" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="text-sm font-medium">{formatAddress(msg.sender)}</p>
                    <p>{msg.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {bidStatus !== "Completed" ? (
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={handleSendMessage}
                className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 transition"
                disabled={!newMessage.trim()}
              >
                Send
              </button>
            </div>
          ) : (
            <p className="text-gray-600">This chat is closed as the work is completed.</p>
          )}

          <button
            onClick={() => navigate(-1)}
            className="mt-4 bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition"
          >
            Back
          </button>
        </main>

        <footer className="bg-slate-800 text-white p-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm">© 2025 FreeWork. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Layout>
  );
}