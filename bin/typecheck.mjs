#!/usr/bin/env node
/**
 * Type-check a DWC plugin against a DuetWebControl checkout.
 *
 * An external plugin's `@/…` imports only resolve inside the DWC source tree, so we copy the plugin's
 * `src/` into a throwaway folder under `<DWC>/src/plugins/` and run DWC's `vue-tsc`, then report only
 * the errors in that folder.
 *
 *   DWC_DIR=/path/to/DuetWebControl  npx dwc-plugin-typecheck [pluginDir]
 *
 * pluginDir defaults to the current directory. Exits non-zero if the plugin has type errors.
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";

const dwcDir = process.env.DWC_DIR;
const pluginDir = resolve(process.argv[2] ?? process.cwd());

if (!dwcDir || !existsSync(dwcDir)) {
	console.error("DWC_DIR is not set or does not exist. Set it to a DuetWebControl checkout.");
	process.exit(2);
}
const pluginSrc = join(pluginDir, "src");
if (!existsSync(pluginSrc)) {
	console.error(`No src/ found in plugin dir: ${pluginDir}`);
	process.exit(2);
}

const tag = `_typecheck_${Date.now().toString(36)}`;
const dest = join(dwcDir, "src", "plugins", tag);

// Skip test files/dirs — they import vitest (not present in the DWC checkout) and aren't shipped.
const isTest = (src) => /([\\/]__tests__[\\/]|[\\/]test[\\/]|\.test\.ts$)/.test(src);

try {
	cpSync(pluginSrc, dest, { recursive: true, filter: (src) => !isTest(src) });
	let output = "";
	try {
		output = execSync("npx vue-tsc --noEmit", { cwd: dwcDir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
	} catch (e) {
		output = `${e.stdout ?? ""}${e.stderr ?? ""}`;
	}
	const errors = output.split(/\r?\n/).filter((l) => l.includes(`plugins/${tag}`));
	if (errors.length) {
		console.error(`Type errors in ${pluginDir}:\n${errors.map((l) => l.replace(`plugins/${tag}`, "src")).join("\n")}`);
		process.exit(1);
	}
	console.log("Type-check passed.");
} finally {
	rmSync(dest, { recursive: true, force: true });
}
