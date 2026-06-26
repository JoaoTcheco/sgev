import { r as reactExports } from "../_libs/react.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-D9M-ftIG.mjs";
import { i as isDesktop, g as getDesktopUser } from "./router-DE-fAUtY.mjs";
function useAuthUser() {
  const [user, setUser] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    if (isDesktop()) {
      const sync = () => {
        const u = getDesktopUser();
        setUser(u ? { id: u.id, email: u.email } : null);
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
function useUserRoles(userId) {
  return useQuery({
    queryKey: ["user-roles", userId, isDesktop() ? "desktop" : "web"],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];
      if (isDesktop()) {
        const u = getDesktopUser();
        return u && u.id === userId ? [u.role] : [];
      }
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      if (error) throw error;
      return (data ?? []).map((r) => r.role);
    }
  });
}
function useProfile(userId) {
  return useQuery({
    queryKey: ["profile", userId, isDesktop() ? "desktop" : "web"],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      if (isDesktop()) {
        const u = getDesktopUser();
        return u && u.id === userId ? { id: u.id, full_name: u.full_name, email: u.email } : null;
      }
      const { data, error } = await supabase.from("profiles").select("id, full_name, email").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data;
    }
  });
}
function highestRole(roles) {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("pharmacist")) return "pharmacist";
  if (roles.includes("cashier")) return "cashier";
  return null;
}
function roleLabel(role) {
  if (role === "admin") return "Administrador";
  if (role === "pharmacist") return "Gestor";
  if (role === "cashier") return "Funcionário";
  return "Sem perfil";
}
export {
  useUserRoles as a,
  useProfile as b,
  highestRole as h,
  roleLabel as r,
  useAuthUser as u
};
