import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { configDefaults } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",  // ✅ Use jsdom to simulate a browser environment
    //setupFiles: "./setupTests.js", // ✅ Optional: Global test setup file
  },
})
