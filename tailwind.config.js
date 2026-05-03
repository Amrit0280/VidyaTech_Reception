export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Arial", "sans-serif"]
      },
      colors: {
        ink: "#07111f",
        brand: "#0f62fe",
        gold: "#c9962b",
        aqua: "#1fb6a6"
      }
    }
  },
  plugins: []
};
