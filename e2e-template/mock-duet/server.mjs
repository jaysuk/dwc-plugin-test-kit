#!/usr/bin/env node
/**
 * Minimal mock of a Duet board's HTTP (REST) interface for E2E tests. Implements the endpoints the
 * DWC REST connector uses in standalone mode, serves a canned object model, and records every
 * G-code sent so a Playwright spec can assert on it via GET /__sent.
 *
 *   node mock-duet/server.mjs            # listens on :8080
 *   MOCK_PORT=9000 node mock-duet/server.mjs
 *
 * NOTE: RRF's real model polling diffs by sequence numbers; this returns the full model each poll,
 * which is enough for most UI assertions but may need tuning for your DWC build.
 */
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_PORT ?? 8080);

const sent = [];
let lastReply = "";

// A small but representative object model. Extend per your test needs.
const model = {
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

function getByKey(key) {
	if (!key) return model;
	let cur = model;
	for (const seg of key.split(".")) cur = cur?.[seg];
	return cur;
}

const json = (res, body, code = 200) => {
	res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
	res.end(JSON.stringify(body));
};

createServer((req, res) => {
	const url = new URL(req.url, `http://localhost:${PORT}`);
	const p = url.pathname;
	const q = url.searchParams;

	if (p === "/rr_connect") return json(res, { err: 0, sessionTimeout: 8000, apiLevel: 1, isEmulated: true, boardType: "mock" });
	if (p === "/rr_disconnect") return json(res, { err: 0 });
	if (p === "/rr_model") return json(res, { key: q.get("key") ?? "", flags: q.get("flags") ?? "", result: getByKey(q.get("key") ?? "") });
	if (p === "/rr_gcode") { const g = q.get("gcode") ?? ""; sent.push(g); lastReply = ""; return json(res, { buff: 255 }); }
	if (p === "/rr_reply") { res.writeHead(200, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" }); return res.end(lastReply); }
	if (p === "/rr_filelist") return json(res, { dir: q.get("dir") ?? "0:/", first: 0, files: [], next: 0 });
	if (p === "/rr_fileinfo") return json(res, { err: 1 });

	// Test introspection: GET /__sent -> codes recorded so far; DELETE /__sent -> clear.
	if (p === "/__sent" && req.method === "DELETE") { sent.length = 0; return json(res, { ok: true }); }
	if (p === "/__sent") return json(res, { sent });

	json(res, { err: 0 });
}).listen(PORT, () => console.log(`mock-duet listening on http://localhost:${PORT}`));
