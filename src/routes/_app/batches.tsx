import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Edit, Trash2 } from "lucide-react";
import { formatDate, daysUntil } from "@/lib/format";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_app/batches")({
  component: BatchesPage,
});

function BatchesPage() {
  const auth = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("batches")
        .select("*, products(name, unit), suppliers(legal_name)")
        .order("expiry_date");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-min"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, pack_size, sub_unit_label, unit")
        .eq("active", true)
        .order("name");
      return (data ?? []) as Array<{ id: string; name: string; pack_size: number; sub_unit_label: string | null; unit: string | null }>;
    },
  });

  const [productId, setProductId] = useState<string>("");
  const [packs, setPacks] = useState<number>(1);
  const selectedProduct = products.find((p) => p.id === productId);
  const packSize = selectedProduct?.pack_size ?? 1;
  const subLabel = selectedProduct?.sub_unit_label ?? null;
  const totalSubUnits = packs * Math.max(1, packSize);


  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-min"],
    queryFn: async () => {
      const { data } = await supabase.from("suppliers").select("id, legal_name").eq("active", true).order("legal_name");
      return data ?? [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (vars: { product_id: string; supplier_id: string | null; batch_number: string; expiry_date: string; quantity: number; cost_price: number }) => {
      const { error } = await supabase.rpc("add_batch_entry", {
        p_product_id: vars.product_id,
        p_supplier_id: vars.supplier_id as string,
        p_batch_number: vars.batch_number,
        p_expiry_date: vars.expiry_date,
        p_quantity: vars.quantity,
        p_cost_price: vars.cost_price,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entrada registrada");
      qc.invalidateQueries({ queryKey: ["batches"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pid = String(fd.get("product_id"));
    const prod = products.find((p) => p.id === pid);
    const ps = prod?.pack_size ?? 1;
    const packsQty = Number(fd.get("packs") || 0);
    const subQty = ps > 1 ? packsQty * ps : packsQty;
    addMutation.mutate({
      product_id: pid,
      supplier_id: (fd.get("supplier_id") as string) || null,
      batch_number: String(fd.get("batch_number")),
      expiry_date: String(fd.get("expiry_date")),
      quantity: subQty,
      cost_price: Number(fd.get("cost_price") || 0),
    });
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Estoque & Lotes</h1>
          <p className="text-muted-foreground">Controle por lote, validade e fornecedor (FEFO)</p>
        </div>
        {auth.isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Entrada de estoque</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Registrar entrada</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Produto *</Label>
                  <Select name="product_id" required value={productId} onValueChange={(v) => { setProductId(v); setPacks(1); }}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProduct && packSize > 1 && subLabel && (
                    <p className="text-xs text-muted-foreground">
                      Cada caixinha contém <b>{packSize} {subLabel}s</b>.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Fornecedor</Label>
                  <Select name="supplier_id">
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s: { id: string; legal_name: string }) => (
                        <SelectItem key={s.id} value={s.id}>{s.legal_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Nº do lote *</Label>
                    <Input name="batch_number" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Validade *</Label>
                    <Input name="expiry_date" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label>{packSize > 1 ? "Caixinhas recebidas *" : "Quantidade *"}</Label>
                    <Input name="packs" type="number" min="1" required value={packs} onChange={(e) => setPacks(Number(e.target.value) || 0)} />
                    {packSize > 1 && subLabel && packs > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        = <b>{totalSubUnits} {subLabel}s</b> em estoque
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Custo por {packSize > 1 && subLabel ? subLabel : "unidade"}</Label>
                    <Input name="cost_price" type="number" step="0.01" defaultValue={0} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={addMutation.isPending}>
                    {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Registrar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>}
              {!isLoading && batches.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum lote cadastrado</TableCell></TableRow>}
              {batches.map((b: { id: string; batch_number: string; expiry_date: string; quantity: number; products: { name: string } | null; suppliers: { legal_name: string } | null }) => {
                const days = daysUntil(b.expiry_date);
                const status = days < 0 ? { l: "Vencido", c: "bg-destructive text-destructive-foreground" }
                  : days <= 30 ? { l: `${days}d`, c: "bg-destructive text-destructive-foreground" }
                  : days <= 60 ? { l: `${days}d`, c: "bg-warning text-warning-foreground" }
                  : days <= 90 ? { l: `${days}d`, c: "bg-accent text-accent-foreground" }
                  : { l: "OK", c: "bg-success text-success-foreground" };
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.products?.name ?? "—"}</TableCell>
                    <TableCell>{b.batch_number}</TableCell>
                    <TableCell className="text-muted-foreground">{b.suppliers?.legal_name ?? "—"}</TableCell>
                    <TableCell className="text-right font-medium">{b.quantity}</TableCell>
                    <TableCell>{formatDate(b.expiry_date)}</TableCell>
                    <TableCell><span className={`text-xs px-2 py-0.5 rounded-full ${status.c}`}>{status.l}</span></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
