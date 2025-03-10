import { useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">FreelancePro</h3>
            <p className="text-gray-400">
              Connecting clients and freelancers through secure smart contracts.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => navigate("/")}
                  className="text-gray-400 hover:text-white"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/client-dashboard")}
                  className="text-gray-400 hover:text-white"
                >
                  Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/manage-bids")}
                  className="text-gray-400 hover:text-white"
                >
                  Manage Bids
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate("/manage-tasks")}
                  className="text-gray-400 hover:text-white"
                >
                  Manage Tasks
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 4.41 2.87 8.14 6.84 9.49.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.1-1.46-1.1-1.46-.9-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.28.1-2.67 0 0 .84-.27 2.75 1.03A9.56 9.56 0 0112 6.8c.85.004 1.71.12 2.52.35 1.9-1.3 2.74-1.03 2.74-1.03.55 1.39.2 2.42.1 2.67.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.56c-.89.39-1.84.65-2.83.77 1.02-.61 1.8-1.58 2.17-2.73-.95.57-2 .98-3.13 1.2-.9-.96-2.18-1.56-3.6-1.56-2.72 0-4.92 2.2-4.92 4.92 0 .39.04.76.13 1.12-4.09-.21-7.72-2.16-10.15-5.14-.42.73-.66 1.58-.66 2.48 0 1.71.87 3.22 2.19 4.1-.81-.03-1.57-.25-2.24-.62v.06c0 2.39 1.7 4.38 3.95 4.83-.41.11-.85.17-1.3.17-.32 0-.63-.03-.93-.09.63 1.97 2.45 3.4 4.61 3.44-1.69 1.32-3.82 2.11-6.13 2.11-.4 0-.79-.02-1.18-.07 2.19 1.4 4.79 2.22 7.58 2.22 9.09 0 14.06-7.53 14.06-14.06 0-.21 0-.43-.01-.64.96-.7 1.79-1.57 2.45-2.57z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.99 2H4.01C2.9 2 2 2.9 2 4.01v15.98C2 21.1 2.9 22 4.01 22h15.98c1.11 0 2.01-.9 2.01-2.01V4.01C22 2.9 21.1 2 19.99 2zM8 19H5v-9h3v9zm-1.5-10.5c-.97 0-1.75-.78-1.75-1.75S5.53 5 6.5 5s1.75.78 1.75 1.75S7.47 8.5 6.5 8.5zm13.5 10.5h-3v-5.5c0-1.38-.5-2.32-1.75-2.32-1.28 0-2.03.86-2.36 1.69-.12.3-.14.71-.14 1.13v5h-3v-9h3v1.2c.43-.84 1.2-2.03 2.92-2.03 2.14 0 3.58 1.39 3.58 4.38v5.45z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-4 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} FreelancePro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}