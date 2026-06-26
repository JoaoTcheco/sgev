import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isDesktop } from "@/lib/desktop";
import { getDesktopUser } from "@/hooks/use-desktop-auth";

export type AppRole = "admin" | "pharmacist" | "cashier";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDesktop()) {
      const sync = () => {
        const u = getDesktopUser();
        setUser(u ? ({ id: u.id, email: u.email } as unknown as User) : null);
        setLoading(false);
      };
      sync();
      window.addEventListener("pharmasys.auth-change", sync);
      window.addEventListener("storage", sync);
      return () => {
        window.removeEventListener("pharmasys.auth-change", sync);
        window.removeEventListener("storage", sync);
      };
    }
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}

export function useUserRoles(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-roles", userId, isDesktop() ? "desktop" : "web"],
    enabled: !!userId,
    queryFn: async (): Promise<AppRole[]> => {
      if (!userId) return [];
      if (isDesktop()) {
        const u = getDesktopUser();
        return u && u.id === userId ? [u.role as AppRole] : [];
      }
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (error) throw error;
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId, isDesktop() ? "desktop" : "web"],
    enabled: !!userId,
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null;
      if (isDesktop()) {
        const u = getDesktopUser();
        return u && u.id === userId ? { id: u.id, full_name: u.full_name, email: u.email } : null;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function highestRole(roles: AppRole[]): AppRole | null {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("pharmacist")) return "pharmacist";
  if (roles.includes("cashier")) return "cashier";
  return null;
}

export function roleLabel(role: AppRole | null): string {
  if (role === "admin") return "Administrador";
  if (role === "pharmacist") return "Gestor";
  if (role === "cashier") return "Funcionário";
  return "Sem perfil";
}
