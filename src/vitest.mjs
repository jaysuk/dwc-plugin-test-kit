/**
 * One-line-ish Vitest config for a DWC plugin. In your `vitest.config.ts`:
 *
 *   import vue from "@vitejs/plugin-vue";
 *   import { dwcVitestConfig } from "dwc-plugin-test-kit/vitest";
 *   export default dwcVitestConfig({ plugins: [vue()] });
 *
 * Bundles the `@/…` → stub aliases, happy-dom + setup polyfills, shared-dep dedupe (single
 * Vue/Vuetify copy), and the inline rules Vuetify/the kit need. The consumer supplies `vue()` so the
 * Vue plugin resolves from the consumer's own node_modules (config is loaded by raw Node).
 *
 * Plain JS (.mjs) because it is loaded by Node at config-load time.
 */
import { dwcAliases } from "./aliases.mjs";

export function dwcVitestConfig(overrides = {}) {
	const { test: testOverrides, plugins: pluginOverrides, resolve: resolveOverrides, ...rest } = overrides;
	return {
		plugins: [...(pluginOverrides ?? [])],
		resolve: {
			alias: dwcAliases(),
			dedupe: ["vue", "vuetify", "@vue/test-utils", "@vue/runtime-core", "@vue/runtime-dom", "@vue/shared"],
			...(resolveOverrides ?? {}),
		},
		// Linked sibling kit lives outside the consumer repo — let Vite serve it.
		server: { fs: { strict: false } },
		test: {
			include: ["src/**/*.test.ts", "test/**/*.test.ts"],
			environment: "happy-dom",
			setupFiles: ["dwc-plugin-test-kit/setup"],
			server: { deps: { inline: [/dwc-plugin-test-kit/, /vuetify/] } },
			...(testOverrides ?? {}),
		},
		...rest,
	};
}
