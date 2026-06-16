import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pill, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — FarmaGest" },
      { name: "description", content: "Acesse o sistema FarmaGest." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo!");
    navigate({ to: "/dashboard" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Verifique seu e-mail (se necessário) e faça login.");
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-sidebar text-sidebar-foreground p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
          <Pill className="h-8 w-8 text-primary" /> FarmaGest
        </Link>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Gestão completa<br />da sua farmácia.
          </h1>
          <p className="text-sidebar-foreground/70 max-w-md">
            Controle estoque, lotes, validades, vendas e equipe em um só lugar.
            Alertas inteligentes e relatórios estratégicos.
          </p>
          <ul className="space-y-2 text-sm text-sidebar-foreground/80 pt-4">
            <li>✓ Controle de estoque por lote e validade (FEFO)</li>
            <li>✓ PDV ágil com leitura de código de barras</li>
            <li>✓ Alertas de estoque mínimo e vencimento</li>
            <li>✓ Relatórios de produtos mais e menos vendidos</li>
            <li>✓ 3 níveis de usuário com permissões granulares</li>
          </ul>
        </div>
        <p className="text-xs text-sidebar-foreground/50">© FarmaGest</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md p-8">
          <div className="lg:hidden flex items-center gap-2 text-xl font-bold mb-6 text-primary">
            <Pill className="h-6 w-6" /> FarmaGest
          </div>
          <h2 className="text-2xl font-bold mb-1">Acesse o sistema</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Entre com sua conta ou crie uma nova.
          </p>

          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome completo</Label>
                  <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">E-mail</Label>
                  <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2">Senha</Label>
                  <Input id="password2" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Criar conta
                </Button>
                <p className="text-xs text-muted-foreground">
                  O primeiro usuário cadastrado será o <strong>Administrador</strong> do sistema.
                  Demais usuários começam como Caixa e podem ter o papel ajustado pelo admin.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
