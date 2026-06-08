/**
 * Mock of a Duet board's HTTP (REST) interface for E2E tests. Implements the endpoints DWC's REST
 * connector uses in standalone mode, serves a canned object model, and records every G-code sent so a
 * Playwright spec (or a unit test) can assert on it.
 *
 * Two ways to use it:
 *   import { createMockDuet } from "dwc-plugin-test-kit/mock-duet";
 *   const duet = await createMockDuet();            // { url, port, sent, reset, close, server }
 *   …
 *   await duet.close();
 *
 *   node node_modules/dwc-plugin-test-kit/src/mock-duet.mjs   # CLI: listens on MOCK_PORT (default 8080)
 *
 * Test introspection (used by Playwright specs): GET /__sent → { sent: [...] }; DELETE /__sent clears.
 *
 * NOTE: RRF's real model polling diffs by sequence numbers; this returns the full model each poll,
 * which is enough for most UI assertions but may need tuning for the DWC build you target.
 */
import { createServer } from "node:http";

/** A small but representative standalone object model. Pass `model` to createMockDuet to override. */
export const DEFAULT_MOCK_MODEL = {
	boards: [{ firmwareName: "RepRapFirmware (mock)", firmwareVersion: "3.7.0", canAddress: 0 }],
	directories: { gCodes: "0:/gcodes", macros: "0:/macros", system: "0:/sys" },
	fans: [{ requestedValue: 0, rpm: 0 }],
	global: {},
	heat: { heaters: [{ current: 23.5, active: 0, standby: 0, state: "off" }] },
	job: { file: {}, timesLeft: {} },
	move: {
		axes: [
			{ letter: "X", homed: false, machinePosition: 0, userPosition: 0, visible: true },
			{ letter: "Y", homed: false, machinePosition: 0, userPosition: 0, visible: true },
			{ letter: "Z", homed: false, machinePosition: 0, userPosition: 0, visible: true },
		],
		workplaceNumber: 0,
		kinematics: { name: "cartesian" },
	},
	network: { name: "mock", interfaces: [{ actualIP: "127.0.0.1", state: "active" }] },
	sensors: { endstops: [], probes: [] },
	spindles: [],
	state: { status: "idle", currentTool: -1, upTime: 1, messageBox: null },
	tools: [],
	seqs: { boards: 1, directories: 1, fans: 1, heat: 1, job: 1, move: 1, network: 1, sensors: 1, spindles: 1, state: 1, tools: 1, global: 1 },
};

function getByKey(model, key) {
	if (!key) return model;
	let cur = model;
	for (const seg of key.split(".")) cur = cur?.[seg];
	return cur;
}

/**
 * Build (but do not start) the request handler + shared `sent` array. Exported for advanced use; most
 * callers want createMockDuet().
 */
export function mockDuetHandler({ model = DEFAULT_MOCK_MODEL } = {}) {
	const sent = [];
	let lastReply = "";

	const json = (res, body, code = 200) => {
		res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
		res.end(JSON.stringify(body));
	};

	const handler = (req, res) => {
		const url = new URL(req.url, "http://localhost");
		const p = url.pathname;
		const q = url.searchParams;

		if (p === "/rr_connect") return json(res, { err: 0, sessionTimeout: 8000, apiLevel: 1, isEmulated: true, boardType: "mock" });
		if (p === "/rr_disconnect") return json(res, { err: 0 });
		if (p === "/rr_model") return json(res, { key: q.get("key") ?? "", flags: q.get("flags") ?? "", result: getByKey(model, q.get("key") ?? "") });
		if (p === "/rr_gcode") { sent.push(q.get("gcode") ?? ""); lastReply = ""; return json(res, { buff: 255 }); }
		if (p === "/rr_reply") { res.writeHead(200, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" }); return res.end(lastReply); }
		if (p === "/rr_filelist") return json(res, { dir: q.get("dir") ?? "0:/", first: 0, files: [], next: 0 });
		if (p === "/rr_fileinfo") return json(res, { err: 1 });

		if (p === "/__sent" && req.method === "DELETE") { sent.length = 0; return json(res, { ok: true }); }
		if (p === "/__sent") return json(res, { sent });

		json(res, { err: 0 });
	};

	return { handler, sent };
}

/** Start a mock Duet on `port` (0 = an ephemeral free port). Resolves once listening. */
export function createMockDuet({ port = Number(process.env.MOCK_PORT ?? 0), model = DEFAULT_MOCK_MODEL } = {}) {
	const { handler, sent } = mockDuetHandler({ model });
	const server = createServer(handler);
	return new Promise((resolve) => {
		server.listen(port, () => {
			const actual = server.address().port;
			resolve({
				server,
				port: actual,
				url: `http://localhost:${actual}`,
				/** G-code recorded so far (live array). */
				sent,
				/** Clear the recorded G-code. */
				reset() { sent.length = 0; },
				/** Stop listening. */
				close() { return new Promise((r) => server.close(r)); },
			});
		});
	});
}

// CLI: `node mock-duet.mjs` (or the copy in your e2e/) — used as Playwright's webServer command.
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("mock-duet.mjs")) {
	const port = Number(process.env.MOCK_PORT ?? 8080);
	createMockDuet({ port }).then((d) => console.log(`mock-duet listening on ${d.url}`));
}
