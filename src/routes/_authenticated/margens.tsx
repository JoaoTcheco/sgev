import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, TrendingUp, TrendingDown, Percent, Package as PackageIcon, Download, Palette, RotateCcw } from "lucide-react";
import { formatMZN } from "@/lib/format";
import { RoleGate } from "@/components/role-gate";
import { toast } from "sonner";

type Thresholds = { good: number; ok: number; low: number };
const DEFAULT_THRESHOLDS: Thresholds = { good: 30, ok: 15, low: 0 };
const THRESHOLDS_KEY = "pharmasys.margin.thresholds";


export const Route = createFileRoute("/_authenticated/margens")({
  head: () => ({ meta: [{ title: "Margens & Custos — PharmaSys" }] }),
  component: () => (
    <RoleGate allow={["admin", "pharmacist"]}>
      <MargensPage />
    </RoleGate>
  ),
});

type BatchRow = {
  id: string;
  product_id: string;
  supplier_id: string | null;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  cost_price: number;
  received_at: string;
  created_at: string;
  products: { id: string; name: string; manufacturer: string | null; sale_price: number; pack_size: number; unit: string | null } | null;
  suppliers: { id: string; legal_name: string } | null;
};

function margin(sale: number, cost: number) {
  if (!sale || sale <= 0) return { pct: 0, abs: -cost };
  const abs = sale - cost;
  return { pct: (abs / sale) * 100, abs };
}

function marginBadge(pct: number, t: Thresholds) {
  if (pct >= t.good) return "bg-emerald-600 hover:bg-emerald-700";
  if (pct >= t.ok) return "bg-amber-500 hover:bg-amber-600";
  if (pct >= t.low) return "bg-orange-500 hover:bg-orange-600";
  return "bg-red-600 hover:bg-red-700";
}


