// Stub for `@duet3d/connectors`. Only what plugins reference at runtime: the error classes (for
// `instanceof` checks) and the two connector base classes (for `instanceof` mode checks, e.g.
// telling a standalone install apart from an SBC one) - never actually instantiated by a test.
export class DisconnectedError extends Error {}
export class OperationCancelledError extends Error {}
export class PollConnector {}
export class RestConnector {}
