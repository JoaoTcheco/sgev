// PharmaSys local — Supabase-compatible client backed by Electron IPC + SQLite.
// Every React page imports `supabase` from "@/integrations/supabase/client" — a
// Vite alias rewires that import to this file, so no page code needs changes.

type Filter = { col: string; op: string; val: unknown };
type Order = { col: string; asc: boolean };

type PharmaApi = {
  invoke: (channel: string, payload?: unknown) => Promise<{ ok: boolean; data?: unknown; error?: string }>;
  print: () => Promise<unknown>;
};

declare global {
  interface Window {
    pharmaApi?: PharmaApi;
  }
}

function api(): PharmaApi {
  if (typeof window === "undefined" || !window.pharmaApi) {
    // Browser dev fallback (sandbox doesn't have IPC). Throws clear errors.
    return {
      async invoke() {
        throw new Error(
          "PharmaSys está a correr no browser sem Electron. Use o app instalável (npm run electron:dev).",
        );
      },
      async print() {
        window.print();
      },
    };
  }
  return window.pharmaApi;
}

async function call<T = unknown>(channel: string, payload?: unknown): Promise<T> {
  const r = await api().invoke(channel, payload);
  if (!r.ok) throw new Error(r.error || "Erro desconhecido");
  return r.data as T;
}

// ---------- Query builder ----------
type QueryResult = { data: unknown; error: null } | { data: null; error: { message: string } };

class QueryBuilder implements PromiseLike<QueryResult> {
  private filters: Filter[] = [];
  private orders: Order[] = [];
  private _limit?: number;
  private _offset?: number;
  private _single = false;
  private _maybeSingle = false;
  private _count = false;
  private _op: "select" | "insert" | "update" | "delete" = "select";
  private _patch: Record<string, unknown> | null = null;
  private _rows: unknown[] | null = null;
  private _upsert = false;
  private _onConflict?: string;

  constructor(private table: string) {}

  select(_cols?: string, opts?: { count?: string }): this {
    this._op = "select";
    if (opts?.count) this._count = true;
    return this;
  }
  insert(rows: unknown | unknown[]): this {
    this._op = "insert";
    this._rows = Array.isArray(rows) ? rows : [rows];
    return this;
  }
  upsert(rows: unknown | unknown[], opts?: { onConflict?: string }): this {
    this._op = "insert";
    this._rows = Array.isArray(rows) ? rows : [rows];
    this._upsert = true;
    this._onConflict = opts?.onConflict;
    return this;
  }
  update(patch: Record<string, unknown>): this {
    this._op = "update";
    this._patch = patch;
    return this;
  }
  delete(): this {
    this._op = "delete";
    return this;
  }
  eq(col: string, val: unknown): this {
    this.filters.push({ col, op: "eq", val });
    return this;
  }
  neq(col: string, val: unknown): this {
    this.filters.push({ col, op: "neq", val });
    return this;
  }
  gt(col: string, val: unknown): this {
    this.filters.push({ col, op: "gt", val });
    return this;
  }
  gte(col: string, val: unknown): this {
    this.filters.push({ col, op: "gte", val });
    return this;
  }
  lt(col: string, val: unknown): this {
    this.filters.push({ col, op: "lt", val });
    return this;
  }
  lte(col: string, val: unknown): this {
    this.filters.push({ col, op: "lte", val });
    return this;
  }
  in(col: string, arr: unknown[]): this {
    this.filters.push({ col, op: "in", val: arr });
    return this;
  }
  is(col: string, val: unknown): this {
    this.filters.push({ col, op: "is", val });
    return this;
  }
  like(col: string, val: string): this {
    this.filters.push({ col, op: "like", val });
    return this;
  }
  ilike(col: string, val: string): this {
    this.filters.push({ col, op: "ilike", val });
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }): this {
    this.orders.push({ col, asc: opts?.ascending !== false });
    return this;
  }
  limit(n: number): this {
    this._limit = n;
    return this;
  }
  range(from: number, to: number): this {
    this._offset = from;
    this._limit = to - from + 1;
    return this;
  }
  single(): this {
    this._single = true;
    return this;
  }
  maybeSingle(): this {
    this._maybeSingle = true;
    return this;
  }

  private async exec() {
    if (this._op === "select") {
      return call("db.select", {
        table: this.table,
        filters: this.filters,
        order: this.orders,
        limit: this._limit,
        offset: this._offset,
        single: this._single,
        maybeSingle: this._maybeSingle,
        count: this._count,
      });
    }
    if (this._op === "insert") {
      const data = await call<unknown[]>("db.insert", {
        table: this.table,
        rows: this._rows,
        upsert: this._upsert,
        onConflict: this._onConflict,
      });
      if (this._single) return Array.isArray(data) ? data[0] : data;
      if (this._maybeSingle) return Array.isArray(data) ? data[0] || null : data;
      return data;
    }
    if (this._op === "update") {
      const data = await call<unknown[]>("db.update", {
        table: this.table,
        patch: this._patch,
        filters: this.filters,
      });
      if (this._single) return Array.isArray(data) ? data[0] : data;
      return data;
    }
    if (this._op === "delete") {
      return call("db.delete", { table: this.table, filters: this.filters });
    }
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null } | { data: null; error: { message: string } }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.exec()
      .then((data) => ({ data, error: null }))
      .catch((e: unknown) => ({ data: null, error: { message: (e as Error)?.message || String(e) } }))
      .then(onfulfilled as never, onrejected as never);
  }
}

