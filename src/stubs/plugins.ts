// Stub for `@/plugins` (the DWC plugin API surface). All registration calls are no-ops in tests.
export const SETTINGS_SCOPE_KEY: symbol = Symbol("dwc-test-settings-scope");

export function registerRoute(): void { /* no-op */ }
export function registerLayout(): void { /* no-op */ }
export function unregisterLayout(): void { /* no-op */ }
export function registerRouteHook(): void { /* no-op */ }
export function unregisterRoute(): void { /* no-op */ }
export function registerPluginMessages(): void { /* no-op */ }
export function registerSettingTab(): void { /* no-op */ }
export function registerTheme(): void { /* no-op */ }
export function injectComponent(): void { /* no-op */ }
