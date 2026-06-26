// Bridge tipada para o processo Electron.
// No browser (preview Lovable), `window.pharmasys` é undefined — o código
// que depender disto deve usar `isDesktop()` para fazer fallback.

type Role = "admin" | "pharmacist" | "cashier";

export type DesktopUser = {
  id: string;
  full_name: string;
  email: string;
  role: Role;
};

type Bridge = {
  query: (channel: string, payload?: unknown) => Promise<unknown>;
  backupNow: () => Promise<{ ok: boolean; path?: string }>;
  restoreBackup: () => Promise<{ ok: boolean }>;
  openBackupsFolder: () => Promise<{ ok: boolean }>;
  isDesktop: boolean;
};

function getBridge(): Bridge | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { pharmasys?: Bridge }).pharmasys ?? null;
}

export function isDesktop(): boolean {
  return !!getBridge();
}

async function call<T>(channel: string, payload?: unknown): Promise<T> {
  const b = getBridge();
  if (!b) throw new Error("Aplicação desktop não detectada");
  return (await b.query(channel, payload)) as T;
}

export const desktop = {
  isDesktop,

  auth: {
    bootstrapNeeded: () => call<boolean>("auth.bootstrap-needed"),
    createFirstAdmin: (input: { full_name: string; email: string; password: string }) =>
      call<DesktopUser>("auth.create-first-admin", input),
    signIn: (input: { email: string; password: string }) =>
      call<DesktopUser>("auth.sign-in", input),
    changePassword: (input: { user_id: string; current_password?: string; new_password: string }) =>
      call<{ ok: true }>("auth.change-password", input),
  },

  admin: {
    listUsers: () =>
      call<Array<{ id: string; full_name: string | null; email: string; active: boolean; created_at: string; roles: Role[] }>>(
        "admin.list-users",
      ),
    createUser: (input: { actor_id: string; email: string; password: string; full_name: string; role: Role }) =>
      call<{ id: string }>("admin.create-user", input),
    setRole: (input: { actor_id: string; user_id: string; role: Role }) =>
      call<{ ok: true }>("admin.set-role", input),
    setActive: (input: { actor_id: string; user_id: string; active: boolean }) =>
      call<{ ok: true }>("admin.set-active", input),
    resetPassword: (input: { actor_id: string; user_id: string; password: string }) =>
      call<{ ok: true }>("admin.reset-password", input),
    updateUser: (input: { actor_id: string; user_id: string; full_name?: string; email?: string }) =>
      call<{ ok: true }>("admin.update-user", input),
    deleteUser: (input: { actor_id: string; user_id: string }) =>
      call<{ ok: true }>("admin.delete-user", input),
    auditLogs: () =>
      call<Array<{ id: string; user_id: string | null; entity_id: string | null; action: string; details: string | null; created_at: string; actor_name: string | null }>>(
        "admin.audit-logs",
      ),
  },

  // SQL directo (para queries complexas)
  select: <T = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
    call<T[]>("select", { sql, params }),
  get: <T = Record<string, unknown>>(sql: string, params: unknown[] = []) =>
    call<T | undefined>("get", { sql, params }),
  run: (sql: string, params: unknown[] = []) =>
    call<{ changes: number }>("run", { sql, params }),

  // CRUD por tabela
  insert: <T = Record<string, unknown>>(table: string, values: Record<string, unknown>) =>
    call<T>("insert", { table, values }),
  update: <T = Record<string, unknown>>(table: string, id: string, values: Record<string, unknown>) =>
    call<T>("update", { table, id, values }),
  remove: (table: string, id: string) => call<{ changes: number }>("delete", { table, id }),

  // RPCs
  rpc: {
    processSale: (input: {
      user_id: string;
      customer_id?: string | null;
      payment_method: "cash" | "mpesa" | "emola" | "bank";
      discount?: number;
      items: Array<{
        product_id: string;
        quantity: number;
        unit_price: number;
        unit_kind?: "pack" | "sub";
      }>;
      amount_received?: number | null;
      change_due?: number | null;
    }) => call<{ id: string; receipt_number: string; total: number }>("rpc.process-sale", input),

    openCashSession: (input: { user_id: string; opening_amount: number }) =>
      call<{ id: string }>("rpc.open-cash-session", input),
    closeCashSession: (input: { user_id: string; counted_amount: number; notes?: string }) =>
      call<{ id: string; expected: number; difference: number }>("rpc.close-cash-session", input),

    addBatch: (input: {
      user_id: string;
      product_id: string;
      supplier_id?: string | null;
      batch_number: string;
      expiry_date: string;
      quantity: number;
      cost_price?: number;
    }) => call<{ id: string }>("rpc.add-batch", input),

    refreshAlerts: () => call<{ ok: true }>("rpc.refresh-alerts"),
  },

  backup: {
    now: () => getBridge()!.backupNow(),
    restore: () => getBridge()!.restoreBackup(),
    openFolder: () => getBridge()!.openBackupsFolder(),
  },
};
