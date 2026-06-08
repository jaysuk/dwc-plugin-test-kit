// Stub for `@/composables/useComponentSettings` (externalised on window.DWC since DWC 3.7.0-alpha.5).
import { type InjectionKey, ref } from "vue";

export interface SettingsScope {
	segments: Array<string>;
	childCounter: Record<string, number>;
}

export const SETTINGS_SCOPE_KEY: InjectionKey<SettingsScope> = Symbol("dwc-component-settings-scope");

export function useComponentSettings<T = Record<string, unknown>>(defaults?: T) {
	return ref<T>((defaults ?? ({} as T)));
}
