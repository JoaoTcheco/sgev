import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "pharmacist" | "cashier";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  active: boolean;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    roles: [],
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    const loadProfileAndRoles = async (user: User) => {
      const [{ data: profile }, { data: roleRows }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (!mounted) return;
      setState({
        user,
        session: null,
        profile: (profile as Profile) ?? null,
        roles: (roleRows ?? []).map((r: { role: AppRole }) => r.role),
        loading: false,
      });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setState((s) => ({ ...s, user: session.user, session, loading: true }));
        setTimeout(() => loadProfileAndRoles(session.user), 0);
      } else {
        setState({ user: null, session: null, profile: null, roles: [], loading: false });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setState((s) => ({ ...s, user: session.user, session, loading: true }));
        loadProfileAndRoles(session.user);
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Modo exploração: sem usuário logado, libera CRUD para demonstração
  const exploring = !state.loading && !state.user;
  const isAdmin = state.roles.includes("admin") || exploring;
  const isStaff = isAdmin || state.roles.includes("pharmacist") || exploring;
  const highestRole: AppRole | null = isAdmin
    ? "admin"
    : state.roles.includes("pharmacist")
      ? "pharmacist"
      : state.roles.includes("cashier")
        ? "cashier"
        : null;

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { ...state, isAdmin, isStaff, highestRole, signOut };
}

export const roleLabel: Record<AppRole, string> = {
  admin: "Administrador",
  pharmacist: "Farmacêutico",
  cashier: "Caixa",
};
