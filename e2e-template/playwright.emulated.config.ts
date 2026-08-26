import { defineConfig, devices } from "@playwright/test";

// Same shape as playwright.config.ts, but against a real duet3-emulation instance instead of the
// static mock-duet server -- see emulator/README.md. Unlike the mock, this can't be started by
// Playwright's `webServer`: it's a real firmware build + Renode process with its own multi-step
// bring-up, external to this template. Both DWC (BASE_URL) and the emulator (BOARD_HOST) must
// already be running before `npx playwright test --config=playwright.emulated.config.ts`.
export default defineConfig({
	testDir: "./tests",
	testMatch: /emulated-.*\.spec\.ts/,
	timeout: 30_000,
	retries: process.env.CI ? 1 : 0,
	use: {
		// Vite's own generic default is 5173 (see playwright.config.ts), but DWC's own vite.config
		// sets 3000 -- confirmed against the checkout this was built against; verify against yours.
		baseURL: process.env.BASE_URL ?? "http://localhost:3000",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	projects: [
		{ name: "chromium", use: { ...devices["Desktop Chrome"] } },
	],
});
