import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createMockDuet } from "../src/mock-duet.mjs";

// Verifies the reusable E2E core (the mock Duet REST server) end-to-end over real HTTP, so the
// Playwright layer can rely on it. The browser/screenshot half of E2E still needs a served DWC and is
// documented in e2e-template/, but this — the connector + G-code recording — is automated.
describe("mock Duet REST server", () => {
	let duet: Awaited<ReturnType<typeof createMockDuet>>;

	beforeAll(async () => { duet = await createMockDuet({ port: 0 }); });
	afterAll(async () => { await duet.close(); });

	const get = async (path: string) => (await fetch(`${duet.url}${path}`)).json();

	it("rr_connect reports a session", async () => {
		expect(await get("/rr_connect")).toMatchObject({ err: 0, isEmulated: true });
	});

	it("rr_model returns the whole model for an empty key", async () => {
		const r = await get("/rr_model?key=&flags=d99fno");
		expect(r.result.state.status).toBe("idle");
		expect(r.result.move.axes.map((a: { letter: string }) => a.letter)).toEqual(["X", "Y", "Z"]);
	});

	it("rr_model resolves a dotted key", async () => {
		const r = await get("/rr_model?key=state");
		expect(r.result.currentTool).toBe(-1);
	});

	it("rr_gcode records sent codes, readable via /__sent", async () => {
		await fetch(`${duet.url}/__sent`, { method: "DELETE" });
		await get("/rr_gcode?gcode=" + encodeURIComponent("G28"));
		await get("/rr_gcode?gcode=" + encodeURIComponent("M18"));
		expect(duet.sent).toEqual(["G28", "M18"]);
		const introspect = await get("/__sent");
		expect(introspect.sent).toEqual(["G28", "M18"]);
	});

	it("DELETE /__sent and reset() clear the record", async () => {
		await get("/rr_gcode?gcode=G90");
		await fetch(`${duet.url}/__sent`, { method: "DELETE" });
		expect((await get("/__sent")).sent).toEqual([]);
		duet.reset();
		expect(duet.sent).toEqual([]);
	});

	it("serves a custom model when provided", async () => {
		const custom = await createMockDuet({ port: 0, model: { state: { status: "processing" } } });
		try {
			const r = await (await fetch(`${custom.url}/rr_model?key=`)).json();
			expect(r.result.state.status).toBe("processing");
		} finally {
			await custom.close();
		}
	});
});
