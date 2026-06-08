# E2E template (Playwright + mock Duet)

> **Status: starting point, not turn-key.** The unit/mount layer (`dwc-plugin-test-kit`) catches
> setup/TDZ and most render bugs cheaply and is fully automated. This E2E layer covers what only a
> real browser can — teleported overlays, the custom shell, route registration, light/dark visual
> regression — but it needs a built DWC serving your plugin and will need iteration against the DWC
> version you target. Copy this folder into your plugin as `e2e/` and adapt.

## The pieces

- **`mock-duet/server.mjs`** — a tiny HTTP server implementing the Duet REST connector endpoints
  (`rr_connect`, `rr_model`, `rr_gcode`, `rr_reply`, `rr_filelist`, …). It serves a canned object
  model and **records every G-code** DWC sends, so you can assert on it. (RRF's model polling uses
  sequence numbers; this skeleton returns the whole model each poll — adjust if your DWC build expects
  finer-grained `seqs` diffing.)
- **`playwright.config.ts`** — points Playwright at `BASE_URL` (a running DWC) and starts the mock
  via `webServer`.
- **`tests/smoke.spec.ts`** — loads DWC, activates the plugin, asserts no console errors, and
  screenshots for visual regression.

## How to run

1. **Build DWC with your plugin and serve it.** Either build DWC normally with the plugin installed,
   or `npm run dev` in a DWC checkout that has your plugin under `src/plugins/` (blacklisted from the
   prod build if you don't want to ship it). Note the URL (e.g. `http://localhost:5173`).
2. Configure DWC to connect to the mock: set DWC's machine host to `localhost:8080` (the mock).
3. `npx playwright test` (from your plugin's `e2e/`).

```bash
BASE_URL=http://localhost:5173 npx playwright test
```

## Why it's not wired into CI by default
It depends on a DWC build + browser and on matching the connector protocol of the DWC version you
ship against — too brittle to enable blindly. Treat it as scaffolding you turn on once it's stable
for your setup, then add a job to `.github/workflows/ci.yml`.
