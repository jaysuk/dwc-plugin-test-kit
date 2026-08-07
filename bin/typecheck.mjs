#!/usr/bin/env node
/**
 * Type-check a DWC plugin against a DuetWebControl checkout.
 *
 * An external plugin's `@/…` imports only resolve inside the DWC source tree, so we copy the plugin's
 * `src/` into a throwaway folder under `<DWC>/src/plugins/` and run DWC's `vue-tsc`, then report only
 * the errors in that folder. Also drops in the same ambient `"DuetWebControl"` / `"DuetWebControl/
 * components"` declarations DWC's real build-plugin.js generates for its own throwaway tsconfig, so a
 * plugin using those synthetic import names (the externalised, shippable form of `@/composables/*`,
 * `@/stores/*`, and DWC's public component palette) type-checks the same way here as it does for real.
 *
 *   DWC_DIR=/path/to/DuetWebControl  npx dwc-plugin-typecheck [pluginDir]
 *
 * pluginDir defaults to the current directory. Exits non-zero if the plugin has type errors.
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

/**
 * A plugin built for shipping (dwc-plugin-verify-build, via DWC's own build-plugin.js) can import
 * the synthetic `"DuetWebControl"` / `"DuetWebControl/components"` module names - DWC's own build
 * generates ambient declarations for those (see build-plugin.js's generateApiTypings) because the
 * plugin then lives outside DWC's source tree entirely. Here the plugin is copied *inside* the real
 * tree, so plain `@/...` imports already resolve on their own - but the synthetic module names still
 * don't exist anywhere in DWC's own source (DWC's in-tree code never imports itself that way), so
 * vue-tsc would otherwise fail on them. Generate the same two ambient declarations DWC's real build
 * does, dropped inside the throwaway copy so it's cleaned up with everything else.
 */
function generateApiTypings() {
	const listModules = (subdir) => readdirSync(join(dwcDir, "src", subdir), { withFileTypes: true })
		.filter((e) => e.isFile() && e.name.endsWith(".ts") && !e.name.endsWith(".d.ts"))
		.map((e) => `@/${subdir}/${e.name.replace(/\.ts$/, "")}`);

	const reExports = ["@/plugins", ...listModules("composables"), ...listModules("stores")]
		.map((m) => `\texport * from ${JSON.stringify(m)};`)
		.join("\n");

	const componentDts = join(dwcDir, "src", "components.d.ts");
	const componentExports = existsSync(componentDts)
		? [...readFileSync(componentDts, "utf-8").matchAll(/(\w+):\s*typeof import\('\.\/([^']+)'\)/g)]
			.map(([, name, path]) => `\texport { default as ${name} } from ${JSON.stringify(`@/${path}`)};`)
			.join("\n")
		: "";

	return `declare module "DuetWebControl" {\n${reExports}\n\texport { default as i18n } from "@/i18n";\n}\n\n`
		+ `declare module "DuetWebControl/components" {\n${componentExports}\n}\n`;
}

try {
	cpSync(pluginSrc, dest, { recursive: true, filter: (src) => !isTest(src) });
	mkdirSync(join(dest, "__dwc_plugin_api__"), { recursive: true });
	writeFileSync(join(dest, "__dwc_plugin_api__", "dwc-plugin-api.d.ts"), generateApiTypings());
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
