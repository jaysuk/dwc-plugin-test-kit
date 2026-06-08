// Stub for `@/stores/ui`.
import { dwc } from "../state";

export enum LogLevel {
	success = "success",
	info = "info",
	primary = "primary",
	warning = "warning",
	error = "error",
}

export function useUiStore() {
	return {
		get uiFrozen() { return dwc.uiFrozen; },
		makeNotification(type: string, title: string, message: string | null = null): string {
			dwc.notifications.push({ type, title, message });
			return "notification-id";
		},
		log(type: string, title: string, message: string | null = null): string {
			dwc.notifications.push({ type, title, message });
			return "log-id";
		},
		logCode() { /* no-op */ },
	};
}
