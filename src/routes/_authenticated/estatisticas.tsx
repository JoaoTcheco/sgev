import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, ShoppingCart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMZN } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/estatisticas")({
  head: () => ({ meta: [{ title: "Estatísticas — PharmaSys" }] }),
  component: EstatisticasPage,
});

function EstatisticasPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["stats-30d"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const [sales, items] = await Promise.all([
        supabase.from("sales").select("id, total, created_at, payment_method").gte("created_at", since).eq("status", "completed"),
        supabase.from("sale_items").select("product_name, quantity, total, created_at").gte("created_at", since).limit(5000),
      ]);
      if (sales.error) throw sales.error;
      if (items.error) throw items.error;

      const byDay = new Map<string, number>();
      const byPayment = new Map<string, number>();
      for (const s of sales.data ?? []) {
        const d = new Date(s.created_at).toISOString().slice(0, 10);
        byDay.set(d, (byDay.get(d) ?? 0) + Number(s.total));
        byPayment.set(s.payment_method, (byPayment.get(s.payment_method) ?? 0) + Number(s.total));
      }
      const byProduct = new Map<string, { qty: number; total: number }>();
      for (const it of items.data ?? []) {
        const cur = byProduct.get(it.product_name) ?? { qty: 0, total: 0 };
        byProduct.set(it.product_name, { qty: cur.qty + it.quantity, total: cur.total + Number(it.total) });
      }
      const top = [...byProduct.entries()]
        .map(([name, v]) => ({ name, qty: v.qty, total: v.total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8);

      const days = [...byDay.entries()].sort().map(([date, total]) => ({ date: date.slice(5), total }));
      const payments = [...byPayment.entries()].map(([method, total]) => ({ method, total }));
      const totalRevenue = (sales.data ?? []).reduce((s, x) => s + Number(x.total), 0);
      return { days, payments, top, totalRevenue, count: sales.data?.length ?? 0 };
    },
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const avg = data && data.count ? data.totalRevenue / data.count : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita (30 dias)</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatMZN(data?.totalRevenue ?? 0)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.count ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatMZN(avg)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Receita diária</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.days ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip formatter={(v: any) => formatMZN(Number(v))} />
              <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top produtos</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.top ?? []} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis type="category" dataKey="name" width={140} className="text-xs" />
                <Tooltip formatter={(v: any) => formatMZN(Number(v))} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Por forma de pagamento</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.payments ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="method" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(v: any) => formatMZN(Number(v))} />
                <Bar dataKey="total" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
