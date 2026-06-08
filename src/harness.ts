/**
 * Mount helper for DWC plugin components. Installs Vuetify and DWC's global `$t`, so a component
 * mounts the same way it would inside DWC. Combine with `dwcAliases()` (so the component's
 * `@/stores/*` imports resolve to the kit's stubs) and the helpers below to drive the fake machine.
 */
import { mount, type VueWrapper } from "@vue/test-utils";
import type { Component } from "vue";
import { createVuetify } from "vuetify";
import * as vComponents from "vuetify/components";
import * as vDirectives from "vuetify/directives";

import { dwc, resetDwc } from "./state";
import i18n from "./stubs/i18n";

let vuetify: ReturnType<typeof createVuetify> | null = null;
function getVuetify() {
	if (!vuetify) vuetify = createVuetify({ components: vComponents, directives: vDirectives });
	return vuetify;
}

export interface MountDwcOptions {
	props?: Record<string, unknown>;
	slots?: Record<string, unknown>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	global?: Record<string, any>;
}

/** Mount a component in a DWC-like environment (Vuetify + `$t`). */
export function mountInDwc(component: Component, options: MountDwcOptions = {}): VueWrapper {
	const userGlobal = options.global ?? {};
	return mount(component as Component, {
		props: options.props,
		slots: options.slots,
		global: {
			...userGlobal,
			plugins: [getVuetify(), ...(userGlobal.plugins ?? [])],
			config: {
				...(userGlobal.config ?? {}),
				globalProperties: {
					$t: i18n.global.t,
					$tc: i18n.global.t,
					$te: i18n.global.te,
					...((userGlobal.config ?? {}).globalProperties ?? {}),
				},
			},
		},
	}) as VueWrapper;
}

// ── Drive the fake machine ─────────────────────────────────────────────────────────
export { dwc, resetDwc };

export function setModel(model: Record<string, unknown>): void { dwc.model = model; }
export function patchModel(patch: Record<string, unknown>): void { Object.assign(dwc.model, patch); }
export function setConnected(connected: boolean): void { dwc.connected = connected; }
export function setUiFrozen(frozen: boolean): void { dwc.uiFrozen = frozen; }
export function setFiles(directory: string, files: Array<{ name: string; isDirectory: boolean }>): void {
	dwc.files[directory] = files;
}
export function setGlobals(entries: Record<string, unknown>): void {
	const m = (dwc.model as { global?: Map<string, unknown> }).global;
	if (m instanceof Map) { m.clear(); for (const [k, v] of Object.entries(entries)) m.set(k, v); }
}
export function setMessageBox(box: Record<string, unknown> | null): void {
	(dwc.model as { state: Record<string, unknown> }).state.messageBox = box;
}

/** Every G-code string sent via machineStore.sendCode, in order. */
export function sentCodes(): Array<string> { return dwc.sentCodes; }
/** The most recent sent G-code (or undefined). */
export function lastCode(): string | undefined { return dwc.sentCodes[dwc.sentCodes.length - 1]; }
/** Notifications raised via uiStore. */
export function notifications() { return dwc.notifications; }
