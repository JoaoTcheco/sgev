// PharmaSys Desktop - supabase-js compatible client backed by local SQLite (via IPC).
// Imitates the subset of the supabase-js API used across the renderer:
//   supabase.from(table).select(cols).eq(...).maybeSingle()
//   supabase.from(table).insert(values).select().single()
//   supabase.from(table).update(values).eq(...)
//   supabase.from(table).delete().eq(...)
//   supabase.rpc(name, args)
//   supabase.auth.{getUser,getSession,signInWithPassword,signUp,signOut,onAuthStateChange}
//
// Falls back to throwing when running outside Electron (window.pharmaDB missing).

type Filter = { op: string; column: string; value: unknown };

type SelectResult<T = unknown> = {
  data: T;
  error: { message: string } | null;
  count?: number | null;
};

function bridge() {
  const w = typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : undefined;
  if (!w || !w.pharmaDB) {
    throw new Error('PharmaSys local DB nao disponivel (renderer fora do Electron).');
  }
  return w.pharmaDB as {
    query: (p: unknown) => Promise<SelectResult>;
    auth: (p: unknown) => Promise<{ data: unknown; error: { message: string } | null }>;
    rpc: (name: string, args: unknown) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
}

class QueryBuilder<T = unknown> implements PromiseLike<SelectResult<T>> {
  private table: string;
  private op: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private _select = '*';
  private filters: Filter[] = [];
  private _order: Array<{ column: string; ascending: boolean }> = [];
  private _limit: number | null = null;
  private _range: { from: number; to: number } | null = null;
  private _count: 'exact' | null = null;
  private _head = false;
  private _singleMode: 'single' | 'maybeSingle' | null = null;
  private _values: unknown = null;
  private _returning = false;
  private _returningSingle: 'single' | 'maybeSingle' | null = null;

  constructor(table: string) { this.table = table; }

  select(cols = '*', opts?: { count?: 'exact'; head?: boolean }) {
    this._select = cols;
    if (this.op !== 'insert' && this.op !== 'update') this.op = 'select';
    if (opts?.count) this._count = opts.count;
    if (opts?.head) this._head = true;
    if (this.op === 'insert' || this.op === 'update') this._returning = true;
    return this;
  }

  insert(values: unknown) { this.op = 'insert'; this._values = values; return this; }
  update(values: unknown) { this.op = 'update'; this._values = values; return this; }
  delete() { this.op = 'delete'; return this; }
  upsert(values: unknown) { this.op = 'insert'; this._values = values; return this; }

  eq(c: string, v: unknown)   { this.filters.push({ op: 'eq', column: c, value: v }); return this; }
  neq(c: string, v: unknown)  { this.filters.push({ op: 'neq', column: c, value: v }); return this; }
  gt(c: string, v: unknown)   { this.filters.push({ op: 'gt', column: c, value: v }); return this; }
  gte(c: string, v: unknown)  { this.filters.push({ op: 'gte', column: c, value: v }); return this; }
  lt(c: string, v: unknown)   { this.filters.push({ op: 'lt', column: c, value: v }); return this; }
  lte(c: string, v: unknown)  { this.filters.push({ op: 'lte', column: c, value: v }); return this; }
  like(c: string, v: string)  { this.filters.push({ op: 'like', column: c, value: v }); return this; }
  ilike(c: string, v: string) { this.filters.push({ op: 'ilike', column: c, value: v }); return this; }
  in(c: string, v: unknown[]) { this.filters.push({ op: 'in', column: c, value: v }); return this; }
  is(c: string, v: unknown)   { this.filters.push({ op: 'is', column: c, value: v }); return this; }
  not() { return this; }

  order(column: string, opts?: { ascending?: boolean }) {
    this._order.push({ column, ascending: opts?.ascending !== false });
    return this;
  }
  limit(n: number) { this._limit = n; return this; }
  range(from: number, to: number) { this._range = { from, to }; return this; }

  single() {
    if (this.op === 'insert' || this.op === 'update') this._returningSingle = 'single';
    else this._singleMode = 'single';
    return this as unknown as PromiseLike<SelectResult<T>>;
  }
  maybeSingle() {
    if (this.op === 'insert' || this.op === 'update') this._returningSingle = 'maybeSingle';
    else this._singleMode = 'maybeSingle';
    return this as unknown as PromiseLike<SelectResult<T>>;
  }

  private payload() {
    return {
      op: this.op, table: this.table,
      select: this._select, filters: this.filters,
      order: this._order, limit: this._limit, range: this._range,
      count: this._count, head: this._head,
      singleMode: this._singleMode,
      values: this._values, returning: this._returning,
      returningSingleMode: this._returningSingle,
    };
  }

  then<TR = SelectResult<T>, TF = never>(
    onFulfilled?: ((r: SelectResult<T>) => TR | PromiseLike<TR>) | null,
    onRejected?: ((e: unknown) => TF | PromiseLike<TF>) | null,
  ): PromiseLike<TR | TF> {
    return bridge().query(this.payload())
      .then((r) => ({ data: r.data as T, error: r.error ?? null, count: r.count ?? null }))
      .then(onFulfilled as never, onRejected as never);
  }
}

// ---------- Auth ----------
type AuthChangeListener = (event: string, session: { user: unknown } | null) => void;
const authListeners = new Set<AuthChangeListener>();
function emitAuth(event: string, session: { user: unknown } | null) {
  authListeners.forEach((l) => { try { l(event, session); } catch { /* ignore */ } });
}

const authApi = {
  async getUser() {
    const r = await bridge().auth({ op: 'getUser' });
    return { data: r.data as { user: unknown }, error: r.error };
  },
  async getSession() {
    const r = await bridge().auth({ op: 'getUser' });
    const user = (r.data as { user: unknown } | null)?.user ?? null;
    return { data: { session: user ? { user, access_token: 'local' } : null }, error: r.error };
  },
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const r = await bridge().auth({ op: 'signIn', email, password });
    if (!r.error) emitAuth('SIGNED_IN', { user: (r.data as { user: unknown }).user });
    return { data: r.data, error: r.error };
  },
  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { full_name?: string } } }) {
    const r = await bridge().auth({ op: 'signUp', email, password, fullName: options?.data?.full_name });
    return { data: r.data, error: r.error };
  },
  async signOut() {
    const r = await bridge().auth({ op: 'signOut' });
    emitAuth('SIGNED_OUT', null);
    return { error: r.error };
  },
  onAuthStateChange(cb: AuthChangeListener) {
    authListeners.add(cb);
    // Emit initial state asynchronously so callers always see one event.
    Promise.resolve().then(async () => {
      const u = await authApi.getUser();
      cb('INITIAL_SESSION', u.data?.user ? { user: u.data.user } : null);
    });
    return { data: { subscription: { unsubscribe: () => authListeners.delete(cb) } } };
  },
  // No-ops for OAuth flows (offline app)
  async signInWithOAuth() { return { data: null, error: { message: 'OAuth nao disponivel offline' } }; },
  async resetPasswordForEmail() { return { data: null, error: { message: 'Reset por email nao disponivel offline. Use um admin para repor a palavra-passe.' } }; },
  async updateUser() { return { data: null, error: { message: 'Use changePassword via pharmaDB' } }; },
};

// ---------- Client ----------
export const supabase = {
  from<T = unknown>(table: string) { return new QueryBuilder<T>(table); },
  async rpc(name: string, args: Record<string, unknown> = {}) {
    const r = await bridge().rpc(name, args);
    return { data: r.data, error: r.error };
  },
  auth: authApi,
  // realtime/channels not used by the desktop app
  channel() { return { on() { return this; }, subscribe() { return this; }, unsubscribe() {} }; },
  removeChannel() {},
  storage: {
    from() { throw new Error('Storage nao disponivel offline'); },
  },
};

export default supabase;
