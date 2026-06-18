// Type declarations for mock-duet.mjs (an optional Playwright/E2E helper). Provided so a consumer
// that imports `dwc-plugin-test-kit/mock-duet` from TypeScript resolves it without TS2307/TS7016.
export const DEFAULT_MOCK_MODEL: Record<string, unknown>;
export function mockDuetHandler(opts?: { model?: Record<string, unknown> }): unknown;
export function createMockDuet(opts?: { port?: number; model?: Record<string, unknown> }): unknown;
