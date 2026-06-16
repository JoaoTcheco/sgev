import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { Package, ShoppingCart, AlertTriangle, TrendingUp, Bell, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      const [todaySales, monthSales, productCount, lowStock, alerts, expiringBatches] = await Promise.all([
        supabase.from("sales").select("total, id").eq("status", "completed").gte("created_at", today.toISOString()),
        supabase.from("sales").select("total, id").eq("status", "completed").gte("created_at", monthStart.toISOString()),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("active", true),
        supabase.from("alerts").select("id", { count: "exact", head: true }).eq("type", "low_stock").eq("resolved", false),
        supabase.from("alerts").select("*").eq("resolved", false).order("severity", { ascending: false }).limit(8),
        supabase.from("batches").select("*, products(name)").gt("quantity", 0).lte("expiry_date", new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)).order("expiry_date").limit(5),
      ]);

      const todayTotal = (todaySales.data ?? []).reduce((s: number, r: { total: number | string }) => s + Number(r.total), 0);
      const monthTotal = (monthSales.data ?? []).reduce((s: number, r: { total: number | string }) => s + Number(r.total), 0);

      return {
        todayCount: todaySales.data?.length ?? 0,
        todayTotal,
        monthCount: monthSales.data?.length ?? 0,
        monthTotal,
        productCount: productCount.count ?? 0,
        lowStockCount: lowStock.count ?? 0,
        alerts: alerts.data ?? [],
        expiring: expiringBatches.data ?? [],
      };
    },
  });

  const stats = [
    { icon: ShoppingCart, label: "Vendas hoje", value: data?.todayCount ?? 0, sub: formatCurrency(data?.todayTotal ?? 0), color: "text-primary bg-primary/10" },
    { icon: TrendingUp, label: "Vendas no mês", value: data?.monthCount ?? 0, sub: formatCurrency(data?.monthTotal ?? 0), color: "text-success bg-success/10" },
    { icon: Package, label: "Produtos ativos", value: data?.productCount ?? 0, sub: "no catálogo", color: "text-chart-5 bg-chart-5/10" },
    { icon: AlertTriangle, label: "Estoque baixo", value: data?.lowStockCount ?? 0, sub: "alertas ativos", color: "text-warning bg-warning/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da farmácia</p>
        </div>
        <Button asChild><Link to="/pdv">Nova venda</Link></Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Alertas recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum alerta ativo. 🎉</p>
            ) : (
              <ul className="space-y-2">
                {data?.alerts.map((a: { id: string; message: string; severity: string }) => (
                  <li key={a.id} className="flex items-center justify-between p-3 rounded-md bg-muted/40">
                    <span className="text-sm">{a.message}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      a.severity === "critical" ? "bg-destructive text-destructive-foreground" :
                      a.severity === "warning" ? "bg-warning text-warning-foreground" :
                      "bg-secondary text-secondary-foreground"
                    }`}>{a.severity}</span>
                  </li>
                ))}
              </ul>
            )}
            <Button variant="link" asChild className="px-0"><Link to="/alerts">Ver todos →</Link></Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> Lotes vencendo em 30 dias</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.expiring.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum lote próximo do vencimento.</p>
            ) : (
              <ul className="space-y-2">
                {data?.expiring.map((b: { id: string; batch_number: string; expiry_date: string; quantity: number; products: { name: string } | null }) => (
                  <li key={b.id} className="flex items-center justify-between p-3 rounded-md bg-muted/40">
                    <div>
                      <p className="text-sm font-medium">{b.products?.name}</p>
                      <p className="text-xs text-muted-foreground">Lote {b.batch_number} • {b.quantity} un</p>
                    </div>
                    <span className="text-xs text-warning-foreground bg-warning px-2 py-0.5 rounded-full">
                      {new Date(b.expiry_date).toLocaleDateString("pt-BR")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
