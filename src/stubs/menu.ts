// Stub for `@/stores/menu`.
export interface MenuItem {
	icon?: string;
	caption?: string;
	path?: string;
	translated?: boolean;
	[key: string]: unknown;
}

export function useMenuStore() {
	return {
		categories: [] as Array<unknown>,
		items: {} as Record<string, unknown>,
		registerPluginContextMenuItem() { /* no-op */ },
	};
}
