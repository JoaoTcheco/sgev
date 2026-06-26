import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pill, Loader2, Monitor } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { isDesktop } from "@/lib/desktop";
import { useDesktopAuth, desktopSignIn, desktopBootstrap, getDesktopUser } from "@/hooks/use-desktop-auth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Entrar — PharmaSys" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const desktop = isDesktop();
  const desktopAuth = useDesktopAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (desktop) {
      if (getDesktopUser()) navigate({ to: "/dashboard", replace: true });
      else setChecking(false);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
      else setChecking(false);
    });
  }, [navigate, desktop]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    setLoading(true);
    try {
      if (desktop) {
        await desktopSignIn(email, password);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      toast.success("Sessão iniciada");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error("Falha ao entrar", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const fullName = String(form.get("full_name") || "");
    setLoading(true);
    try {
      if (desktop) {
        await desktopBootstrap({ full_name: fullName, email, password });
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: fullName } },
        });
        if (error) throw error;
      }
      toast.success("Conta criada", { description: "Sessão iniciada com sucesso." });
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error("Falha no registo", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Em desktop, se for o primeiro arranque, força o tab "Registar".
  const defaultTab = desktop && desktopAuth.bootstrapNeeded ? "signup" : "login";
  const bootstrapMode = desktop && desktopAuth.bootstrapNeeded === true;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Pill className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">PharmaSys</h1>
          <p className="text-sm text-muted-foreground">Gestão de vendas e estoque para farmácias</p>
          {desktop && (
            <div className="mt-1 flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
              <Monitor className="h-3 w-3" /> Modo desktop — 100% offline
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{bootstrapMode ? "Primeiro arranque" : "Bem-vindo"}</CardTitle>
            <CardDescription>
              {bootstrapMode
                ? "Crie a conta de administrador desta farmácia. Esta conta ficará guardada apenas neste computador."
                : "Entre com a sua conta ou registe-se para começar."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={defaultTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" disabled={bootstrapMode}>Entrar</TabsTrigger>
                <TabsTrigger value="signup">{bootstrapMode ? "Criar admin" : "Registar"}</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-mail</Label>
                    <Input id="login-email" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Palavra-passe</Label>
                    <Input id="login-password" name="password" type="password" required autoComplete="current-password" />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome completo</Label>
                    <Input id="signup-name" name="full_name" type="text" required autoComplete="name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-mail</Label>
                    <Input id="signup-email" name="email" type="email" required autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Palavra-passe</Label>
                    <Input id="signup-password" name="password" type="password" required minLength={6} autoComplete="new-password" />
                    <p className="text-xs text-muted-foreground">
                      {bootstrapMode
                        ? "Mínimo 6 caracteres. Anote num local seguro — não há recuperação por email no modo offline."
                        : "Mínimo de 6 caracteres. O primeiro utilizador registado torna-se Administrador."}
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {bootstrapMode ? "Criar administrador" : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
