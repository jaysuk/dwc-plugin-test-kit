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
