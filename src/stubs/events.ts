// Stub for `@/utils/events` — a minimal mitt-compatible emitter so plugins can subscribe/emit DWC
// events (e.g. dwcPluginUnloaded, message, codeExecuted) in tests.
type Handler = (payload?: unknown) => void;

const handlers = new Map<string, Set<Handler>>();

const emitter = {
	on(type: string, handler: Handler): void {
		if (!handlers.has(type)) handlers.set(type, new Set());
		handlers.get(type)!.add(handler);
	},
	off(type: string, handler: Handler): void {
		handlers.get(type)?.delete(handler);
	},
	emit(type: string, payload?: unknown): void {
		handlers.get(type)?.forEach((h) => h(payload));
	},
	all: handlers,
};

export default emitter;
