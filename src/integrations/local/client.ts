// Supabase-compatible client backed by Electron IPC + local SQLite.
// Substitui `@/integrations/supabase/client` no build desktop (alias Vite).

type Filter = { col: string; op: string; val: unknown };
type OrderBy = { col: string; asc: boolean };

declare global {
  interface Window {
    pharmasys?: {
      invoke: (channel: string, payload?: unknown) => Promise<{ data: unknown; error: { message: string } | null }>;
      onAuthChange: (cb: (p: unknown) => void) => () => void;
    };
  }
}

function ipc(channel: string, payload?: unknown): Promise<{ data: any; error: { message: string } | null }> {
  if (!window.pharmasys) {
    return Promise.resolve({ data: null, error: { message: "Desktop runtime indisponível" } });
  }
  return window.pharmasys.invoke(channel, payload);
}

class QueryBuilder<T = any> implements PromiseLike<{ data: T | null; error: { message: string } | null }> {
  private filters: Filter[] = [];
  private _select = "*";
  private _order: OrderBy[] = [];
  private _limit: number | null = null;
  private _single = false;
  private _maybeSingle = false;
  private _mode: "select" | "insert" | "update" | "delete" = "select";
  private _values: unknown = null;
  private _patch: Record<string, unknown> | null = null;
  private _returnRows = true;

  constructor(private table: string) {}

  select(cols: string = "*", _opts?: { count?: string; head?: boolean }) {
    this._select = cols;
    if (this._mode === "select") return this;
    // chained after insert/update
    return this;
  }
  insert(values: unknown) { this._mode = "insert"; this._values = values; return this; }
  update(patch: Record<string, unknown>) { this._mode = "update"; this._patch = patch; return this; }
  delete() { this._mode = "delete"; return this; }
  upsert(values: unknown) { this._mode = "insert"; this._values = values; return this; }

  eq(col: string, val: unknown) { this.filters.push({ col, op: "eq", val }); return this; }
  neq(col: string, val: unknown) { this.filters.push({ col, op: "neq", val }); return this; }
  gt(col: string, val: unknown) { this.filters.push({ col, op: "gt", val }); return this; }
  gte(col: string, val: unknown) { this.filters.push({ col, op: "gte", val }); return this; }
  lt(col: string, val: unknown) { this.filters.push({ col, op: "lt", val }); return this; }
  lte(col: string, val: unknown) { this.filters.push({ col, op: "lte", val }); return this; }
  is(col: string, val: unknown) { this.filters.push({ col, op: "is", val }); return this; }
  in(col: string, val: unknown[]) { this.filters.push({ col, op: "in", val }); return this; }
  ilike(col: string, val: string) { this.filters.push({ col, op: "ilike", val }); return this; }
  like(col: string, val: string) { this.filters.push({ col, op: "like", val }); return this; }
  or(expr: string) { this.filters.push({ col: "_or", op: "or", val: expr }); return this; }

  order(col: string, opts?: { ascending?: boolean }) {
    this._order.push({ col, asc: opts?.ascending !== false });
    return this;
  }
  limit(n: number) { this._limit = n; return this; }
  range(from: number, to: number) { this._limit = to - from + 1; return this; }
  single() { this._single = true; return this; }
  maybeSingle() { this._maybeSingle = true; return this; }

  then<TResult1 = { data: T | null; error: { message: string } | null }, TResult2 = never>(
    onfulfilled?: (value: { data: T | null; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>,
  ): PromiseLike<TResult1 | TResult2> {
    return this._run().then(onfulfilled, onrejected);
  }

  private async _run(): Promise<{ data: any; error: { message: string } | null }> {
    let res: { data: any; error: { message: string } | null };
    if (this._mode === "select") {
      res = await ipc("db:query", { table: this.table, select: this._select, filters: this.filters, order: this._order, limit: this._limit });
    } else if (this._mode === "insert") {
      res = await ipc("db:insert", { table: this.table, values: this._values });
    } else if (this._mode === "update") {
      res = await ipc("db:update", { table: this.table, patch: this._patch, filters: this.filters });
    } else {
      res = await ipc("db:delete", { table: this.table, filters: this.filters });
    }
    if (res.error) return res;
    let data = res.data;
    if (this._single) data = Array.isArray(data) && data.length ? data[0] : null;
    else if (this._maybeSingle) data = Array.isArray(data) && data.length ? data[0] : null;
    return { data, error: null };
  }
}

type AuthChangeCb = (event: string, session: { user: any } | null) => void;
const authListeners = new Set<AuthChangeCb>();
let CURRENT_USER: any = null;

async function refreshUser() {
  const { data } = await ipc("auth:getUser");
  CURRENT_USER = data?.user || null;
  return CURRENT_USER;
}

export const supabase = {
  from<T = any>(table: string) { return new QueryBuilder<T>(table); },
  async rpc(name: string, args?: Record<string, unknown>) {
    const res = await ipc("db:rpc", { name, args: args || {} });
    return res;
  },
  auth: {
    async getUser() {
      const user = await refreshUser();
      return { data: { user }, error: null };
    },
    async getSession() {
      const user = await refreshUser();
      return { data: { session: user ? { user, access_token: "local" } : null }, error: null };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const res = await ipc("auth:signIn", { email, password });
      if (!res.error) {
        CURRENT_USER = res.data?.user || null;
        authListeners.forEach((cb) => cb("SIGNED_IN", CURRENT_USER ? { user: CURRENT_USER } : null));
      }
      return res;
    },
    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { full_name?: string } } }) {
      const res = await ipc("auth:signUp", { email, password, fullName: options?.data?.full_name });
      if (!res.error) {
        CURRENT_USER = res.data?.user || null;
        authListeners.forEach((cb) => cb("SIGNED_IN", CURRENT_USER ? { user: CURRENT_USER } : null));
      }
      return res;
    },
    async signOut() {
      const res = await ipc("auth:signOut");
      CURRENT_USER = null;
      authListeners.forEach((cb) => cb("SIGNED_OUT", null));
      return res;
    },
    async updateUser(attrs: { password?: string }) {
      return ipc("auth:updateUser", attrs);
    },
    async resetPasswordForEmail(_email: string, _opts?: unknown) {
      return { data: null, error: { message: "Use a função de reposição via Administrador (app desktop)." } };
    },
    onAuthStateChange(cb: AuthChangeCb) {
      authListeners.add(cb);
      // fire initial
      refreshUser().then((u) => cb("INITIAL_SESSION", u ? { user: u } : null));
      return { data: { subscription: { unsubscribe: () => authListeners.delete(cb) } } };
    },
  },
  // Admin helpers (extension specific to desktop)
  __local: {
    listUsers: () => ipc("admin:listUsers"),
    createUser: (p: { email: string; password: string; fullName?: string; role?: string }) => ipc("admin:createUser", p),
    resetPassword: (p: { userId: string; password: string }) => ipc("admin:resetPassword", p),
    deleteUser: (p: { userId: string }) => ipc("admin:deleteUser", p),
  },
};

export default supabase;
