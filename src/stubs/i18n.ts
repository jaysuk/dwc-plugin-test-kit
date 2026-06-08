// Stub for `@/i18n`. `t` echoes the key (optionally interpolating named params) so tests assert on
// keys rather than translations.
function t(key: string, named?: Record<string, unknown>): string {
	if (named && Object.keys(named).length) {
		return key.replace(/\{(\w+)\}/g, (_m, k) => (k in named ? String(named[k]) : `{${k}}`));
	}
	return key;
}

const i18n = {
	global: {
		t,
		te: () => true,
		mergeLocaleMessage: () => { /* no-op */ },
		locale: { value: "en" },
	},
};

export default i18n;
