// Stub for `@/composables/useFirmwareInstall`. Provides the real module's public shape
// (FirmwareUpdatePlan, PluginBundleDetectedError, planFiles/hasPendingUpdates/runUpdate) with
// simplified logic - a plugin under test only needs this to exist and behave sanely enough to
// mount/compile. The REAL classification/upload logic is DWC's own and is exercised by
// `dwc-plugin-verify-build` against a real DWC checkout, not by this stub.
export interface FirmwareUpdatePlan {
	files: Array<{ filename: string; content: Blob | File }>;
	webInterfaceTouched: boolean;
	configReplaced: boolean;
	firmwareBoards: Array<number>;
	wifiServer: boolean;
	display: boolean;
}

export class PluginBundleDetectedError extends Error {
	file: File;
	archive: unknown;
	constructor(file: File, archive: unknown) {
		super(`File ${file.name} is a plugin bundle`);
		this.name = "PluginBundleDetectedError";
		this.file = file;
		this.archive = archive;
	}
}

export function useFirmwareInstall() {
	async function planFiles(files: Array<File>): Promise<FirmwareUpdatePlan> {
		return {
			files: files.map((f) => ({ filename: f.name, content: f })),
			webInterfaceTouched: false,
			configReplaced: false,
			firmwareBoards: [],
			wifiServer: false,
			display: false,
		};
	}
	function hasPendingUpdates(plan: FirmwareUpdatePlan): boolean {
		return plan.firmwareBoards.length > 0 || plan.wifiServer || plan.display;
	}
	async function runUpdate(_plan: FirmwareUpdatePlan): Promise<void> {
		// No-op in tests - real M997 sequencing is DWC's own, exercised via verify-build instead.
	}
	return { planFiles, hasPendingUpdates, runUpdate };
}
