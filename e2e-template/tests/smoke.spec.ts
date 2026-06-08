import { expect, test } from "@playwright/test";

// Example E2E smoke: load DWC (with your plugin installed + connected to the mock Duet), confirm the
// app renders with no console errors, and capture a baseline screenshot for visual regression.
//
// Adapt the selectors/flow to your plugin (e.g. navigate to its page, activate a custom layout,
// open the add-widget palette, etc.).

test("DWC loads with the plugin and no console errors", async ({ page }) => {
	const errors: Array<string> = [];
	page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
	page.on("pageerror", (e) => errors.push(String(e)));

	await page.goto("/");
	await page.waitForLoadState("networkidle");

	// The app shell should be present.
	await expect(page.locator(".v-application")).toBeVisible();

	expect(errors, `console errors:\n${errors.join("\n")}`).toEqual([]);
	await expect(page).toHaveScreenshot("dwc-loaded.png", { maxDiffPixelRatio: 0.02 });
});

test("a G-code button reaches the board", async ({ page, request }) => {
	await request.delete("http://localhost:8080/__sent");

	await page.goto("/");
	await page.waitForLoadState("networkidle");

	// TODO: navigate to your plugin and click a control that sends, e.g., G28.
	// await page.getByRole("button", { name: "Home All" }).click();

	// const { sent } = await (await request.get("http://localhost:8080/__sent")).json();
	// expect(sent).toContain("G28");
});
