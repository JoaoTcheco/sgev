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
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Edit, Loader2, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_app/products")({
  component: ProductsPage,
});

type Tarja = "livre" | "amarela" | "vermelha" | "preta";
type Product = {
  id: string; name: string; active_ingredient: string | null; barcode: string | null;
  manufacturer: string | null; sale_price: number; cost_price: number; min_stock: number;
  ideal_stock: number; tarja: Tarja | null; requires_prescription: boolean; active: boolean;
  category_id: string | null; unit: string | null;
  pack_size: number; sub_unit_label: string | null; sub_unit_price: number | null;
};

function ProductsPage() {
  const auth = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", search],
    queryFn: async () => {
      let q = supabase.from("products").select("*").order("name");
      if (search) q = q.or(`name.ilike.%${search}%,barcode.ilike.%${search}%,active_ingredient.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<Product>) => {
      const p = payload as never;
      if (editing) {
        const { error } = await supabase.from("products").update(p).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(p);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Produto atualizado" : "Produto cadastrado");
      qc.invalidateQueries({ queryKey: ["products"] });
      setOpen(false); setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produto excluído");
      qc.invalidateQueries({ queryKey: ["products"] });
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pack = Number(fd.get("pack_size") || 1);
    const subLabel = (String(fd.get("sub_unit_label") || "").trim()) || null;
    const subPriceRaw = fd.get("sub_unit_price");
    const sale = Number(fd.get("sale_price") || 0);
    const subPrice = subPriceRaw && String(subPriceRaw).length > 0
      ? Number(subPriceRaw)
      : (pack > 1 && subLabel ? Number((sale / pack).toFixed(2)) : null);
    saveMutation.mutate({
      name: String(fd.get("name")),
      active_ingredient: String(fd.get("active_ingredient") || "") || null,
      barcode: String(fd.get("barcode") || "") || null,
      manufacturer: String(fd.get("manufacturer") || "") || null,
      unit: String(fd.get("unit") || "un"),
      category_id: (fd.get("category_id") as string) || null,
      tarja: (fd.get("tarja") as Product["tarja"]) || "livre",
      requires_prescription: fd.get("requires_prescription") === "on",
      cost_price: Number(fd.get("cost_price") || 0),
      sale_price: sale,
      min_stock: Number(fd.get("min_stock") || 5),
      ideal_stock: Number(fd.get("ideal_stock") || 20),
      pack_size: Math.max(1, pack),
      sub_unit_label: subLabel,
      sub_unit_price: subPrice,
      active: true,
    });
  };

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">Catálogo de medicamentos e itens</p>
        </div>
        {auth.isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="h-4 w-4" /> Novo produto</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar produto" : "Novo produto"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Nome *</Label>
                  <Input name="name" required defaultValue={editing?.name} />
                </div>
                <div className="space-y-2">
                  <Label>Princípio ativo</Label>
                  <Input name="active_ingredient" defaultValue={editing?.active_ingredient ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label>Fabricante</Label>
                  <Input name="manufacturer" defaultValue={editing?.manufacturer ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label>Código de barras</Label>
                  <Input name="barcode" defaultValue={editing?.barcode ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Input name="unit" defaultValue={editing?.unit ?? "un"} />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select name="category_id" defaultValue={editing?.category_id ?? undefined}>
                    <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c: { id: string; name: string }) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tarja</Label>
                  <Select name="tarja" defaultValue={editing?.tarja ?? "livre"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="livre">Livre</SelectItem>
                      <SelectItem value="amarela">Tarja amarela</SelectItem>
                      <SelectItem value="vermelha">Tarja vermelha</SelectItem>
                      <SelectItem value="preta">Tarja preta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Preço de custo</Label>
                  <Input name="cost_price" type="number" step="0.01" defaultValue={editing?.cost_price ?? 0} />
                </div>
                <div className="space-y-2">
                  <Label>Preço de venda *</Label>
                  <Input name="sale_price" type="number" step="0.01" required defaultValue={editing?.sale_price ?? 0} />
                </div>
                <div className="space-y-2">
                  <Label>Estoque mínimo</Label>
                  <Input name="min_stock" type="number" defaultValue={editing?.min_stock ?? 5} />
                </div>
                <div className="space-y-2">
                  <Label>Estoque ideal</Label>
                  <Input name="ideal_stock" type="number" defaultValue={editing?.ideal_stock ?? 20} />
                </div>
                <div className="col-span-2 border rounded-md p-3 space-y-2 bg-muted/30">
                  <p className="text-sm font-medium">Fracionamento (caixinha → carteiras)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Carteiras por caixinha</Label>
                      <Input name="pack_size" type="number" min="1" defaultValue={editing?.pack_size ?? 1} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Rótulo da sub-unidade</Label>
                      <Input name="sub_unit_label" placeholder="ex.: carteira" defaultValue={editing?.sub_unit_label ?? ""} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Preço por sub-unidade</Label>
                      <Input name="sub_unit_price" type="number" step="0.01" placeholder="auto" defaultValue={editing?.sub_unit_price ?? ""} />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Deixe sub-unidade em branco para vender apenas em caixinha.</p>
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <Switch name="requires_prescription" defaultChecked={editing?.requires_prescription} />
                  <Label>Exige receita médica</Label>
                </div>
                <DialogFooter className="col-span-2">
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Salvar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input placeholder="Buscar por nome, princípio ativo ou código de barras..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Princípio ativo</TableHead>
                <TableHead>Tarja</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Mín</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>}
              {!isLoading && products.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum produto cadastrado</TableCell></TableRow>}
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.barcode ?? "—"}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.active_ingredient ?? "—"}</TableCell>
                  <TableCell><span className="text-xs px-2 py-0.5 rounded bg-secondary">{p.tarja ?? "livre"}</span></TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(p.sale_price)}</TableCell>
                  <TableCell className="text-right">{p.min_stock}</TableCell>
                  <TableCell>
                    {auth.isStaff && (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleting(p)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
