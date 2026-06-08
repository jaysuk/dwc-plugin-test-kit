# dwc-plugin-test-kit

A reusable test harness for **DuetWebControl (Vue 3) plugins**. It mocks the small, stable DWC API
surface a plugin imports (`@/stores/*`, `@/plugins`, `@/i18n`, `@/utils/events`, plus `vue-router`,
`@duet3d/objectmodel`, `grid-layout-plus`) so you can:

- **mount any plugin component** under Vuetify + happy-dom and assert it renders without throwing,
- **feed it a fake object model** and check what it displays,
- **drive interactions** and assert the exact **G-code** it sends,
- **type-check** and **verify the installable build** of the plugin against a DWC checkout,
- run all of the above in **CI**.

It is plugin-agnostic — drop it into any DWC plugin repo (FlexibleLayouts, OmBrowser, Neopixel,
Globals, …) the same way.

## Why mount tests matter
Pure-logic unit tests miss the bugs that actually break plugins: a component that throws on mount
(a TDZ in `setup`, a Vuetify component that crashes when rendered). A registry-driven "mount every
widget" test catches those automatically — including for widgets you add later.

---

## Add it to a plugin

**1. Install** (peer deps give you a single, deduped Vue/Vuetify copy):

```jsonc
// package.json
"devDependencies": {
  "dwc-plugin-test-kit": "github:jaysuk/dwc-plugin-test-kit",  // or "file:../dwc-plugin-test-kit"
  "@vitejs/plugin-vue": "^5.2.4",
  "@vue/test-utils": "^2.4.6",
  "happy-dom": "^15.11.7",
  "vitest": "^4.1.8",
  "vue": "^3.5.30",
  "vuetify": "^4.1.0"
},
"scripts": {
  "test": "vitest run",
  "typecheck": "dwc-plugin-typecheck",
  "verify-build": "dwc-plugin-verify-build"
}
```

**2. Vitest config** — `vitest.config.ts`:

```ts
import vue from "@vitejs/plugin-vue";
import { dwcVitestConfig } from "dwc-plugin-test-kit/vitest";

export default dwcVitestConfig({ plugins: [vue()] });
```

That wires up the `@/…`→stub aliases, happy-dom, dep dedupe, Vuetify CSS handling and the setup
polyfills. (Pass overrides like `dwcVitestConfig({ plugins: [vue()], test: { coverage: {…} } })`.)

**3. Write tests** under `test/`:

```ts
import { describe, expect, it } from "vitest";
import { mountInDwc, sentCodes } from "dwc-plugin-test-kit";
import MyButton from "../src/widgets/MyButton.vue";

it("sends G28 when clicked", async () => {
  const w = mountInDwc(MyButton, { props: { widget: { type: "codeButton", code: "G28" } } });
  await w.find("button").trigger("click");
  expect(sentCodes()).toContain("G28");
});
```

A **self-maintaining smoke test** (covers every component automatically):

```ts
import { mountInDwc } from "dwc-plugin-test-kit";
import { FREEFORM_WIDGETS } from "../src/widgets/registry";
import { createDefaultWidget } from "../src/model/document";
import WidgetView from "../src/widgets/WidgetView.vue";

for (const e of FREEFORM_WIDGETS) {
  it(`mounts: ${e.type}`, () => {
    expect(mountInDwc(WidgetView, { props: { widget: createDefaultWidget(e.type) } }).exists()).toBe(true);
  });
}
```

`npm test` runs them.

---

## Harness API

```ts
import {
  mountInDwc,        // mount(component, { props, slots, global }) with Vuetify + $t installed
  setModel,          // replace the object model
  patchModel,        // shallow-merge into the object model
  setConnected,      // toggle machineStore.isConnected
  setUiFrozen,       // toggle uiStore.uiFrozen
  setFiles,          // seed machineStore.getFileList(dir)
  setGlobals,        // set the `global.*` map
  setMessageBox,     // set state.messageBox (M291)
  sentCodes,         // string[] of every G-code sent, in order
  lastCode,          // the most recent sent G-code
  notifications,     // uiStore notifications raised
  makeObjectModel,   // build/override a small programmatic OM fixture
  loadObjectModel,   // load a fuller realistic model — or your own M409 dump (see below)
  byTitle, byText,   // find a button by title= / text (3rd arg overrides the "button" selector)
  clickByTitle, clickByText,  // find + click; throw a helpful error if nothing matches
  expectCode, expectLastCode, expectNoCodes,  // Vitest assertions over sentCodes()
  dwc, resetDwc,     // the raw reactive state + manual reset (auto-reset runs before each test)
} from "dwc-plugin-test-kit";
```

