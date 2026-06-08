// Stub for `vue-router`. Minimal route/router objects backed by the shared state.
import { dwc } from "../state";

export function useRoute() {
	return dwc.route;
}

export function useRouter() {
	return {
		currentRoute: { value: dwc.route },
		push: async () => { /* no-op */ },
		replace: async (to: { query?: Record<string, unknown> }) => {
			if (to && to.query) dwc.route.query = { ...to.query };
		},
		beforeEach: () => () => { /* returns an unregister fn */ },
		afterEach: () => () => { /* unregister */ },
		getRoutes: () => [] as Array<unknown>,
		resolve: (to: unknown) => ({ href: typeof to === "string" ? to : "/" }),
	};
}

export function createRouter() { return useRouter(); }
export function createWebHistory() { return {}; }
export function createMemoryHistory() { return {}; }
