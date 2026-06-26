// Sessão local persistida em localStorage (modo Electron).
// O renderer fala com o processo principal via `desktop.auth.*` e guarda
// aqui o utilizador para sobreviver a refresh da janela.
import { useEffect, useState } from "react";
import { desktop, isDesktop, type DesktopUser } from "@/lib/desktop";

const KEY = "pharmasys.session";

export function getDesktopUser(): DesktopUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DesktopUser) : null;
  } catch {
    return null;
  }
}

export function setDesktopUser(user: DesktopUser | null) {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(KEY, JSON.stringify(user));
  else window.localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("pharmasys.auth-change"));
}

export async function desktopSignIn(email: string, password: string) {
  const user = await desktop.auth.signIn({ email, password });
  setDesktopUser(user);
  return user;
}

export async function desktopBootstrap(input: { full_name: string; email: string; password: string }) {
  const user = await desktop.auth.createFirstAdmin(input);
  setDesktopUser(user);
  return user;
}

export function desktopSignOut() {
  setDesktopUser(null);
}

export function useDesktopAuth() {
  const [user, setUser] = useState<DesktopUser | null>(() => getDesktopUser());
  const [bootstrapNeeded, setBootstrapNeeded] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isDesktop()) {
      setBootstrapNeeded(false);
      return;
    }
    desktop.auth.bootstrapNeeded().then(setBootstrapNeeded).catch(() => setBootstrapNeeded(false));
    const onChange = () => setUser(getDesktopUser());
    window.addEventListener("pharmasys.auth-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("pharmasys.auth-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return { user, bootstrapNeeded, isDesktop: isDesktop() };
}
