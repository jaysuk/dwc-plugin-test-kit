// Stub for `@duet3d/objectmodel`. Provides the few enums/classes plugins reference at runtime; the
// real object-model data is supplied as plain fixtures (see fixtures.ts).
export enum MachineMode {
	fff = "fff",
	cnc = "cnc",
	laser = "laser",
}

export enum MessageBoxMode {
	noButtons = 0,
	closeOnly = 1,
	okOnly = 2,
	okCancel = 3,
	multipleChoice = 4,
	intInput = 5,
	floatInput = 6,
	stringInput = 7,
}

export enum SpindleState {
	unconfigured = "unconfigured",
	stopped = "stopped",
	forward = "forward",
	reverse = "reverse",
}

export enum MachineStatus {
	disconnected = "disconnected",
	starting = "starting",
	updating = "updating",
	off = "off",
	halted = "halted",
	pausing = "pausing",
	paused = "paused",
	resuming = "resuming",
	cancelling = "cancelling",
	processing = "processing",
	simulating = "simulating",
	busy = "busy",
	changingTool = "changingTool",
	idle = "idle",
}

export class ModelObject {}
export function initObject<T>(_ctor: unknown, data: T): T { return data; }
export function initCollection<T>(_ctor: unknown, data: Array<T>): Array<T> { return data; }

export default {};
