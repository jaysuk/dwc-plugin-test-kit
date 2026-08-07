// Stub for `@/composables/useFirmwareInstallController`. Mirrors the real controller's public
// shape and orchestration (plan -> maybe show dialog -> confirm/cancel runs or drops the plan),
// built on this package's own useFirmwareInstall stub. See that file's doc comment for why the
// real classification/M997 logic isn't reproduced here.
import { reactive } from "vue";

import { type FirmwareUpdatePlan, useFirmwareInstall } from "./useFirmwareInstall";

export interface FirmwareInstallController {
	runFirmwareUpload(files: Array<File>): Promise<void>;
	firmwareDialog: { shown: boolean; plan: FirmwareUpdatePlan | null };
	configUpdatedDialog: { shown: boolean };
	onFirmwareUpdateConfirmed(): Promise<void>;
	onFirmwareUpdateCancelled(): void;
}

export const firmwareInstallControllerKey = Symbol("firmwareInstallController");

export function useFirmwareInstallController(): FirmwareInstallController {
	const firmwareInstall = useFirmwareInstall();
	const firmwareDialog = reactive<{ shown: boolean; plan: FirmwareUpdatePlan | null }>({ shown: false, plan: null });
	const configUpdatedDialog = reactive({ shown: false });

	async function runFirmwareUpload(files: Array<File>): Promise<void> {
		const plan = await firmwareInstall.planFiles(files);
		if (firmwareInstall.hasPendingUpdates(plan)) {
			firmwareDialog.plan = plan;
			firmwareDialog.shown = true;
		}
	}

	async function onFirmwareUpdateConfirmed(): Promise<void> {
		const plan = firmwareDialog.plan;
		firmwareDialog.plan = null;
		if (plan) {
			await firmwareInstall.runUpdate(plan);
		}
	}

	function onFirmwareUpdateCancelled(): void {
		firmwareDialog.plan = null;
	}

	return { runFirmwareUpload, firmwareDialog, configUpdatedDialog, onFirmwareUpdateConfirmed, onFirmwareUpdateCancelled };
}
