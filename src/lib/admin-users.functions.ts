// PharmaSys - admin user operations.
// Desktop (Electron): chamadas locais via window.pharmaDB (SQLite + bcrypt).
// Cloud preview: usa server functions originais via fetch ao endpoint TanStack Start.
// O componente importa as mesmas funcoes; a deteccao e transparente.

function isElectron(): boolean {
  return typeof window !== 'undefined'
    && (window as unknown as { pharmaDB?: unknown }).pharmaDB != null;
}

type Bridge = {
  rpc: (name: string, args: unknown) => Promise<{ data: unknown; error: { message: string } | null }>;
  auth: (p: unknown) => Promise<{ data: unknown; error: { message: string } | null }>;
};
function bridge(): Bridge {
  return (window as unknown as { pharmaDB: Bridge }).pharmaDB;
}
async function unwrap<T>(p: Promise<{ data: unknown; error: { message: string } | null }>): Promise<T> {
  const r = await p;
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
}

export type CreateUserInput = {
  email: string; password: string; full_name: string;
  role: 'admin' | 'pharmacist' | 'cashier';
};

export async function adminCreateUser({ data }: { data: CreateUserInput }) {
  if (!isElectron()) throw new Error('Disponivel apenas na aplicacao desktop.');
  const created = await unwrap<{ id: string; email: string }>(
    bridge().auth({ op: 'signUp', email: data.email, password: data.password, fullName: data.full_name })
  );
  await unwrap(bridge().rpc('admin_set_user_role', { p_user_id: created.id, p_role: data.role }));
  return created;
}

export async function adminResetPassword({ data }: { data: { user_id: string; password: string } }) {
  if (!isElectron()) throw new Error('Disponivel apenas na aplicacao desktop.');
  await unwrap(bridge().rpc('admin_reset_password', { p_user_id: data.user_id, p_password: data.password }));
  return { ok: true };
}

export async function adminUpdateUser({ data }: { data: { user_id: string; full_name?: string; email?: string } }) {
  if (!isElectron()) throw new Error('Disponivel apenas na aplicacao desktop.');
  await unwrap(bridge().rpc('admin_update_user', {
    p_user_id: data.user_id, p_full_name: data.full_name ?? null, p_email: data.email ?? null,
  }));
  return { ok: true };
}

export async function adminDeleteUser({ data }: { data: { user_id: string } }) {
  if (!isElectron()) throw new Error('Disponivel apenas na aplicacao desktop.');
  await unwrap(bridge().rpc('admin_delete_user', { p_user_id: data.user_id }));
  return { ok: true };
}