The fake `machineStore.sendCode` records into `sentCodes()`; `getFileList` reads `setFiles()`; the
object model defaults to `makeObjectModel()` (axes, heaters, fans, spindles, tools, a `global` Map,
`ledStrips`, …). State resets before every test.

### Realistic data: `loadObjectModel`

`makeObjectModel()` is a small programmatic fixture. For true-to-life data use `loadObjectModel()`:

```ts
setModel(loadObjectModel());                 // bundled fuller standalone Duet 3 model
setModel(loadObjectModel(myDump));           // your captured machineStore.model
setModel(loadObjectModel(m409Response));     // an RRF `M409 K"" ` response ({ result }) — auto-unwrapped
```

It deep-clones (no cross-test leakage) and converts a plain-object `global` to a `Map` (matching
`@duet3d/objectmodel`'s `ModelDictionary`); pass `{ mapGlobals: false }` to keep it, `{ overrides }` to
patch. Capturing a real model from your own machine and dropping it in is the cheapest way to catch
field-shape assumptions the thin fixture hides.

## CLI (build + type gates)

Both take a DuetWebControl checkout via `DWC_DIR`:

```bash
DWC_DIR=/path/to/DuetWebControl npm run typecheck      # vue-tsc the plugin against DWC's @/ types
DWC_DIR=/path/to/DuetWebControl npm run verify-build    # build the ZIP; assert dwcFiles + externals
```

`verify-build` fails if the bundle isn't correctly externalised (must reference `window.DWC.*`, must
not bundle a second Vuetify copy) or the manifest's `dwcFiles` is empty.

## CI

Add `.github/workflows/ci.yml` to your plugin:

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    uses: jaysuk/dwc-plugin-test-kit/.github/workflows/dwc-plugin-ci.yml@main
    # with: { dwc-ref: next }   # optional overrides
```

It runs the unit/mount tests, then (in a second job) checks out DWC and runs `verify-build` +
`typecheck`. If your plugin defines a `test:coverage` script (see below) the unit job runs it instead
of `npm test`, so coverage is collected in CI automatically.

## Coverage — see what's left to test

`dwcVitestConfig` ships coverage defaults scoped to your plugin's `src/**` (skipping `*.d.ts`,
generated `model-data.js`, configs and tests), so you only need to opt in:

```jsonc
// package.json
"devDependencies": { "@vitest/coverage-v8": "^4.1.8", /* … */ },
"scripts": { "test:coverage": "vitest run --coverage", /* … */ }
```

`npm run test:coverage` prints a per-file table of uncovered lines/branches and writes an HTML report
to `coverage/`. That table *is* your "what do I still need to test?" list. Tune via `test.coverage` in
`vitest.config.ts` (deep-merged over the defaults), e.g. add `thresholds: { lines: 80 }` to fail CI
below a bar.

## Vendoring instead of installing

Prefer to copy it in? Drop the `src/` and `bin/` folders into your repo (e.g. `test-kit/`), point
your `vitest.config.ts` at `./test-kit/src/vitest.mjs`, and run the bins with `node ./test-kit/bin/…`.
Everything is dependency-light and self-contained.

## What it does NOT cover
happy-dom mounting catches **setup/TDZ errors and most render errors**, but a few Vuetify behaviours
only reproduce in a real browser (teleported overlays, layout measurement). For those — and for true
integration (route registration, the custom shell, visual regression) — see the Playwright **E2E
template** in [`e2e-template/`](e2e-template/). Its mock-Duet connector is a tested kit module
(`dwc-plugin-test-kit/mock-duet`, exercised by `test/mock-duet.test.ts` — boot a server, drive the
`rr_*` endpoints, assert recorded G-code), so that half runs in CI; the browser/screenshot half needs
a built DWC serving your plugin and stays opt-in scaffolding you copy to `e2e/` and adapt.

## License
MIT
