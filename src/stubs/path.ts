// Stub for `@/utils/path`. Not simplified - this is DWC's real src/utils/path.ts verbatim: it's a
// pure, dependency-free string-manipulation module (no stores, no composables), so there's nothing
// to fake. Keep in sync with DWC's copy if it changes.

export function combine(...args: Array<string>): string {
	let result = "";
	for (const arg of args) {
		if (arg.startsWith("/") || /(\d)+:.*/.test(arg)) {
			result = arg.endsWith("/") ? arg.substring(0, arg.length - 1) : arg;
		} else {
			if (result !== "") {
				result += "/";
			}
			result += arg.endsWith("/") ? arg.substring(0, arg.length - 1) : arg;
		}
	}
	return result;
}

export function equals(a: string, b: string): boolean {
	if (a && b) {
		if (a.startsWith("/")) { a = "0:" + a; }
		if (a.endsWith("/")) { a = a.substring(0, a.length - 1); }
		if (b.startsWith("/")) { b = "0:" + b; }
		if (b.endsWith("/")) { b = b.substring(0, b.length - 1); }
	}
	return a === b;
}

export function extractDirectory(path: string): string {
	if (!path) { return path; }
	if (path.indexOf("/") !== -1) {
		const items = path.split("/");
		items.pop();
		return items.join("/");
	}
	if (path.indexOf("\\") !== -1) {
		const items = path.split("\\");
		items.pop();
		return items.join("\\");
	}
	return path;
}

export function extractFileName(path: string): string {
	if (!path) { return path; }
	if (path.indexOf("/") !== -1) {
		const items = path.split("/");
		return items[items.length - 1];
	}
	if (path.indexOf("\\") !== -1) {
		const items = path.split("\\");
		return items[items.length - 1];
	}
	return path;
}

export function filesAffectDirectory(files: Array<string>, directory: string): boolean {
	return files.some((file) => equals(directory, file) || equals(directory, extractDirectory(file)));
}

export function getVolume(path: string): number {
	if (path) {
		const matches = /^(\d+):/.exec(path);
		if (matches) { return parseInt(matches[1], 10); }
	}
	return 0;
}

export function volumeRoot(volume: number): string {
	return `${volume}:/`;
}

function explorerSegments(sdPath: string): Array<string> {
	const match = /^(\d+):\/?(.*)$/.exec(sdPath);
	const volume = match ? match[1] : "0";
	const pathSegments = (match ? match[2] : "").split("/").filter(Boolean);
	const omitVolume = volume === "0" && (pathSegments.length === 0 || !/^\d+$/.test(pathSegments[0]));
	return omitVolume ? pathSegments : [volume, ...pathSegments];
}

export function explorerRoute(sdPath: string): string {
	const segments = explorerSegments(sdPath);
	return segments.length > 0 ? `/Explorer/${segments.join("/")}` : "/Explorer";
}

export function editRoute(sdPath: string): string {
	return `/Explorer/${["edit", ...explorerSegments(sdPath)].join("/")}`;
}

export function startsWith(path: string, value: string): boolean {
	if (path && value) {
		if (path.startsWith("/")) { path = "0:" + path; }
		if (path.endsWith("/")) { path = path.substring(0, path.length - 1); }
		if (value.startsWith("/")) { value = "0:" + value; }
		if (value.endsWith("/")) { value = value.substring(0, value.length - 1); }
		return path.startsWith(value);
	}
	return false;
}

export function isGCodePath(path: string, gcodesDir: string): boolean {
	path = path.toLowerCase();
	return startsWith(path, gcodesDir)
		|| path.endsWith(".g") || path.endsWith(".gcode") || path.endsWith(".gc") || path.endsWith(".gco")
		|| path.endsWith(".nc") || path.endsWith(".ngc") || path.endsWith(".tap");
}

export function isSdPath(path: string): boolean {
	return startsWith(path, pathObj.filaments)
		|| startsWith(path, pathObj.firmware)
		|| startsWith(path, pathObj.gCodes)
		|| startsWith(path, pathObj.macros)
		|| startsWith(path, pathObj.menu)
		|| startsWith(path, pathObj.scans)
		|| startsWith(path, pathObj.system)
		|| startsWith(path, pathObj.web);
}

export function stripMacroFilename(filename: string): string {
	let label = filename;
	let match = filename.match(/(.*)\.(g|gc|gcode)$/i);
	if (match != null) { label = match[1]; }
	match = label.match(/^\d+_(.*)/);
	if (match != null) { label = match[1]; }
	return label;
}

export function escapeFilename(filename: string): string {
	return filename.replace(/'/g, "''");
}

export function pretty(path: string | null | undefined): string {
	if (!path) { return ""; }
	return path.startsWith("0:") ? path.substring(2) : path;
}

export function isSystemPath(path: string, systemDirectory: string): boolean {
	return startsWith(path, systemDirectory) || startsWith(path, pathObj.system);
}

export function isConfigFile(path: string, systemDirectory: string): boolean {
	return equals(path, combine(systemDirectory, pathObj.configFile)) || equals(path, combine(pathObj.system, pathObj.configFile));
}

const pathObj = {
	filaments: "0:/filaments",
	firmware: "0:/sys",
	gCodes: "0:/gcodes",
	macros: "0:/macros",
	menu: "0:/menu",
	scans: "0:/scans",
	system: "0:/sys",
	web: "0:/www",

	dwcCacheFile: "0:/sys/dwc-cache.json",
	legacyDwcCacheFile: "0:/sys/dwc-cache.json",
	dwcSettingsFile: "0:/sys/dwc-settings.json",
	legacyDwcSettingsFile: "0:/sys/dwc2-settings.json",
	dwcFactoryDefaults: "0:/sys/dwc-defaults.json",
	legacyDwcFactoryDefaults: "0:/sys/dwc2-defaults.json",
	dwcPluginsFile: "0:/sys/dwc-plugins.json",

	boardFile: "0:/sys/board.txt",
	configFile: "config.g",
	configBackupFile: "config.g.bak",
	filamentsFile: "filaments.csv",
	heightmapFile: "heightmap.csv",

	accelerometer: "0:/sys/accelerometer",
	closedLoop: "0:/sys/closed-loop",

	combine, editRoute, equals, escapeFilename, explorerRoute, extractDirectory, extractFileName,
	filesAffectDirectory, getVolume, startsWith, volumeRoot,
	isConfigFile, isGCodePath, isSdPath, isSystemPath, pretty, stripMacroFilename,
};

export default pathObj;
