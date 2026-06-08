// Stub for `@/composables/useConfirmDialog`. Confirm/input dialogs auto-resolve (no UI in tests);
// override per-test if you need a specific answer.
export function showConfirmDialog(_title?: string, _prompt?: string, _icon?: string): Promise<boolean> {
	return Promise.resolve(false);
}
export function showMessageBox(): Promise<void> {
	return Promise.resolve();
}
