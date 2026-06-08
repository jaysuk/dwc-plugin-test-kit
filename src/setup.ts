/**
 * Vitest setup file: browser-API polyfills Vuetify needs under happy-dom, and a per-test reset of
 * the shared DWC state. Reference it from your config:
 *
 *   test: { environment: "happy-dom", setupFiles: ["dwc-plugin-test-kit/setup"] }
 */
import { beforeEach, vi } from "vitest";

import { resetDwc } from "./state";

const g = globalThis as unknown as Record<string, unknown>;

if (!g.ResizeObserver) {
	g.ResizeObserver = class {
		observe() { /* no-op */ }
		unobserve() { /* no-op */ }
		disconnect() { /* no-op */ }
	};
}
if (!g.IntersectionObserver) {
	g.IntersectionObserver = class {
		observe() { /* no-op */ }
		unobserve() { /* no-op */ }
		disconnect() { /* no-op */ }
		takeRecords() { return []; }
	};
}
if (typeof g.matchMedia !== "function") {
	g.matchMedia = (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addEventListener() { /* no-op */ },
		removeEventListener() { /* no-op */ },
		addListener() { /* no-op */ },
		removeListener() { /* no-op */ },
		dispatchEvent() { return false; },
	});
}
if (!g.visualViewport) {
	g.visualViewport = { width: 1280, height: 800, addEventListener() {}, removeEventListener() {} };
}
// happy-dom lacks a real CSS layout engine; stub the bits Vuetify probes.
if (g.CSS === undefined) {
	g.CSS = { supports: () => false, escape: (s: string) => s };
}
// execCommand is used by some clipboard fallbacks.
const doc = g.document as { execCommand?: () => boolean } | undefined;
if (doc && typeof doc.execCommand !== "function") {
	doc.execCommand = () => true;
}
// Silence the noisy Vuetify "could not find injected layout" warnings in mount smoke tests.
vi.spyOn(console, "warn").mockImplementation((msg?: unknown) => {
	if (typeof msg === "string" && /Vuetify|injected/.test(msg)) return;
	// eslint-disable-next-line no-console
	console.info(msg);
});

beforeEach(() => {
	resetDwc();
});
