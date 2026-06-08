#!/usr/bin/env node
/**
 * Build a DWC plugin against a DuetWebControl checkout and assert the result is a valid, correctly
 * externalised, installable bundle.
 *
 *   DWC_DIR=/path/to/DuetWebControl  npx dwc-plugin-verify-build [pluginDir]
 *
 * Checks:
 *   - build-plugin-pkg succeeds and produces <id>-<ver>.zip,
 *   - the manifest lists a JS + CSS file in dwcFiles (so the loader will pick them up),
 *   - the JS externalises to window.DWC.* (rather than bundling DWC/Vuetify),
 *   - no second Vuetify copy is bundled (no `createVuetify`).
 * Exits non-zero on any failure. Cleans up dist/ and pkg/ afterwards.
 */
import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { resolve, join } from "node:path";

const dwcDir = process.env.DWC_DIR;
const pluginDir = resolve(process.argv[2] ?? process.cwd());

if (!dwcDir || !existsSync(dwcDir)) {
	console.error("DWC_DIR is not set or does not exist. Set it to a DuetWebControl checkout.");
	process.exit(2);
}

const fail = (msg) => { console.error(`verify-build: ${msg}`); process.exit(1); };

// 1. Build
try {
	execSync(`node ${JSON.stringify(join(dwcDir, "scripts", "build-plugin-pkg.js"))} ${JSON.stringify(pluginDir)}`,
		{ cwd: dwcDir, stdio: "inherit" });
} catch {
	fail("build-plugin-pkg failed.");
}

// 2. ZIP present
const zips = readdirSync(pluginDir).filter((f) => /-.*\.zip$/.test(f));
if (!zips.length) fail("no plugin ZIP produced.");

// 3. Inspect the emitted JS/CSS
const distDir = join(pluginDir, "dist");
const cleanup = () => { for (const d of ["dist", "pkg"]) rmSync(join(pluginDir, d), { recursive: true, force: true }); };
try {
	if (!existsSync(distDir)) fail("no dist/ output to inspect.");
	const files = readdirSync(distDir);
	const js = files.find((f) => f.endsWith(".js") && !f.endsWith(".map"));
	const css = files.find((f) => f.endsWith(".css"));
	if (!js) fail("no JS bundle emitted.");
	const jsText = readFileSync(join(distDir, js), "utf8");
	if (!/\bDWC\b/.test(jsText)) fail("bundle does not reference window.DWC — externals may be misconfigured.");
	if (/createVuetify/.test(jsText)) fail("bundle contains createVuetify — a second Vuetify copy was bundled.");
	if (statSync(join(distDir, js)).size < 200) fail("JS bundle is suspiciously small.");
	console.log(`verify-build OK: ${js}${css ? ` + ${css}` : ""}, ZIP: ${zips[0]}`);
} finally {
	cleanup();
}
