// Type declarations for aliases.mjs (plain JS, loaded by Node at Vitest config time). Lets a
// consumer's TypeScript compiler — including DWC 3.7's build-time plugin type-check, which compiles
// the kit's re-export in index.ts — resolve `./aliases` without a TS2307.
export function dwcAliases(): Record<string, string>;
