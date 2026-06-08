// Stub for `@/composables/useInputDialog`. Numeric/string prompts auto-cancel (resolve null) in
// tests since there's no UI to type into; override per-test if you need a specific answer.
export function getNumericInput(
	_title?: string, _prompt?: string, _preset?: number, _min?: number, _max?: number,
): Promise<number | null> {
	return Promise.resolve(null);
}
export function getStringInput(
	_title?: string, _prompt?: string, _preset?: string, _minLength?: number, _maxLength?: number,
): Promise<string | null> {
	return Promise.resolve(null);
}
