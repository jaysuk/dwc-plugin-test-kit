/**
 * Shared, reactive "DWC under test" state.
 *
 * The store/module stubs read and write this object, and the harness exposes helpers to drive it
 * (set the object model, toggle the connection, read back sent G-code, etc.). One reactive instance
 * is shared per test run and reset before each test by `setup.ts`.
 */
import { reactive } from "vue";

import { makeObjectModel } from "./fixtures";

export interface DwcNotification { type: string; title: string; message?: string | null }
export interface DwcFile { name: string; isDirectory: boolean }

export interface DwcState {
	/** The object model (a plain-object / fixture mimicking @duet3d/objectmodel). */
	model: Record<string, unknown>;
	/** Whether a machine is "connected". */
	connected: boolean;
	/** When true, controls disable themselves (uiStore.uiFrozen). */
	uiFrozen: boolean;
	/** Every G-code string passed to machineStore.sendCode, in order. */
	sentCodes: Array<string>;
	/** Notifications raised via uiStore.makeNotification / log. */
	notifications: Array<DwcNotification>;
	/** Folder path -> directory listing, for machineStore.getFileList. */
	files: Record<string, Array<DwcFile>>;
	/** The settings store (darkTheme, plugins, useCustomLayout, …). */
	settings: Record<string, unknown>;
	/** The cache store's per-plugin data bag. */
	cache: Record<string, Record<string, unknown>>;
	/** The current route (vue-router stub). */
	route: { path: string; query: Record<string, unknown>; params: Record<string, unknown> };
}

function freshState(): DwcState {
	return {
		model: makeObjectModel(),
		connected: true,
		uiFrozen: false,
		sentCodes: [],
		notifications: [],
		files: {},
		settings: {
			darkTheme: false,
			useCustomLayout: false,
			layoutUserSet: false,
			plugins: {} as Record<string, unknown>,
		},
		cache: {},
		route: { path: "/", query: {}, params: {} },
	};
}

export const dwc: DwcState = reactive(freshState());

/** Restore every field to its default (called automatically before each test). */
export function resetDwc(): void {
	Object.assign(dwc, freshState());
}
