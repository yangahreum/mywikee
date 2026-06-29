import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": resolve(__dirname, "./") } },
  test: {
    environment: "happy-dom",
    include: [
      "lib/**/__tests__/**/*.test.ts",
      "lib/**/__tests__/**/*.test.tsx",
      "app/**/__tests__/**/*.test.ts",
      "components/**/__tests__/**/*.test.tsx",
    ],
    globals: true,
  },
});
