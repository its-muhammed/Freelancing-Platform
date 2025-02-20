import React, { useState } from "react";

function ChatPage() {
  const [messages, setMessages] = useState([
    { from: "user@example.com", text: "Hello, can you do this task?" },
    { from: "worker@example.com", text: "Yes, I can! Let’s discuss..." },
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    // In real app, you'd send this to backend
    setMessages([...messages, { from: "user@example.com", text: input }]);
    setInput("");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Chat</h1>
      <div
        style={{
          border: "1px solid #ccc",
          height: "300px",
          overflowY: "auto",
          marginBottom: "10px",
          padding: "10px",
        }}
      >
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.from}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          required
          style={{ width: "200px" }}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatPage;
