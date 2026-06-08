/**
 * Small DOM-query and G-code assertion helpers so plugin tests don't re-implement `byTitle`/`byText`
 * and friends. Built on @vue/test-utils wrappers + the shared harness. `expect*` use Vitest's
 * `expect`, so call them inside a test.
 */
import type { DOMWrapper, VueWrapper } from "@vue/test-utils";
import { expect } from "vitest";

import { lastCode, sentCodes } from "./harness";

type AnyWrapper = VueWrapper | DOMWrapper<Element>;

/** First element matching `selector` (default: any button) whose `title` attribute equals `title`. */
export function byTitle(wrapper: AnyWrapper, title: string, selector = "button"): DOMWrapper<Element> | undefined {
	return wrapper.findAll(selector).find((el) => el.attributes("title") === title);
}

/** First element matching `selector` (default: any button) whose text contains `substr`. */
export function byText(wrapper: AnyWrapper, substr: string, selector = "button"): DOMWrapper<Element> | undefined {
	return wrapper.findAll(selector).find((el) => el.text().includes(substr));
}

/** Click the element found by `byTitle`; throws a helpful error if none matched. Awaitable. */
export async function clickByTitle(wrapper: AnyWrapper, title: string, selector = "button"): Promise<void> {
	const el = byTitle(wrapper, title, selector);
	if (!el) throw new Error(`clickByTitle: no <${selector}> with title="${title}"`);
	await el.trigger("click");
}

/** Click the element found by `byText`; throws a helpful error if none matched. Awaitable. */
export async function clickByText(wrapper: AnyWrapper, substr: string, selector = "button"): Promise<void> {
	const el = byText(wrapper, substr, selector);
	if (!el) throw new Error(`clickByText: no <${selector}> with text containing "${substr}"`);
	await el.trigger("click");
}

/** Assert `code` is among the G-code strings sent so far. */
export function expectCode(code: string): void {
	expect(sentCodes()).toContain(code);
}

/** Assert the most recently sent G-code equals `code`. */
export function expectLastCode(code: string): void {
	expect(lastCode()).toBe(code);
}

/** Assert no G-code has been sent (e.g. a control correctly did nothing while disabled). */
export function expectNoCodes(): void {
	expect(sentCodes()).toEqual([]);
}
