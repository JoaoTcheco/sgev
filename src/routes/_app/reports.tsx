import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/format";
import { TrendingUp, TrendingDown, BarChart3, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

type SaleItem = { product_id: string; product_name: string; quantity: number; total: number };
type Sale = { id: string; sale_number: number; total: number; subtotal: number; discount: number; payment_method: string; created_at: string };

function toCSV(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(";"), ...rows.map((r) => headers.map((h) => esc(r[h])).join(";"))].join("\n");
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);

  const { data } = useQuery({
    queryKey: ["reports", from, to],
    queryFn: async () => {
      const sinceISO = new Date(from).toISOString();
      const untilISO = new Date(new Date(to).getTime() + 86400000).toISOString();
      const [{ data: items }, { data: sales }, { data: products }] = await Promise.all([
        supabase.from("sale_items").select("product_id, product_name, quantity, total, created_at").gte("created_at", sinceISO).lt("created_at", untilISO),
        supabase.from("sales").select("id, sale_number, total, subtotal, discount, payment_method, created_at").eq("status", "completed").gte("created_at", sinceISO).lt("created_at", untilISO),
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
      const unsold = (products ?? []).filter((p: { id: string }) => !soldIds.has(p.id)).slice(0, 20);

      const days: { day: string; total: number }[] = [];
      const start = new Date(from); start.setHours(0, 0, 0, 0);
      const end = new Date(to); end.setHours(0, 0, 0, 0);
      const dayCount = Math.min(60, Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1));
      for (let i = 0; i < dayCount; i++) {
        const d = new Date(start); d.setDate(d.getDate() + i);
        const next = new Date(d); next.setDate(next.getDate() + 1);
        const total = ((sales ?? []) as Sale[]).filter((s) => {
          const t = new Date(s.created_at); return t >= d && t < next;
        }).reduce((sum, s) => sum + Number(s.total), 0);
        days.push({ day: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), total });
      }

      return { top, unsold, days, totalRevenue: ((sales ?? []) as Sale[]).reduce((s, x) => s + Number(x.total), 0), sales: (sales ?? []) as Sale[], allProducts: sorted };
    },
  });

  const summary = useMemo(() => ({
    avgTicket: data && data.sales.length > 0 ? data.totalRevenue / data.sales.length : 0,
    salesCount: data?.sales.length ?? 0,
  }), [data]);

  const exportSales = () => {
    if (!data) return;
    const rows = data.sales.map((s) => ({
      Numero: s.sale_number,
      Data: new Date(s.created_at).toLocaleString("pt-BR"),
      Subtotal: Number(s.subtotal).toFixed(2),
      Desconto: Number(s.discount).toFixed(2),
      Total: Number(s.total).toFixed(2),
      Pagamento: s.payment_method,
    }));
    downloadCSV(`vendas_${from}_${to}.csv`, toCSV(rows));
    toast.success("Vendas exportadas");
  };

  const exportProducts = () => {
    if (!data) return;
    const rows = data.allProducts.map((p) => ({ Produto: p.name, Quantidade: p.qty, Receita: p.revenue.toFixed(2) }));
    downloadCSV(`produtos_${from}_${to}.csv`, toCSV(rows));
    toast.success("Produtos exportados");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><BarChart3 className="h-7 w-7" /> Relatórios</h1>
          <p className="text-muted-foreground">Análise por período + exportação CSV</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1"><Label className="text-xs">De</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" /></div>
          <div className="space-y-1"><Label className="text-xs">Até</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" /></div>
          <Button onClick={exportSales} variant="outline"><Download className="h-4 w-4" /> Vendas CSV</Button>
          <Button onClick={exportProducts} variant="outline"><Download className="h-4 w-4" /> Produtos CSV</Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Receita</p>
          <p className="text-3xl font-bold text-primary mt-1">{formatCurrency(data?.totalRevenue ?? 0)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Vendas</p>
          <p className="text-3xl font-bold mt-1">{summary.salesCount}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Ticket médio</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(summary.avgTicket)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Produtos vendidos</p>
          <p className="text-3xl font-bold mt-1">{data?.top.length ?? 0}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Vendas diárias</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.days ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
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
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                    <Bar dataKey="qty" fill="var(--primary)" radius={[0, 4, 4, 0]} />
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
