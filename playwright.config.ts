import { defineConfig } from "@playwright/test";

const port = 3200;

export default defineConfig({
  fullyParallel: false,
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  use: { baseURL: `http://localhost:${port}`, channel: "chrome" },
  webServer: {
    command: `bunx next start -p ${port}`,
    reuseExistingServer: false,
    url: `http://localhost:${port}`,
  },
});