// ---------- Auth ----------
type AuthEvent = "SIGNED_IN" | "SIGNED_OUT" | "INITIAL_SESSION";
type AuthSession = { user: { id: string; email: string | null; user_metadata: Record<string, unknown> } } | null;
type AuthListener = (event: AuthEvent, session: AuthSession) => void;

const listeners = new Set<AuthListener>();
let currentSession: AuthSession = null;

function toSession(u: { id: string; username: string; full_name: string; role: string; email: string | null } | null): AuthSession {
  if (!u) return null;
  return {
    user: { id: u.id, email: u.email, user_metadata: { full_name: u.full_name, username: u.username, role: u.role } },
  };
}

async function hydrateSession() {
  try {
    const u = await call<{ id: string; username: string; full_name: string; role: string; email: string | null } | null>(
      "auth.getUser",
    );
    currentSession = toSession(u);
  } catch {
    currentSession = null;
  }
}

const authApi = {
  async getUser() {
    if (!currentSession) await hydrateSession();
    return { data: { user: currentSession?.user || null }, error: null };
  },
  async getSession() {
    if (!currentSession) await hydrateSession();
    return { data: { session: currentSession }, error: null };
  },
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    // We treat the "email" field as username.
    try {
      const u = await call<{ id: string; username: string; full_name: string; role: string; email: string | null }>(
        "auth.signIn",
        { username: email, password },
      );
      currentSession = toSession(u);
      listeners.forEach((l) => l("SIGNED_IN", currentSession));
      return { data: { user: currentSession?.user, session: currentSession }, error: null };
    } catch (e) {
      return { data: { user: null, session: null }, error: { message: (e as Error).message } };
    }
  },
  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { full_name?: string } } }) {
    // Local signup is admin-only; ignore here to keep UI flow compatible.
    return {
      data: { user: null, session: null },
      error: { message: "Registo público desactivado. Peça ao administrador para criar a sua conta." },
    };
  },
  async signOut() {
    try {
      await call("auth.signOut");
    } catch {
      /* ignore */
    }
    currentSession = null;
    listeners.forEach((l) => l("SIGNED_OUT", null));
    return { error: null };
  },
  onAuthStateChange(cb: AuthListener) {
    listeners.add(cb);
    queueMicrotask(() => cb("INITIAL_SESSION", currentSession));
    return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
  },
};

// ---------- RPC ----------
async function rpc(name: string, params?: Record<string, unknown>) {
  try {
    // Translate Supabase-style p_xxx params to plain keys for IPC.
    const cleanParams: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params || {})) {
      cleanParams[k.replace(/^p_/, "")] = v;
    }
    const data = await call("rpc." + name, cleanParams);
    return { data, error: null };
  } catch (e) {
    return { data: null, error: { message: (e as Error).message } };
  }
}

// ---------- Public client ----------
export const supabase = {
  from<T = Record<string, unknown>>(table: string) {
    return new QueryBuilder<T>(table);
  },
  rpc,
  auth: authApi,
};

// Hydrate on load
if (typeof window !== "undefined") void hydrateSession();
