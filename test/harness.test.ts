import { flushPromises } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vitest";

// The plugin's `@/…` imports resolve to the kit's stubs (via dwcAliases in vitest.config).
import { useMachineStore } from "@/stores/machine";
import { useUiStore } from "@/stores/ui";

import { lastCode, mountInDwc, notifications, sentCodes, setConnected, setModel } from "../src/index";

// A stand-in "plugin component" that uses the mocked DWC stores.
const Probe = defineComponent({
	setup() {
		const machine = useMachineStore();
		const ui = useUiStore();
		return () =>
			h("div", [
				h("span", { class: "status" }, String((machine.model as { state?: { status?: string } }).state?.status)),
				h("span", { class: "connected" }, String(machine.isConnected)),
				h("span", { class: "frozen" }, String(ui.uiFrozen)),
				h("button", { class: "go", onClick: () => machine.sendCode("G28") }, "go"),
				h("button", { class: "warn", onClick: () => ui.makeNotification("warning", "hi") }, "warn"),
			]);
	},
});

describe("kit harness", () => {
	it("mounts a component with Vuetify + $t and the DWC stubs", () => {
		const w = mountInDwc(Probe);
		expect(w.exists()).toBe(true);
		expect(w.find(".status").text()).toBe("idle"); // from the default fixture
		expect(w.find(".connected").text()).toBe("true");
	});

	it("records sent G-code", async () => {
		const w = mountInDwc(Probe);
		await w.find(".go").trigger("click");
		await flushPromises();
		expect(sentCodes()).toContain("G28");
		expect(lastCode()).toBe("G28");
	});

	it("records notifications", async () => {
		const w = mountInDwc(Probe);
		await w.find(".warn").trigger("click");
		expect(notifications()).toContainEqual({ type: "warning", title: "hi", message: null });
	});

	it("setModel / setConnected drive the stubs reactively", async () => {
		setModel({ state: { status: "processing" } } as Record<string, unknown>);
		setConnected(false);
		const w = mountInDwc(Probe);
		expect(w.find(".status").text()).toBe("processing");
		expect(w.find(".connected").text()).toBe("false");
	});

	it("resets state between tests", () => {
		// The previous test set status to "processing" and disconnected; setup.ts should have reset it.
		const w = mountInDwc(Probe);
		expect(w.find(".status").text()).toBe("idle");
		expect(w.find(".connected").text()).toBe("true");
		expect(sentCodes()).toEqual([]);
	});
});
