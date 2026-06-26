import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatMZN } from "@/lib/format";
import { ShoppingCart, AlertTriangle, Package, TrendingUp } from "lucide-react";
import { useAuthUser, useProfile } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — PharmaSys" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuthUser();
  const { data: profile } = useProfile(user?.id);

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [salesRes, alertsRes, productsRes] = await Promise.all([
        supabase
          .from("sales")
          .select("total")
          .eq("status", "completed")
          .gte("created_at", today.toISOString()),
        supabase.from("alerts").select("id, severity").eq("resolved", false),
        supabase.from("products").select("id").eq("active", true),
      ]);

      const sales = salesRes.data ?? [];
      const totalSales = sales.reduce((a, s) => a + Number(s.total), 0);
      const alerts = alertsRes.data ?? [];

      return {
        salesCount: sales.length,
        totalSales,
        ticketMedio: sales.length ? totalSales / sales.length : 0,
        alertsActive: alerts.length,
        alertsCritical: alerts.filter((a) => a.severity === "critical").length,
        productsActive: productsRes.data?.length ?? 0,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Olá, {profile?.full_name?.split(" ")[0] || "bem-vindo"} 👋
        </h1>
        <p className="text-muted-foreground">Resumo da operação de hoje.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Vendas hoje"
          value={String(stats?.salesCount ?? 0)}
          subtitle={`${formatMZN(stats?.totalSales ?? 0)} faturado`}
          icon={ShoppingCart}
          tone="primary"
        />
        <StatCard
          title="Ticket médio"
          value={formatMZN(stats?.ticketMedio ?? 0)}
          subtitle="Média por venda hoje"
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          title="Alertas activos"
          value={String(stats?.alertsActive ?? 0)}
          subtitle={`${stats?.alertsCritical ?? 0} críticos`}
          icon={AlertTriangle}
          tone="warning"
        />
        <StatCard
          title="Produtos activos"
          value={String(stats?.productsActive ?? 0)}
          subtitle="Em catálogo"
          icon={Package}
          tone="muted"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos módulos</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Esta é a fundação do PharmaSys. Os próximos módulos a serem
            construídos seguem a ordem da documentação: Vendas (PDV), Estoque
            com CRUD, Alertas, Estatísticas, Contas, Fornecedores,
            Utilizadores, Histórico e Relatórios.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "success" | "warning" | "muted";
}) {
  const toneClass = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    muted: "bg-muted text-muted-foreground",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
