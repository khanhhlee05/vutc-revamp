import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts", "lib/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
    },
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
});
