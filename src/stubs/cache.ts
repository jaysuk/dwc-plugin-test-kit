// Stub for `@/stores/cache`.
import { dwc } from "../state";

export function useCacheStore() {
	return {
		plugins: dwc.cache,
		registerPluginData(plugin: string, key: string, defaultValue: unknown): void {
			if (!dwc.cache[plugin]) dwc.cache[plugin] = {};
			if (!(key in dwc.cache[plugin])) dwc.cache[plugin][key] = defaultValue;
		},
		setPluginData(plugin: string, key: string, value: unknown): void {
			if (!dwc.cache[plugin]) dwc.cache[plugin] = {};
			dwc.cache[plugin][key] = value;
		},
	};
}
