// Electron replacement for admin-users.functions.ts.
// All admin user CRUD goes through window.pharmaApi → SQLite.
import { supabase } from "@/integrations/supabase/client";

declare global {
  interface Window {
    pharmaApi?: { invoke: (c: string, p?: unknown) => Promise<{ ok: boolean; data?: unknown; error?: string }> };
  }
}

async function call(channel: string, payload?: unknown) {
  const api = window.pharmaApi;
  if (!api) throw new Error("pharmaApi não disponível");
  const r = await api.invoke(channel, payload);
  if (!r.ok) throw new Error(r.error || "Erro");
  return r.data;
}

export const listUsers = () => call("admin.list_users");

export const createUserAccount = (data: {
  username: string;
  password: string;
  full_name: string;
  email?: string;
  role: "admin" | "pharmacist" | "cashier";
}) => call("admin.create_user", data);

export const updateUserAccount = (data: {
  id: string;
  full_name?: string;
  email?: string;
  role?: "admin" | "pharmacist" | "cashier";
  active?: boolean;
  password?: string;
}) => call("admin.update_user", data);

export const deleteUserAccount = (data: { id: string }) => call("admin.delete_user", data);

// Re-export with the names the existing page imports
export const adminListUsers = listUsers;
export const adminCreateUser = createUserAccount;
export const adminUpdateUser = updateUserAccount;
export const adminDeleteUser = deleteUserAccount;

// Keep supabase import to satisfy tree-shaking detection
void supabase;