function MargensPage() {
  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");

  const { data: batches = [] } = useQuery({
    queryKey: ["margens-batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("batches")
        .select(
          "id, product_id, supplier_id, batch_number, expiry_date, quantity, cost_price, received_at, created_at, products(id, name, manufacturer, sale_price, pack_size, unit), suppliers(id, legal_name)"
        )
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as unknown as BatchRow[];
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-min-margens"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("id, legal_name").eq("active", true).order("legal_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Aggregate per product
  const products = useMemo(() => {
    const map = new Map<string, {
      product_id: string;
      name: string;
      manufacturer: string | null;
      sale_price: number;
      pack_size: number;
      unit: string | null;
      costs: number[];
      lastCost: number;
      lastCostAt: string;
      minCost: number;
      maxCost: number;
      avgCost: number;
      totalQty: number;
      suppliers: Map<string, { id: string; name: string; qty: number; totalCost: number; lastCost: number; lastAt: string; minCost: number; maxCost: number }>;
    }>();

    for (const b of batches) {
      if (!b.products) continue;
      const p = b.products;
      // Cost per sub-unit (batches store cost per sub-unit already based on entrada.tsx convertRow)
      const cost = Number(b.cost_price);
      const cur = map.get(p.id) ?? {
        product_id: p.id,
        name: p.name,
        manufacturer: p.manufacturer,
        sale_price: Number(p.sale_price),
        pack_size: Math.max(1, p.pack_size),
        unit: p.unit,
        costs: [] as number[],
        lastCost: 0,
        lastCostAt: "",
        minCost: Infinity,
        maxCost: 0,
        avgCost: 0,
        totalQty: 0,
        suppliers: new Map<string, { id: string; name: string; qty: number; totalCost: number; lastCost: number; lastAt: string; minCost: number; maxCost: number }>(),
      };
      cur.costs.push(cost);
      cur.totalQty += Number(b.quantity);
      cur.minCost = Math.min(cur.minCost, cost);
      cur.maxCost = Math.max(cur.maxCost, cost);
      if (!cur.lastCostAt || b.created_at > cur.lastCostAt) {
        cur.lastCostAt = b.created_at;
        cur.lastCost = cost;
      }

      const supKey = b.suppliers?.id ?? "none";
      const supName = b.suppliers?.legal_name ?? "Sem fornecedor";
      const sup = cur.suppliers.get(supKey) ?? { id: supKey, name: supName, qty: 0, totalCost: 0, lastCost: 0, lastAt: "", minCost: Infinity, maxCost: 0 };
      sup.qty += Number(b.quantity);
      sup.totalCost += cost * Number(b.quantity);
      sup.minCost = Math.min(sup.minCost, cost);
      sup.maxCost = Math.max(sup.maxCost, cost);
      if (!sup.lastAt || b.created_at > sup.lastAt) {
        sup.lastAt = b.created_at;
        sup.lastCost = cost;
      }
      cur.suppliers.set(supKey, sup);
      map.set(p.id, cur);
    }

    const list = Array.from(map.values()).map((p) => {
      p.avgCost = p.costs.length ? p.costs.reduce((a: number, b: number) => a + b, 0) / p.costs.length : 0;
      if (!isFinite(p.minCost)) p.minCost = 0;
      return p;
    });
    return list;
  }, [batches]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      if (term && !`${p.name} ${p.manufacturer ?? ""}`.toLowerCase().includes(term)) return false;
      if (supplierFilter !== "all") {
        if (supplierFilter === "none") {
          if (!p.suppliers.has("none")) return false;
        } else if (!p.suppliers.has(supplierFilter)) return false;
      }
      return true;
    }).sort((a, b) => {
      const ma = margin(a.sale_price, a.avgCost).pct;
      const mb = margin(b.sale_price, b.avgCost).pct;
      return ma - mb; // worst margin first — actionable
    });
  }, [products, search, supplierFilter]);

  // KPIs
  const kpis = useMemo(() => {
    if (!products.length) return { avgMargin: 0, best: null as any, worst: null as any, negatives: 0, count: 0 };
    let sum = 0;
    let best: any = null;
    let worst: any = null;
    let negatives = 0;
    for (const p of products) {
      const m = margin(p.sale_price, p.avgCost);
      sum += m.pct;
      if (m.pct < 0) negatives++;
      if (!best || m.pct > margin(best.sale_price, best.avgCost).pct) best = p;
      if (!worst || m.pct < margin(worst.sale_price, worst.avgCost).pct) worst = p;
    }
    return { avgMargin: sum / products.length, best, worst, negatives, count: products.length };
  }, [products]);

  // Supplier comparison for the same product across suppliers
  const multiSupplier = useMemo(
    () => products.filter((p) => p.suppliers.size > 1).sort((a, b) => b.suppliers.size - a.suppliers.size),
    [products],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Margens & Custos</h1>
        <p className="text-muted-foreground">
          Compare o que pagou aos fornecedores com o preço de venda. Encontre margens fracas e o melhor fornecedor por produto.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Margem média (custo médio)</p>
              <p className="text-xl font-semibold">{kpis.avgMargin.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Melhor margem</p>
              <p className="truncate text-sm font-semibold">{kpis.best?.name ?? "—"}</p>
              <p className="text-xs text-muted-foreground">
                {kpis.best ? `${margin(kpis.best.sale_price, kpis.best.avgCost).pct.toFixed(1)}%` : ""}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/15 text-red-600">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Pior margem</p>
              <p className="truncate text-sm font-semibold">{kpis.worst?.name ?? "—"}</p>
              <p className="text-xs text-muted-foreground">
                {kpis.worst ? `${margin(kpis.worst.sale_price, kpis.worst.avgCost).pct.toFixed(1)}%` : ""}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
              <PackageIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Produtos c/ margem negativa</p>
              <p className="text-xl font-semibold">{kpis.negatives} / {kpis.count}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_260px]">
          <div className="space-y-1">
            <Label className="text-xs">Pesquisar produto</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome ou fabricante…" className="pl-9" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fornecedor</Label>
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os fornecedores</SelectItem>
                <SelectItem value="none">Sem fornecedor</SelectItem>
                {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.legal_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="produtos">
        <TabsList>
          <TabsTrigger value="produtos">Por produto</TabsTrigger>
          <TabsTrigger value="fornecedores">Comparar fornecedores</TabsTrigger>
        </TabsList>

        <TabsContent value="produtos">
          <Card>
            <CardHeader>
              <CardTitle>Preço de custo vs. venda</CardTitle>
              <CardDescription>
                Custo por unidade (sub-unidade se aplicável). Ordenado pela margem mais fraca — atue nesses primeiro.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Custo médio</TableHead>
                    <TableHead className="text-right">Último custo</TableHead>
                    <TableHead className="text-right">Faixa (mín–máx)</TableHead>
                    <TableHead className="text-right">Preço venda</TableHead>
                    <TableHead className="text-right">Lucro/un</TableHead>
                    <TableHead className="text-right">Margem</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                        Sem dados. Registe entradas de mercadoria para começar a análise.
                      </TableCell>
                    </TableRow>
                  ) : filtered.map((p) => {
                    const m = margin(p.sale_price, p.avgCost);
                    return (
                      <TableRow key={p.product_id}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{p.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {p.manufacturer ?? "—"} · {p.suppliers.size} fornec.
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatMZN(p.avgCost)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatMZN(p.lastCost)}</TableCell>
                        <TableCell className="text-right tabular-nums text-xs text-muted-foreground">
                          {formatMZN(p.minCost)} – {formatMZN(p.maxCost)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatMZN(p.sale_price)}</TableCell>
                        <TableCell className={`text-right tabular-nums ${m.abs < 0 ? "text-red-600" : ""}`}>
                          {formatMZN(m.abs)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={marginBadge(m.pct)}>{m.pct.toFixed(1)}%</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{p.totalQty}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fornecedores">
          <Card>
            <CardHeader>
              <CardTitle>Produtos comprados a vários fornecedores</CardTitle>
              <CardDescription>Veja qual fornecedor oferece o melhor custo por produto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {multiSupplier.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Ainda não há produtos comprados a mais de um fornecedor.
                </p>
              ) : multiSupplier.map((p) => {
                const rows = Array.from(p.suppliers.values());
                const bestCost = Math.min(...rows.map((r) => r.lastCost || r.totalCost / Math.max(1, r.qty)));
                return (
                  <div key={p.product_id} className="rounded-lg border">
                    <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">Venda {formatMZN(p.sale_price)}</p>
                      </div>
                      <Badge className={marginBadge(margin(p.sale_price, bestCost).pct)}>
                        Melhor: {margin(p.sale_price, bestCost).pct.toFixed(1)}%
                      </Badge>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fornecedor</TableHead>
                          <TableHead className="text-right">Último custo</TableHead>
                          <TableHead className="text-right">Custo médio</TableHead>
                          <TableHead className="text-right">Faixa</TableHead>
                          <TableHead className="text-right">Qtd comprada</TableHead>
                          <TableHead className="text-right">Margem (últ.)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.sort((a, b) => a.lastCost - b.lastCost).map((s) => {
                          const avg = s.totalCost / Math.max(1, s.qty);
                          const m = margin(p.sale_price, s.lastCost);
                          const isBest = s.lastCost === bestCost;
                          return (
                            <TableRow key={s.id} className={isBest ? "bg-emerald-500/5" : ""}>
                              <TableCell>
                                <span className="font-medium">{s.name}</span>
                                {isBest && <Badge className="ml-2 bg-emerald-600 hover:bg-emerald-700">Melhor preço</Badge>}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{formatMZN(s.lastCost)}</TableCell>
                              <TableCell className="text-right tabular-nums">{formatMZN(avg)}</TableCell>
                              <TableCell className="text-right tabular-nums text-xs text-muted-foreground">
                                {formatMZN(s.minCost)} – {formatMZN(s.maxCost)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{s.qty}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline" className={m.pct < 0 ? "text-red-600" : ""}>{m.pct.toFixed(1)}%</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
