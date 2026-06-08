// Stub for `@/stores/machine`. Reads/writes the shared DWC test state.
import { dwc, type DwcFile } from "../state";

export function useMachineStore() {
	return {
		get model() { return dwc.model; },
		get isConnected() { return dwc.connected; },
		async sendCode(code: string, _fromInput?: boolean, _logReply?: boolean): Promise<string> {
			dwc.sentCodes.push(code);
			return "";
		},
		async getFileList(directory: string): Promise<Array<DwcFile>> {
			return dwc.files[directory] ?? [];
		},
	};
}
