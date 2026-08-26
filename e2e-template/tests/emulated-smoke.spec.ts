import { expect, test } from "@playwright/test";

/**
 * Same shape as smoke.spec.ts, but against a real backend — meeloo/duet3-emulation running actual
 * RepRapFirmware under Renode, not the static mock-duet server. See ../emulator/README.md for what
 * that buys over the mock (real HTTP/object-model semantics, not just "did we send the right
 * string") and its cost (a real firmware build, not something this template can start for you).
 *
 * BOARD_HOST must already be reachable (default localhost:8080, matching mock-duet's port so a spec
 * written against one is easy to point at the other). Unlike the mock, there is no `/__sent`
 * introspection endpoint here — real firmware doesn't have one — so verification reads real
 * object-model state via `request`, not a recorded G-code list. That is arguably the more honest
 * test: it proves the G-code actually did something, not just that a string was transmitted.
 */
const BOARD_HOST = process.env.BOARD_HOST ?? "localhost:8080";

/** DWC's connect dialog and its own toolbar both have a button labelled "Connect" — the toolbar one
 *  sits behind the dialog's overlay while the dialog is open, so `.first()` finds it and then hangs
 *  forever waiting for a scrim-blocked element to become clickable. The dialog's is `.last()`. */
async function connectToBoard(page: import("@playwright/test").Page, host: string) {
	await page.goto("/");
	await page.waitForLoadState("networkidle");
	await page.getByPlaceholder("Hostname").fill(host);
	await page.getByRole("button", { name: "Connect", exact: true }).last().click();
}

test("DWC connects to the real board with no console errors", async ({ page }) => {
	// The browser's own "Failed to load resource... 404" console.error carries no URL -- only DWC's
	// own follow-up warning (a separate console message) names the file. A fresh SD card genuinely
	// has no dwc-settings/dwc-defaults/dwc-plugins.json yet (same as real unconfigured hardware), so
	// each expected 404 shows up as this exact generic pair; anything else is a real problem.
	const unexpected: Array<string> = [];
	page.on("console", (m) => {
		if (m.type() !== "error") return;
		if (/Failed to load resource.*404/.test(m.text())) return;
		unexpected.push(m.text());
	});
	page.on("pageerror", (e) => unexpected.push(String(e)));

	await connectToBoard(page, BOARD_HOST);

	// Settling takes longer than the mock: real per-key object-model polling (boards, move, heat,
	// sensors, ...) plus the expected dwc-*.json 404s above.
	await expect(page.locator(".v-card", { hasText: "Status" }).first()).toContainText("Idle", { timeout: 15000 });

	expect(unexpected, `unexpected console errors:\n${unexpected.join("\n")}`).toEqual([]);
});

test("a G-code sent through the UI produces a real, verifiable machine-position change", async ({ page, request }) => {
	await connectToBoard(page, BOARD_HOST);
	await expect(page.locator(".v-card", { hasText: "Status" }).first()).toContainText("Idle", { timeout: 15000 });

	const readX = async () => {
		const res = await request.get(`http://${BOARD_HOST}/rr_model?key=move.axes%5B0%5D`);
		const { result } = await res.json();
		return result.machinePosition as number;
	};

	const before = await readX();
	await page.getByPlaceholder("Send code...").fill("G91\nG1 X10 F600\nG90");
	await page.getByRole("button", { name: "Send", exact: true }).click();

	// Do not sleep-and-hope: this is a real (cycle-accurate) firmware/motion simulation, and it does
	// NOT run at wall-clock real-time -- a 1-second move (10mm @ F600) measured ~9x slower than real
	// time in practice. Poll for the position to actually arrive and hold instead of guessing a delay.
	await expect.poll(readX, { timeout: 20000, intervals: [250] }).toBeCloseTo(before + 10, 1);
});
