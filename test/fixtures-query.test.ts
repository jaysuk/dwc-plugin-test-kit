import { flushPromises } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vitest";

import { useMachineStore } from "@/stores/machine";

import {
	byText,
	byTitle,
	clickByText,
	clickByTitle,
	expectCode,
	expectLastCode,
	expectNoCodes,
	loadObjectModel,
	mountInDwc,
	setModel,
} from "../src/index";

describe("loadObjectModel", () => {
	it("returns the bundled realistic sample by default with global as a Map", () => {
		const m = loadObjectModel();
		expect(Array.isArray(m.boards)).toBe(true);
		expect((m as { directories?: object }).directories).toBeTruthy(); // richer than makeObjectModel
		expect(m.global).toBeInstanceOf(Map);
		expect((m.global as Map<string, unknown>).get("bedProbed")).toBe(true);
		expect((m as Record<string, unknown>)._comment).toBeUndefined();
	});

	it("unwraps an M409 { result } response", () => {
		const m = loadObjectModel({ result: { state: { status: "busy" }, global: { x: 1 } } });
		expect((m as { state: { status: string } }).state.status).toBe("busy");
		expect((m.global as Map<string, unknown>).get("x")).toBe(1);
	});

	it("accepts a raw dump and can keep global as-is", () => {
		const m = loadObjectModel({ state: { status: "idle" }, global: { a: 1 } }, { mapGlobals: false });
		expect(m.global).not.toBeInstanceOf(Map);
		expect((m.global as { a: number }).a).toBe(1);
	});

	it("deep-clones so mutations don't leak between loads", () => {
		const a = loadObjectModel();
		(a.boards as Array<{ name: string }>)[0].name = "MUTATED";
		const b = loadObjectModel();
		expect((b.boards as Array<{ name: string }>)[0].name).not.toBe("MUTATED");
	});

	it("feeds setModel and is readable through the machine stub", () => {
		setModel(loadObjectModel());
		const m = useMachineStore().model as { move: { axes: Array<{ letter: string }> } };
		expect(m.move.axes.map((a) => a.letter)).toEqual(["X", "Y", "Z"]);
	});
});

const Buttons = defineComponent({
	setup() {
		const machine = useMachineStore();
		return () =>
			h("div", [
				h("button", { title: "Home", onClick: () => machine.sendCode("G28") }, "Home All"),
				h("button", { title: "Off", onClick: () => machine.sendCode("M18") }, "Motors Off"),
			]);
	},
});

describe("query + assertion helpers", () => {
	it("byTitle / byText locate buttons", () => {
		const w = mountInDwc(Buttons);
		expect(byTitle(w, "Home")?.text()).toBe("Home All");
		expect(byText(w, "Motors")?.attributes("title")).toBe("Off");
		expect(byTitle(w, "nope")).toBeUndefined();
	});

	it("clickByTitle / clickByText send the expected code and helpers assert it", async () => {
		const w = mountInDwc(Buttons);
		await clickByTitle(w, "Home");
		await flushPromises();
		expectCode("G28");
		expectLastCode("G28");
		await clickByText(w, "Motors");
		await flushPromises();
		expectLastCode("M18");
	});

	it("clickByTitle throws a helpful error when nothing matches", async () => {
		const w = mountInDwc(Buttons);
		await expect(clickByTitle(w, "missing")).rejects.toThrow(/no <button> with title="missing"/);
	});

	it("expectNoCodes passes when nothing was sent", () => {
		mountInDwc(Buttons);
		expectNoCodes();
	});
});
