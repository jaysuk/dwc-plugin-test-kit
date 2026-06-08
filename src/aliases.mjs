/**
 * Vitest/Vite `resolve.alias` map pointing a plugin's external imports (`@/stores/*`, `@/plugins`,
 * `@/i18n`, `@/utils/events`, plus `vue-router`, `@duet3d/objectmodel`, `grid-layout-plus`) at the
 * kit's stubs.
 *
 * Plain JS (.mjs) because it is loaded by Node at Vitest config-load time, where TypeScript and
 * extensionless imports aren't available. The stub targets are .ts files transformed by Vite during
 * the test run.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const stubsDir = join(dirname(fileURLToPath(import.meta.url)), "stubs");
const stub = (name) => join(stubsDir, `${name}.ts`);

export function dwcAliases() {
	return {
		"@/stores/machine": stub("machine"),
		"@/stores/ui": stub("ui"),
		"@/stores/settings": stub("settings"),
		"@/stores/cache": stub("cache"),
		"@/stores/menu": stub("menu"),
		"@/plugins": stub("plugins"),
		"@/composables/useComponentSettings": stub("useComponentSettings"),
		"@/composables/useConfirmDialog": stub("useConfirmDialog"),
		"@/composables/useInputDialog": stub("useInputDialog"),
		"@/i18n": stub("i18n"),
		"@/utils/events": stub("events"),
		"vue-router": stub("router"),
		"@duet3d/objectmodel": stub("objectmodel"),
		"grid-layout-plus": stub("gridlayout"),
	};
}
