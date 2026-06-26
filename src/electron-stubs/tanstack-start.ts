// Electron stub for @tanstack/react-start — only the bits __root.tsx uses.
import { type ReactNode } from "react";

export function HeadContent(): ReactNode {
  return null;
}

export function Scripts(): ReactNode {
  return null;
}

// createServerFn used to be a TanStack Start RPC; in Electron we call IPC directly.
// Any code using createServerFn().handler(fn) gets back a function that just runs the handler.
export function createServerFn(_opts?: unknown) {
  const chain = {
    middleware: () => chain,
    inputValidator: () => chain,
    handler: (fn: (args: { data?: unknown; context?: Record<string, unknown> }) => unknown) => {
      return (input?: { data?: unknown }) => Promise.resolve(fn({ data: input?.data, context: {} }));
    },
  };
  return chain;
}

export function useServerFn<T extends (...args: unknown[]) => unknown>(fn: T): T {
  return fn;
}

export function createStart(cb: () => unknown) {
  return cb();
}

export function createMiddleware() {
  const chain = {
    server: (_fn: unknown) => chain,
    client: (_fn: unknown) => chain,
  };
  return chain;
}
