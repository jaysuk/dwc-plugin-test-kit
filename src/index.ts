/**
 * dwc-plugin-test-kit — reusable test harness for DuetWebControl (Vue 3) plugins.
 * See README.md for setup. Public surface:
 */
export { dwcAliases } from "./aliases";
export { makeObjectModel } from "./fixtures";
export type { DwcState, DwcFile, DwcNotification } from "./state";
export {
	mountInDwc,
	type MountDwcOptions,
	dwc,
	resetDwc,
	setModel,
	patchModel,
	setConnected,
	setUiFrozen,
	setFiles,
	setGlobals,
	setMessageBox,
	sentCodes,
	lastCode,
	notifications,
} from "./harness";
