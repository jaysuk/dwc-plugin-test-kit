// Stub for `grid-layout-plus` — renders children in plain divs so the drag/resize grid (which needs
// real layout measurement) doesn't have to run under happy-dom.
import { defineComponent, h } from "vue";

export const GridLayout = defineComponent({
	name: "GridLayout",
	props: { layout: { type: Array, default: () => [] } },
	emits: ["update:layout"],
	setup(_props, { slots }) {
		return () => h("div", { class: "grid-layout-stub" }, slots.default ? slots.default() : []);
	},
});

export const GridItem = defineComponent({
	name: "GridItem",
	props: { x: Number, y: Number, w: Number, h: Number, i: [String, Number] },
	setup(props, { slots }) {
		return () => h("div", { class: "grid-item-stub" }, slots.default ? slots.default({ ...props }) : []);
	},
});

export default { GridLayout, GridItem };
