import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/format";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

type SaleItem = { product_id: string; product_name: string; quantity: number; total: number };
type Sale = { total: number; created_at: string };

function ReportsPage() {
  const { data } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [{ data: items }, { data: sales }, { data: products }] = await Promise.all([
        supabase.from("sale_items").select("product_id, product_name, quantity, total").gte("created_at", since),
        supabase.from("sales").select("total, created_at").eq("status", "completed").gte("created_at", since),
        supabase.from("products").select("id, name").eq("active", true),
      ]);

      const byProduct = new Map<string, { name: string; qty: number; revenue: number }>();
      ((items ?? []) as SaleItem[]).forEach((i) => {
        const cur = byProduct.get(i.product_id) ?? { name: i.product_name, qty: 0, revenue: 0 };
        cur.qty += i.quantity; cur.revenue += Number(i.total);
        byProduct.set(i.product_id, cur);
      });
      const sorted = Array.from(byProduct.entries()).map(([id, v]) => ({ id, ...v }));
      const top = [...sorted].sort((a, b) => b.qty - a.qty).slice(0, 10);

      const soldIds = new Set(byProduct.keys());
      const unsold = (products ?? []).filter((p: { id: string }) => !soldIds.has(p.id)).slice(0, 10);

      // Vendas por dia (últimos 14)
      const days: { day: string; total: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
        const next = new Date(d); next.setDate(next.getDate() + 1);
        const total = ((sales ?? []) as Sale[]).filter((s) => {
          const t = new Date(s.created_at);
          return t >= d && t < next;
        }).reduce((sum, s) => sum + Number(s.total), 0);
        days.push({ day: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), total });
      }

      return { top, unsold, days, totalRevenue: ((sales ?? []) as Sale[]).reduce((s, x) => s + Number(x.total), 0) };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><BarChart3 className="h-7 w-7" /> Relatórios</h1>
        <p className="text-muted-foreground">Últimos 30 dias</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Receita (30d)</p>
          <p className="text-3xl font-bold text-primary mt-1">{formatCurrency(data?.totalRevenue ?? 0)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Produtos vendidos (únicos)</p>
          <p className="text-3xl font-bold mt-1">{data?.top.length ?? 0}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Sem vendas no período</p>
          <p className="text-3xl font-bold mt-1">{data?.unsold.length ?? 0}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Vendas diárias (14 dias)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.days ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-success" /> Mais vendidos</CardTitle></CardHeader>
          <CardContent>
            {data && data.top.length > 0 && (
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.top.slice(0, 5)} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="qty" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <Table>
              <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">Receita</TableHead></TableRow></TableHeader>
              <TableBody>
                {(data?.top ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{p.qty}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-warning" /> Sem vendas</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Produto</TableHead></TableRow></TableHeader>
              <TableBody>
                {(data?.unsold ?? []).length === 0 && <TableRow><TableCell className="text-muted-foreground text-center py-4">Todos os produtos tiveram vendas.</TableCell></TableRow>}
                {(data?.unsold ?? []).map((p: { id: string; name: string }) => (
                  <TableRow key={p.id}><TableCell>{p.name}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
