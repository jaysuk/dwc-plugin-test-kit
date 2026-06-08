/**
 * Mock Duet REST server for Playwright E2E — a thin CLI wrapper around the kit's tested implementation
 * (`dwc-plugin-test-kit/mock-duet`, covered by test/mock-duet.test.ts). Started by playwright.config's
 * `webServer`. Override the port with MOCK_PORT, the model by editing here.
 *
 *   node mock-duet/server.mjs          # listens on :8080
 *   MOCK_PORT=9000 node mock-duet/server.mjs
 */
import { createMockDuet, DEFAULT_MOCK_MODEL } from "dwc-plugin-test-kit/mock-duet";

const port = Number(process.env.MOCK_PORT ?? 8080);

// Tailor the canned model to your plugin's needs (homed axes, a loaded tool, globals, …):
const model = { ...DEFAULT_MOCK_MODEL };

createMockDuet({ port, model }).then((d) => console.log(`mock-duet listening on ${d.url}`));
