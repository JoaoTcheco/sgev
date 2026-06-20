import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMZN, formatDate } from "@/lib/format";
import { useAuthUser, useUserRoles, highestRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () => ({ meta: [{ title: "Estoque — PharmaSys" }] }),
  component: EstoquePage,
});

function EstoquePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [batchOpen, setBatchOpen] = useState<string | null>(null);
  const { user } = useAuthUser();
  const { data: roles = [] } = useUserRoles(user?.id);
  const role = highestRole(roles);
  const canManage = role === "admin" || role === "pharmacist";

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["stock", search],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id, name, manufacturer, unit, pack_size, min_stock, sale_price, cost_price, tarja, active, batches(id, batch_number, expiry_date, quantity, cost_price, supplier_id, suppliers(legal_name))")
        .order("name")
        .limit(100);
      if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
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

  function totalUnits(batches: any[] | null) {
    const today = new Date().toISOString().slice(0, 10);
    return (batches ?? []).filter((b) => b.expiry_date >= today).reduce((s, b) => s + b.quantity, 0);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Estoque</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Produtos, lotes, validade e disponibilidade.</p>
          </div>
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar produto…" className="pl-9" />
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
                    <TableHead className="text-right">Estoque (un)</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Venda</TableHead>
                    <TableHead>Próx. validade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((p: any) => {
                    const units = totalUnits(p.batches);
                    const nextExpiry = (p.batches ?? []).filter((b: any) => b.quantity > 0).map((b: any) => b.expiry_date).sort()[0];
                    const low = units <= p.min_stock;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.manufacturer ?? "—"}</div>
                        </TableCell>
                        <TableCell>{p.tarja ? <Badge variant="outline">{p.tarja}</Badge> : <span className="text-xs text-muted-foreground">livre</span>}</TableCell>
                        <TableCell className={`text-right ${low ? "text-destructive font-semibold" : ""}`}>{units}</TableCell>
                        <TableCell className="text-right">{p.min_stock}</TableCell>
                        <TableCell className="text-right">{formatMZN(p.cost_price)}</TableCell>
                        <TableCell className="text-right">{formatMZN(p.sale_price)}</TableCell>
                        <TableCell>{formatDate(nextExpiry)}</TableCell>
                        <TableCell className="text-right">
                          {canManage && (
                            <Button size="sm" variant="outline" onClick={() => setBatchOpen(p.id)}>
                              <Plus className="mr-1 h-3 w-3" /> Lote
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!batchOpen} onOpenChange={(o) => !o && setBatchOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrada de lote</DialogTitle>
          </DialogHeader>
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
                    {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.legal_name}</SelectItem>)}
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
    </div>
  );
}
