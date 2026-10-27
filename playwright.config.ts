import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  timeout: 30000,
  expect: { timeout: 10000 },
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "desktop-firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 13"] } },
  ],
  webServer: [
    { command: "node tests/mock-supabase.mjs", url: "http://127.0.0.1:54329/health", reuseExistingServer: false },
    {
      command: "npm run dev -- --hostname 0.0.0.0 --port 3100",
      url: "http://localhost:3100",
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        NEXT_BUILD_DIR: ".next-e2e",
        NEXT_PUBLIC_SITE_URL: "http://localhost:3100",
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
        SUPABASE_SECRET_KEY: "test-server-key",
      },
    },
  ],
});
