import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Loader2, Package, Pencil, Trash2, Barcode as BarcodeIcon, Printer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { formatMZN, formatDate } from "@/lib/format";
import { useAuthUser, useUserRoles, highestRole } from "@/hooks/use-auth";
import { Barcode } from "@/components/barcode";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () => ({ meta: [{ title: "Estoque — PharmaSys" }] }),
  component: () => <RoleGate allow={["admin", "pharmacist"]}><EstoquePage /></RoleGate>,
});

type ProductRow = {
  id: string;
  name: string;
  manufacturer: string | null;
  unit: string | null;
  pack_size: number;
  min_stock: number;
  sale_price: number;
  cost_price: number;
  tarja: "livre" | "amarela" | "vermelha" | "preta" | null;
  active: boolean;
  barcode: string | null;
  category_id: string | null;
  active_ingredient: string | null;
  requires_prescription: boolean;
  sub_unit_label: string | null;
  sub_unit_price: number | null;
  ideal_stock: number;
  batches: { id: string; expiry_date: string; quantity: number }[] | null;
};

function generateBarcode(): string {
  // EAN-13-like 13 digit numeric (no checksum requirement for CODE128, but keep numeric for scan compatibility)
  const ts = Date.now().toString().slice(-10);
  const rnd = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return ts + rnd;
}

function EstoquePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [batchOpen, setBatchOpen] = useState<string | null>(null);
  const [productOpen, setProductOpen] = useState<ProductRow | "new" | null>(null);
  const [deleteOpen, setDeleteOpen] = useState<ProductRow | null>(null);
  const [barcodeOpen, setBarcodeOpen] = useState<ProductRow | null>(null);
  const [printQty, setPrintQty] = useState(12);
  const { user } = useAuthUser();
  const { data: roles = [] } = useUserRoles(user?.id);
  const role = highestRole(roles);
  const canManage = role === "admin" || role === "pharmacist";

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["stock", search],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id, name, manufacturer, unit, pack_size, min_stock, ideal_stock, sale_price, cost_price, tarja, active, barcode, category_id, active_ingredient, requires_prescription, sub_unit_label, sub_unit_price, batches(id, expiry_date, quantity)")
        .order("name")
        .limit(200);
      if (search.trim()) {
        const term = `%${search.trim()}%`;
        q = q.or(`name.ilike.${term},barcode.ilike.${term},manufacturer.ilike.${term}`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ProductRow[];
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

  const { data: categories = [] } = useQuery({
    queryKey: ["categories-min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const addBatch = useMutation({
    mutationFn: async (payload: { product_id: string; supplier_id: string | null; batch_number: string; expiry_date: string; quantity: number; cost_price: number }) => {
      const { error } = await supabase.rpc("add_batch_entry", {
        p_product_id: payload.product_id,
        p_supplier_id: payload.supplier_id as unknown as string,
        p_batch_number: payload.batch_number,
        p_expiry_date: payload.expiry_date,
        p_quantity: payload.quantity,
        p_cost_price: payload.cost_price,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lote registado");
      setBatchOpen(null);
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
    onError: (e: Error) => toast.error("Falha", { description: e.message }),
  });

  const saveProduct = useMutation({
    mutationFn: async (p: Partial<ProductRow> & { id?: string }) => {
      const payload = {
        name: p.name!,
        manufacturer: p.manufacturer || null,
        unit: p.unit || "cx",
        pack_size: Number(p.pack_size || 1),
        min_stock: Number(p.min_stock || 0),
        ideal_stock: Number(p.ideal_stock || 0),
        cost_price: Number(p.cost_price || 0),
        sale_price: Number(p.sale_price || 0),
        tarja: p.tarja || null,
        active: p.active ?? true,
        barcode: p.barcode?.trim() || generateBarcode(),
        category_id: p.category_id || null,
        active_ingredient: p.active_ingredient || null,
        requires_prescription: p.requires_prescription ?? false,
        sub_unit_label: p.sub_unit_label || null,
        sub_unit_price: p.sub_unit_price ? Number(p.sub_unit_price) : null,
      };
      if (p.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Produto guardado");
      setProductOpen(null);
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
    onError: (e: Error) => toast.error("Falha", { description: e.message }),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      // Try hard delete; if FK conflict (lotes/vendas), soft-disable
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) {
        const { error: e2 } = await supabase.from("products").update({ active: false }).eq("id", id);
        if (e2) throw e2;
        return "disabled" as const;
      }
      return "deleted" as const;
    },
    onSuccess: (r) => {
      toast.success(r === "deleted" ? "Produto eliminado" : "Produto desativado (possui histórico)");
      setDeleteOpen(null);
      queryClient.invalidateQueries({ queryKey: ["stock"] });
    },
    onError: (e: Error) => toast.error("Falha", { description: e.message }),
  });

  function totalUnits(batches: ProductRow["batches"]) {
    const today = new Date().toISOString().slice(0, 10);
    return (batches ?? []).filter((b) => b.expiry_date >= today).reduce((s, b) => s + b.quantity, 0);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Estoque</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Produtos, lotes, validade e códigos de barras.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar produto, código…" className="pl-9" />
            </div>
            {canManage && (
              <Button onClick={() => setProductOpen("new")}><Plus className="mr-1 h-4 w-4" /> Novo produto</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tarja</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead className="text-right">Mín.</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Venda</TableHead>
                    <TableHead>Próx. validade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((p) => {
                    const units = totalUnits(p.batches);
                    const nextExpiry = (p.batches ?? []).filter((b) => b.quantity > 0).map((b) => b.expiry_date).sort()[0];
                    const low = units <= p.min_stock;
                    return (
                      <TableRow key={p.id} className={p.active ? "" : "opacity-60"}>
                        <TableCell>
                          <div className="font-medium">{p.name} {!p.active && <Badge variant="outline" className="ml-1">inativo</Badge>}</div>
                          <div className="text-xs text-muted-foreground">{p.manufacturer ?? "—"} {p.barcode ? `· ${p.barcode}` : ""}</div>
                        </TableCell>
                        <TableCell>{p.tarja ? <Badge variant="outline">{p.tarja}</Badge> : <span className="text-xs text-muted-foreground">livre</span>}</TableCell>
                        <TableCell className={`text-right ${low ? "text-destructive font-semibold" : ""}`}>{units}</TableCell>
                        <TableCell className="text-right">{p.min_stock}</TableCell>
                        <TableCell className="text-right">{formatMZN(p.cost_price)}</TableCell>
                        <TableCell className="text-right">{formatMZN(p.sale_price)}</TableCell>
                        <TableCell>{formatDate(nextExpiry)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" title="Código de barras" onClick={() => { setBarcodeOpen(p); setPrintQty(12); }}>
                              <BarcodeIcon className="h-4 w-4" />
                            </Button>
                            {canManage && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => setBatchOpen(p.id)}>
                                  <Plus className="mr-1 h-3 w-3" /> Lote
                                </Button>
                                <Button size="icon" variant="ghost" title="Editar" onClick={() => setProductOpen(p)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" title="Eliminar" onClick={() => setDeleteOpen(p)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {rows.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">Sem produtos.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch dialog */}
      <Dialog open={!!batchOpen} onOpenChange={(o) => !o && setBatchOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Entrada de lote</DialogTitle></DialogHeader>
          <form
            id="batch-form"
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              addBatch.mutate({
                product_id: batchOpen!,
                supplier_id: (f.get("supplier_id") as string) || null,
                batch_number: String(f.get("batch_number") || ""),
                expiry_date: String(f.get("expiry_date") || ""),
                quantity: Number(f.get("quantity") || 0),
                cost_price: Number(f.get("cost_price") || 0),
              });
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="batch_number">Número do lote</Label>
                <Input id="batch_number" name="batch_number" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="expiry_date">Validade</Label>
                <Input id="expiry_date" name="expiry_date" type="date" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="quantity">Quantidade (un)</Label>
                <Input id="quantity" name="quantity" type="number" min={1} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cost_price">Custo unitário</Label>
                <Input id="cost_price" name="cost_price" type="number" step="0.01" min={0} required />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Fornecedor</Label>
                <Select name="supplier_id">
                  <SelectTrigger><SelectValue placeholder="Selecionar (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.legal_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
          <DialogFooter>
            <Button type="submit" form="batch-form" disabled={addBatch.isPending}>
              {addBatch.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product dialog */}
      <ProductDialog
        open={productOpen}
        onClose={() => setProductOpen(null)}
        categories={categories as { id: string; name: string }[]}
        onSubmit={(p) => saveProduct.mutate(p)}
        saving={saveProduct.isPending}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteOpen} onOpenChange={(o) => !o && setDeleteOpen(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar produto?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteOpen?.name}. Se houver histórico associado, o produto será desativado em vez de eliminado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteOpen && deleteProduct.mutate(deleteOpen.id)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Barcode print dialog */}
      <BarcodeDialog
        product={barcodeOpen}
        qty={printQty}
        setQty={setPrintQty}
        onClose={() => setBarcodeOpen(null)}
        onAssign={async (code) => {
          if (!barcodeOpen) return;
          const { error } = await supabase.from("products").update({ barcode: code }).eq("id", barcodeOpen.id);
          if (error) { toast.error("Falha", { description: error.message }); return; }
          toast.success("Código atribuído");
          queryClient.invalidateQueries({ queryKey: ["stock"] });
          setBarcodeOpen({ ...barcodeOpen, barcode: code });
        }}
      />
    </div>
  );
}

function ProductDialog({
  open, onClose, categories, onSubmit, saving,
}: {
  open: ProductRow | "new" | null;
  onClose: () => void;
  categories: { id: string; name: string }[];
  onSubmit: (p: Partial<ProductRow> & { id?: string }) => void;
  saving: boolean;
}) {
  const editing = open && open !== "new" ? open : null;
  const isOpen = !!open;
  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
        <form
          id="product-form"
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            onSubmit({
              id: editing?.id,
              name: String(f.get("name") || ""),
              manufacturer: String(f.get("manufacturer") || ""),
              active_ingredient: String(f.get("active_ingredient") || ""),
              unit: String(f.get("unit") || "cx"),
              pack_size: Number(f.get("pack_size") || 1),
              min_stock: Number(f.get("min_stock") || 0),
              ideal_stock: Number(f.get("ideal_stock") || 0),
              cost_price: Number(f.get("cost_price") || 0),
              sale_price: Number(f.get("sale_price") || 0),
              sub_unit_label: String(f.get("sub_unit_label") || ""),
              sub_unit_price: f.get("sub_unit_price") ? Number(f.get("sub_unit_price")) : null,
              tarja: (f.get("tarja") as ProductRow["tarja"]) || null,
              category_id: (f.get("category_id") as string) || null,
              barcode: String(f.get("barcode") || ""),
              requires_prescription: f.get("requires_prescription") === "on",
              active: f.get("active") === "on",
            });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" name="name" required defaultValue={editing?.name ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="manufacturer">Fabricante</Label>
              <Input id="manufacturer" name="manufacturer" defaultValue={editing?.manufacturer ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="active_ingredient">Princípio ativo</Label>
              <Input id="active_ingredient" name="active_ingredient" defaultValue={editing?.active_ingredient ?? ""} />
            </div>
            <div className="space-y-1">
              <Label>Categoria</Label>
              <Select name="category_id" defaultValue={editing?.category_id ?? undefined}>
                <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tarja</Label>
              <Select name="tarja" defaultValue={editing?.tarja ?? undefined}>
                <SelectTrigger><SelectValue placeholder="Livre" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="livre">Livre</SelectItem>
                  <SelectItem value="amarela">Amarela</SelectItem>
                  <SelectItem value="vermelha">Vermelha</SelectItem>
                  <SelectItem value="preta">Preta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="unit">Unidade (cx/fr)</Label>
              <Input id="unit" name="unit" defaultValue={editing?.unit ?? "cx"} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pack_size">Comp./caixa</Label>
              <Input id="pack_size" name="pack_size" type="number" min={1} defaultValue={editing?.pack_size ?? 1} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cost_price">Preço custo</Label>
              <Input id="cost_price" name="cost_price" type="number" step="0.01" min={0} defaultValue={editing?.cost_price ?? 0} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sale_price">Preço venda</Label>
              <Input id="sale_price" name="sale_price" type="number" step="0.01" min={0} defaultValue={editing?.sale_price ?? 0} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sub_unit_label">Sub-unidade (ex: comprimido)</Label>
              <Input id="sub_unit_label" name="sub_unit_label" defaultValue={editing?.sub_unit_label ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sub_unit_price">Preço sub-unidade</Label>
              <Input id="sub_unit_price" name="sub_unit_price" type="number" step="0.01" min={0} defaultValue={editing?.sub_unit_price ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="min_stock">Estoque mínimo</Label>
              <Input id="min_stock" name="min_stock" type="number" min={0} defaultValue={editing?.min_stock ?? 0} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ideal_stock">Estoque ideal</Label>
              <Input id="ideal_stock" name="ideal_stock" type="number" min={0} defaultValue={editing?.ideal_stock ?? 0} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="barcode">Código de barras (deixe vazio para gerar)</Label>
              <Input id="barcode" name="barcode" defaultValue={editing?.barcode ?? ""} placeholder="Será gerado automaticamente" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch name="requires_prescription" defaultChecked={editing?.requires_prescription ?? false} /> Requer receita
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch name="active" defaultChecked={editing?.active ?? true} /> Ativo
            </label>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="product-form" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BarcodeDialog({
  product, qty, setQty, onClose, onAssign,
}: {
  product: ProductRow | null;
  qty: number;
  setQty: (n: number) => void;
  onClose: () => void;
  onAssign: (code: string) => void;
}) {
  const [code, setCode] = useState(product?.barcode ?? "");
  useEffect(() => { setCode(product?.barcode ?? ""); }, [product?.id, product?.barcode]);

  async function print() {
    if (!product || !product.barcode) { toast.error("Atribua um código primeiro"); return; }
    const JsBarcode = (await import("jsbarcode")).default;
    // Render each barcode to an SVG string in-process (no internet needed)
    const svgNS = "http://www.w3.org/2000/svg";
    const renderOne = () => {
      const svg = document.createElementNS(svgNS, "svg");
      JsBarcode(svg, product.barcode!, { format: "CODE128", height: 40, width: 1.4, fontSize: 10, margin: 0 });
      return new XMLSerializer().serializeToString(svg);
    };
    const svgMarkup = renderOne();
    const labels = Array.from({ length: qty }).map(() => `
      <div class="label">
        <div class="name">${escapeHtml(product.name)}</div>
        <div class="bc">${svgMarkup}</div>
        <div class="price">${formatMZN(product.sale_price)}</div>
      </div>
    `).join("");
    const w = window.open("", "_blank", "width=800,height=600");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Etiquetas — ${escapeHtml(product.name)}</title>
      <style>
        @page { size: A4; margin: 8mm; }
        body { font-family: system-ui, sans-serif; margin: 0; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
        .label { border: 1px dashed #ccc; padding: 4mm; text-align: center; page-break-inside: avoid; }
        .name { font-size: 11px; font-weight: 600; margin-bottom: 2mm; }
        .bc svg { width: 100%; height: 40px; }
        .price { font-size: 12px; font-weight: 700; margin-top: 1mm; }
        @media print { .label { border-color: transparent; } }
      </style></head><body>
      <div class="grid">${labels}</div>
      <script>window.onload=function(){setTimeout(function(){window.print();},200);};</script>
      </body></html>`);
    w.document.close();
  }


  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Código de barras</DialogTitle></DialogHeader>
        {product && (
          <div className="space-y-4">
            <div className="text-sm">
              <div className="font-medium">{product.name}</div>
              <div className="text-muted-foreground">{formatMZN(product.sale_price)}</div>
            </div>
            <div className="flex gap-2">
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código" />
              <Button variant="outline" onClick={() => setCode(generateBarcode())}>Gerar</Button>
              <Button onClick={() => onAssign(code.trim())} disabled={!code.trim() || code === product.barcode}>Atribuir</Button>
            </div>
            {product.barcode ? (
              <div className="rounded border bg-white p-4">
                <Barcode value={product.barcode} height={70} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sem código atribuído.</p>
            )}
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor="qty">Quantidade de etiquetas</Label>
                <Input id="qty" type="number" min={1} max={120} value={qty} onChange={(e) => setQty(Number(e.target.value) || 1)} className="w-32" />
              </div>
              <Button onClick={print} disabled={!product.barcode}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
