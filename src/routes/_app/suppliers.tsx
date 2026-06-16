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
import { Plus, Loader2, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/suppliers")({
  component: SuppliersPage,
});

type Supplier = { id: string; legal_name: string; tax_id: string | null; contact_name: string | null; email: string | null; phone: string | null; address: string | null; active: boolean };

function SuppliersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("legal_name");
      if (error) throw error;
      return (data ?? []) as Supplier[];
    },
  });

  const save = useMutation({
    mutationFn: async (p: Partial<Supplier>) => {
      const payload = p as never;
      if (editing) {
        const { error } = await supabase.from("suppliers").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("suppliers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Salvo"); qc.invalidateQueries({ queryKey: ["suppliers"] }); setOpen(false); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Fornecedor excluído"); qc.invalidateQueries({ queryKey: ["suppliers"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    save.mutate({
      legal_name: String(fd.get("legal_name")),
      tax_id: String(fd.get("tax_id") || "") || null,
      contact_name: String(fd.get("contact_name") || "") || null,
      email: String(fd.get("email") || "") || null,
      phone: String(fd.get("phone") || "") || null,
      address: String(fd.get("address") || "") || null,
      active: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fornecedores</h1>
          <p className="text-muted-foreground">Gestão de parceiros e distribuidores</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4" /> Novo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2"><Label>Razão social *</Label><Input name="legal_name" required defaultValue={editing?.legal_name} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>CNPJ</Label><Input name="tax_id" defaultValue={editing?.tax_id ?? ""} /></div>
                <div className="space-y-2"><Label>Contato</Label><Input name="contact_name" defaultValue={editing?.contact_name ?? ""} /></div>
                <div className="space-y-2"><Label>E-mail</Label><Input name="email" type="email" defaultValue={editing?.email ?? ""} /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input name="phone" defaultValue={editing?.phone ?? ""} /></div>
              </div>
              <div className="space-y-2"><Label>Endereço</Label><Input name="address" defaultValue={editing?.address ?? ""} /></div>
              <DialogFooter><Button type="submit" disabled={save.isPending}>{save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Salvar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>Razão social</TableHead><TableHead>CNPJ</TableHead><TableHead>Contato</TableHead><TableHead>Telefone</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>}
            {!isLoading && data.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum fornecedor</TableCell></TableRow>}
            {data.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.legal_name}</TableCell>
                <TableCell className="text-muted-foreground">{s.tax_id ?? "—"}</TableCell>
                <TableCell>{s.contact_name ?? "—"}</TableCell>
                <TableCell>{s.phone ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setOpen(true); }}><Edit className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Excluir ${s.legal_name}?`)) del.mutate(s.id); }}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
}
