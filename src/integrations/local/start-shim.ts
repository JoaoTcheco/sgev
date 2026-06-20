// Stub for @tanstack/react-start in Electron build (no SSR / server functions).
export function createServerFn() {
  const chain: any = {
    middleware: () => chain,
    inputValidator: () => chain,
    handler: () => async () => { throw new Error("Server functions are not available in desktop mode."); },
  };
  return chain;
}
export function createStart() { return {}; }
export function useServerFn(fn: any) { return fn; }
