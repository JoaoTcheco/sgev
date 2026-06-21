// Desktop replacement for src/lib/admin-users.functions.ts
// Routes admin user operations through the local Electron IPC bridge.
import { supabase } from "@/integrations/supabase/client";

const local = (supabase as unknown as { __local: {
  listUsers: () => Promise<{ data: any; error: { message: string } | null }>;
  createUser: (p: { email: string; password: string; fullName?: string; role?: string }) => Promise<{ data: any; error: { message: string } | null }>;
  resetPassword: (p: { userId: string; password: string }) => Promise<{ data: any; error: { message: string } | null }>;
  deleteUser: (p: { userId: string }) => Promise<{ data: any; error: { message: string } | null }>;
} }).__local;

function unwrap<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

export async function adminCreateUser(args: { email: string; password: string; full_name?: string; role?: string }) {
  return unwrap(await local.createUser({ email: args.email, password: args.password, fullName: args.full_name, role: args.role }));
}
export async function adminResetPassword(args: { user_id: string; password: string }) {
  return unwrap(await local.resetPassword({ userId: args.user_id, password: args.password }));
}
export async function adminUpdateUser(args: { user_id: string; full_name?: string; email?: string }) {
  const patch: { full_name?: string; email?: string } = {};
  if (args.full_name !== undefined) patch.full_name = args.full_name;
  if (args.email !== undefined) patch.email = args.email;
  if (Object.keys(patch).length === 0) return { ok: true };
  const { error } = await supabase.from("profiles").update(patch).eq("id", args.user_id);
  if (error) throw new Error(error.message);
  return { ok: true };
}
export async function adminDeleteUser(args: { user_id: string }) {
  return unwrap(await local.deleteUser({ userId: args.user_id }));
}
