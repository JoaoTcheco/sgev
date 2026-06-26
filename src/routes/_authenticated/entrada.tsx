import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2, Loader2, PackagePlus, Printer, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMZN } from "@/lib/format";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { printLabels } from "@/lib/print-labels";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/entrada")({
  head: () => ({ meta: [{ title: "Entrada de Mercadoria — PharmaSys" }] }),
  component: () => <RoleGate allow={["admin", "pharmacist"]}><EntradaPage /></RoleGate>,
});

type DraftRow = {
  uid: string;
  product_id: string;
  name: string;
  barcode: string | null;
  sale_price: number;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  cost_price: number;
  supplier_id: string | null;
  status: "pending" | "saved" | "error";
  error?: string;
};

function uid() { return Math.random().toString(36).slice(2, 10); }

function EntradaPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [defaultSupplier, setDefaultSupplier] = useState<string | "">("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [saving, setSaving] = useState(false);
  const lastFocusRef = useRef<HTMLInputElement | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["entrada-products", search],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id, name, manufacturer, barcode, sale_price, unit")
        .eq("active", true)
        .order("name")
        .limit(30);
      if (search.trim()) {
        const term = `%${search.trim()}%`;
        q = q.or(`name.ilike.${term},barcode.ilike.${term},manufacturer.ilike.${term}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("id, legal_name").eq("active", true).order("legal_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const addProduct = useCallback((p: { id: string; name: string; barcode: string | null; sale_price: number }) => {
    setRows((prev) => {
      // If same product already pending, just bump qty
      const idx = prev.findIndex((r) => r.product_id === p.id && r.status !== "saved");
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          uid: uid(),
          product_id: p.id,
          name: p.name,
          barcode: p.barcode,
          sale_price: Number(p.sale_price ?? 0),
          batch_number: "",
          expiry_date: "",
          quantity: 1,
          cost_price: 0,
          supplier_id: defaultSupplier || null,
          status: "pending",
        },
      ];
    });
  }, [defaultSupplier]);

  // Hardware scanner: lookup by exact barcode, add to draft.
  useBarcodeScanner(async (code) => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, barcode, sale_price")
      .eq("barcode", code)
      .eq("active", true)
      .maybeSingle();
    if (error) { toast.error("Falha na busca", { description: error.message }); return; }
    if (!data) { toast.error(`Código ${code} não encontrado`); return; }
    addProduct(data);
    toast.success(`+ ${data.name}`);
  });

  function updateRow(uid: string, patch: Partial<DraftRow>) {
    setRows((prev) => prev.map((r) => (r.uid === uid ? { ...r, ...patch } : r)));
  }

  function removeRow(uid: string) {
    setRows((prev) => prev.filter((r) => r.uid !== uid));
  }

  const pending = useMemo(() => rows.filter((r) => r.status !== "saved"), [rows]);
  const totalCost = useMemo(() => rows.reduce((s, r) => s + r.cost_price * r.quantity, 0), [rows]);

  function validateRow(r: DraftRow): string | null {
    if (!r.batch_number.trim()) return "Lote obrigatório";
    if (!r.expiry_date) return "Validade obrigatória";
    if (r.quantity <= 0) return "Quantidade inválida";
    if (r.cost_price < 0) return "Custo inválido";
    const today = new Date().toISOString().slice(0, 10);
    if (r.expiry_date < today) return "Validade no passado";
    return null;
  }

  async function confirmAll() {
    if (pending.length === 0) { toast.error("Sem itens pendentes"); return; }
    // Validate first
    for (const r of pending) {
      const err = validateRow(r);
      if (err) { toast.error(`${r.name}: ${err}`); return; }
    }
    setSaving(true);
    let okCount = 0;
    for (const r of pending) {
      const { error } = await supabase.rpc("add_batch_entry", {
        p_product_id: r.product_id,
        p_supplier_id: (r.supplier_id ?? defaultSupplier ?? null) as unknown as string,
        p_batch_number: r.batch_number.trim(),
        p_expiry_date: r.expiry_date,
        p_quantity: Math.floor(r.quantity),
        p_cost_price: r.cost_price,
      });
      if (error) {
        updateRow(r.uid, { status: "error", error: error.message });
      } else {
        updateRow(r.uid, { status: "saved" });
        okCount++;
      }
    }
    setSaving(false);
    if (okCount > 0) {
      toast.success(`${okCount} entrada(s) registada(s)${invoiceRef ? ` · NF ${invoiceRef}` : ""}`);
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["pdv-products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
    if (okCount < pending.length) toast.error("Alguns itens falharam — reveja a tabela.");
  }

  function printRowLabels(r: DraftRow) {
    if (!r.barcode) { toast.error("Produto sem código de barras — atribua em Estoque."); return; }
    printLabels([{
      name: r.name,
      barcode: r.barcode,
      price: r.sale_price,
      batch_number: r.batch_number,
      expiry_date: r.expiry_date,
      qty: Math.min(120, Math.max(1, r.quantity)),
    }]);
  }

  function printAllSaved() {
    const saved = rows.filter((r) => r.status === "saved" && r.barcode);
    if (saved.length === 0) { toast.error("Nada para imprimir"); return; }
    printLabels(saved.map((r) => ({
      name: r.name,
      barcode: r.barcode!,
      price: r.sale_price,
      batch_number: r.batch_number,
      expiry_date: r.expiry_date,
      qty: Math.min(120, Math.max(1, r.quantity)),
    })));
  }

  function newEntry() {
    if (saving) return;
    setRows([]);
    setInvoiceRef("");
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_460px]">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5" /> Entrada de mercadoria</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Pesquise produtos ou use o leitor de código de barras para montar a entrada.
            </p>
          </div>
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input ref={lastFocusRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome, fabricante, código…" className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : products.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Sem resultados.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {products.map((p: any) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  className="flex items-center justify-between gap-2 rounded-lg border p-2 text-left hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.manufacturer ?? "—"} {p.barcode ? `· ${p.barcode}` : ""}</p>
                  </div>
                  <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="self-start">
        <CardHeader>
          <CardTitle>Conferência da nota</CardTitle>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="space-y-1">
              <Label htmlFor="nf">Nº da NF / referência</Label>
              <Input id="nf" value={invoiceRef} onChange={(e) => setInvoiceRef(e.target.value)} placeholder="NF-1234" />
            </div>
            <div className="space-y-1">
              <Label>Fornecedor padrão</Label>
              <Select value={defaultSupplier || undefined} onValueChange={(v) => setDefaultSupplier(v)}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.legal_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Adicione produtos à esquerda ou escaneie um código.</p>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.uid} className={`rounded-lg border p-2 ${r.status === "saved" ? "border-emerald-500/50 bg-emerald-500/5" : r.status === "error" ? "border-destructive/50 bg-destructive/5" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{r.barcode ?? "sem código"}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {r.status === "saved" && <Badge className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="mr-1 h-3 w-3" />OK</Badge>}
                      {r.status === "error" && <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Erro</Badge>}
                      {r.status === "saved" && (
                        <Button size="icon" variant="ghost" title="Imprimir etiquetas" onClick={() => printRowLabels(r)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                      )}
                      {r.status !== "saved" && (
                        <Button size="icon" variant="ghost" title="Remover" onClick={() => removeRow(r.uid)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Lote</Label>
                      <Input value={r.batch_number} disabled={r.status === "saved"} onChange={(e) => updateRow(r.uid, { batch_number: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Validade</Label>
                      <Input type="date" value={r.expiry_date} disabled={r.status === "saved"} onChange={(e) => updateRow(r.uid, { expiry_date: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Qtd (un)</Label>
                      <Input type="number" min={1} value={r.quantity} disabled={r.status === "saved"} onChange={(e) => updateRow(r.uid, { quantity: Math.max(1, Number(e.target.value) || 1) })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Custo unit.</Label>
                      <Input type="number" step="0.01" min={0} value={r.cost_price} disabled={r.status === "saved"} onChange={(e) => updateRow(r.uid, { cost_price: Math.max(0, Number(e.target.value) || 0) })} />
                    </div>
                  </div>
                  {r.status === "error" && r.error && <p className="mt-1 text-xs text-destructive">{r.error}</p>}
                </div>
              ))}
            </div>
          )}

          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total estimado</span>
            <span className="font-semibold">{formatMZN(totalCost)}</span>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" disabled={saving || pending.length === 0} onClick={confirmAll}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar entrada
            </Button>
            <Button variant="outline" disabled={!rows.some((r) => r.status === "saved")} onClick={printAllSaved}>
              <Printer className="mr-1 h-4 w-4" /> Etiquetas
            </Button>
            <Button variant="ghost" onClick={newEntry} disabled={saving}>Nova</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
