import sampleObjectModel from "./fixtures/sample-object-model.json";

/**
 * A realistic-enough object-model fixture for mounting read-out widgets. Pass overrides to tailor it
 * for a specific test. `global` is a real Map (matching @duet3d/objectmodel's ModelDictionary) and
 * `ledStrips`/`spindles`/`tools` are arrays, so path-resolution and type checks behave like the real
 * thing.
 */
export function makeObjectModel(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		state: {
			status: "idle",
			currentTool: -1,
			upTime: 3600,
			atxPower: false,
			messageBox: null,
			displayMessage: "",
		},
		move: {
			workplaceNumber: 0,
			kinematics: { name: "cartesian" },
			axes: [
				{ letter: "X", homed: true, machinePosition: 12.5, userPosition: 12.5, visible: true, babystep: 0 },
				{ letter: "Y", homed: true, machinePosition: 20.0, userPosition: 20.0, visible: true, babystep: 0 },
				{ letter: "Z", homed: false, machinePosition: 5.0, userPosition: 5.0, visible: true, babystep: 0.02 },
			],
			extruders: [{ position: 0 }],
		},
		heat: {
			heaters: [
				{ current: 60.1, active: 60, standby: 0, state: "active" },
				{ current: 200.4, active: 210, standby: 160, state: "active" },
			],
		},
		fans: [{ requestedValue: 0.5, actualValue: 0.5, rpm: 1200 }],
		spindles: [{ active: 0, current: 0, state: "stopped", min: 6000, max: 24000, frequency: 0 }],
		tools: [{ number: 0, name: "Tool 0", heaters: [1] }],
		sensors: {
			probes: [{ value: [0] }],
			endstops: [{ triggered: false }],
			filamentMonitors: [{ enabled: true, filamentPresent: true }],
		},
		job: {
			filePosition: 0,
			duration: 0,
			timesLeft: { file: null, filament: null, slicer: null },
			file: { size: 0, fileName: "", filament: [] },
			layer: 0,
		},
		global: new Map<string, unknown>([
			["myNumber", 42],
			["myFlag", true],
			["myText", "hello"],
			["myArray", [1, 2, 3]],
		]),
		ledStrips: [{ type: "NeoPixel_RGBW", pin: "out0", board: 0, stopMovement: false }],
		boards: [{ firmwareVersion: "3.7.0", firmwareName: "RepRapFirmware" }],
		network: { interfaces: [{ actualIP: "192.168.1.50", state: "active" }] },
		...overrides,
	};
}

export interface LoadObjectModelOptions {
	/** Convert a plain-object `global` into a real Map (matching ModelDictionary). Default: true. */
	mapGlobals?: boolean;
	/** Shallow-merged over the loaded model (after `global` conversion). */
	overrides?: Record<string, unknown>;
}

/**
 * Load a realistic object model for a mount test.
 *
 * With no argument it returns a curated, fuller standalone Duet 3 model (more keys than
 * `makeObjectModel` — directories, inputs, limits, volumes, mesh compensation, …), useful for
 * catching field-shape assumptions the thin fixture hides.
 *
 * Pass your own `dump` to test against true-to-life data: either a raw object model (plain JSON, e.g.
 * a captured DWC `machineStore.model`) or a full RRF `M409 K"" ` response of the form `{ result: {…} }`
 * — the `result` is unwrapped automatically. A plain-object `global` is converted to a Map by default
 * (set `mapGlobals: false` to keep it as-is).
 *
 * The result is a fresh deep clone, so mutating it in one test never leaks into another. Feed it to
 * `setModel(...)`.
 */
export function loadObjectModel(
	dump?: Record<string, unknown>,
	options: LoadObjectModelOptions = {},
): Record<string, unknown> {
	const { mapGlobals = true, overrides } = options;
	const source = dump ?? (sampleObjectModel as Record<string, unknown>);
	// Unwrap an M409 response ({ result: … }) but not a bare model that merely happens to have no state.
	const raw = (source && typeof source === "object" && "result" in source && !("state" in source)
		? (source as { result: Record<string, unknown> }).result
		: source) as Record<string, unknown>;

	const model = structuredClone(raw);
	delete (model as Record<string, unknown>)._comment;

	if (mapGlobals) {
		const g = model.global;
		if (g && !(g instanceof Map) && typeof g === "object" && !Array.isArray(g)) {
			model.global = new Map(Object.entries(g as Record<string, unknown>));
		}
	}
	return overrides ? { ...model, ...overrides } : model;
}
