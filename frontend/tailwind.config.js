module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"], // This is fine, no change needed
  theme: {
    extend: {
      // Add custom colors
      colors: {
        teal: {
          600: '#2C7A7B', // Primary teal for buttons
          700: '#285E61', // Darker teal for hover states
        },
        slate: {
          800: '#2D3748', // Deep slate blue for navbar and header/footer
        },
      },
      // Add custom font family
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Professional font for the UI
      },
    },
  },
  plugins: [],
};