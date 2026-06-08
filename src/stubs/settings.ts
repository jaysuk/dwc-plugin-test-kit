// Stub for `@/stores/settings`. Returns the shared settings bag (darkTheme, plugins, …).
import { dwc } from "../state";

export function useSettingsStore() {
	return dwc.settings as Record<string, unknown> & {
		darkTheme: boolean;
		useCustomLayout: boolean;
		layoutUserSet: boolean;
		plugins: Record<string, unknown>;
	};
}
