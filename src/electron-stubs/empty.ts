// Empty stub for Node built-ins that get pulled into SSR-only code paths.
export const Readable = class {};
export const ReadableStream = class {};
export const Writable = class {};
export const Transform = class {};
export const AsyncLocalStorage = class {
  getStore() { return undefined; }
  run(_store: unknown, cb: () => unknown) { return cb(); }
};
export default {};
