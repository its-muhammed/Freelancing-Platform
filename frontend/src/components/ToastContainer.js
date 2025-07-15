import { createContext, useContext, useState, useEffect } from "react";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Auto-close toasts after 4 seconds
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.slice(1)); // Remove oldest toast
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 max-w-md w-full space-y-4 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`relative p-6 rounded-xl shadow-2xl transition-all duration-300 animate-toast-in bg-opacity-90 backdrop-blur-sm ${
              toast.type === "success"
                ? "bg-green-600 text-white border border-green-700"
                : "bg-red-600 text-white border border-red-700"
            }`}
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-center justify-between">
              <span className="flex-1 text-base font-medium">{toast.message}</span>
              <button
                className="text-white hover:text-gray-200 text-xl font-bold focus:outline-none"
                onClick={() => removeToast(toast.id)}
              >
                ×
              </button>
            </div>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 h-1.5 bg-white bg-opacity-30 rounded-b-xl animate-progress"></div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);