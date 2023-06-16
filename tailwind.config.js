export default {
  content: [
    "./index.html",
    "./src/App.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js",
  ],
  darkMode: 'media',
  theme: {
    extend: {},
  },
  plugins: [require("flowbite/plugin")],
};
