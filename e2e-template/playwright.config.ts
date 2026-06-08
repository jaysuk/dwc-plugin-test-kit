import { defineConfig, devices } from "@playwright/test";

// Drives a running DWC (BASE_URL) that has your plugin installed, with the mock Duet backend started
// alongside. Adjust BASE_URL / the webServer command for your setup.
export default defineConfig({
	testDir: "./tests",
	timeout: 30_000,
	retries: process.env.CI ? 1 : 0,
	use: {
		baseURL: process.env.BASE_URL ?? "http://localhost:5173",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
	],
	webServer: {
		command: "node mock-duet/server.mjs",
		url: "http://localhost:8080/rr_connect",
		reuseExistingServer: !process.env.CI,
	},
});
