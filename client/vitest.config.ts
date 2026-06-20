import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Test runner config kept separate from vite.config.ts so the app build stays
// free of test-only types. jsdom + Testing Library, globals enabled.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
});
