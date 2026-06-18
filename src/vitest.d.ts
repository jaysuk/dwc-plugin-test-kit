// Type declarations for vitest.mjs. Lets a consumer's `vitest.config.ts` import
// `dwc-plugin-test-kit/vitest` without TS7016 (esp. under DWC 3.7's build-time type-check, which
// compiles the plugin's vitest.config.ts). The shape is a Vitest/Vite UserConfig; typed loosely to
// avoid a hard dependency on vitest's types here.
export function dwcVitestConfig(overrides?: Record<string, unknown>): Record<string, unknown>;
