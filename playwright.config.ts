import { defineConfig } from "@playwright/test";
export default defineConfig({
  timeout: 120000,
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1440, height: 900 },
    launchOptions: { args: [process.env.COURAGE_QA_GPU === "metal" ? "--use-angle=metal" : "--use-angle=swiftshader", "--enable-webgl"] },
    trace: "retain-on-failure",
  },
  reporter: "list",
});
