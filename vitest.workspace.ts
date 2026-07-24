/**
 * Root Vitest workspace — lets `npm test` at the repo root run both workspaces
 * in one pass while each app keeps its own environment (node for the Fastify
 * server, jsdom-free happy-dom for React).
 *
 * Per docs/markdown/dev/dev.md §11, coverage targets are:
 *   computation logic 90% · services 80% · validators 90% · client hooks 70%
 */
export default ["app/client", "app/server"]
