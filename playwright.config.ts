import { defineConfig, devices } from "@playwright/test";

const port = 3100;

const browser = {
  ...devices["Desktop Chrome"],
  // Allow a preinstalled browser (CI images, cloud sandboxes).
  launchOptions: process.env.PW_CHROMIUM_PATH
    ? { executablePath: process.env.PW_CHROMIUM_PATH }
    : undefined,
};

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx next start -p ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      BETTER_AUTH_URL: `http://localhost:${port}`,
      NEXT_PUBLIC_APP_URL: `http://localhost:${port}`,
    },
  },
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/, use: { ...browser } },
    {
      name: "chromium",
      dependencies: ["setup"],
      use: { ...browser },
    },
  ],
});
