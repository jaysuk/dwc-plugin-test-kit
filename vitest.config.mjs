import vue from "@vitejs/plugin-vue";

import { dwcVitestConfig } from "./src/vitest.mjs";

// The kit's own self-tests. Uses the kit's config helper but points setup/include at the local
// sources (rather than the published package name).
export default dwcVitestConfig({
	plugins: [vue()],
	test: {
		include: ["test/**/*.test.ts"],
		setupFiles: ["./src/setup.ts"],
		server: { deps: { inline: [/vuetify/] } },
	},
});
