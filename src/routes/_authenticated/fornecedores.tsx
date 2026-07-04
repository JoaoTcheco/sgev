import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Truck, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import { RoleGate } from "@/components/role-gate";
import { invalidateAfterSupplierChange } from "@/lib/invalidate";

export const Route = createFileRoute("/_authenticated/fornecedores")({
  head: () => ({ meta: [{ title: "Fornecedores — PharmaSys" }] }),
  component: () => <RoleGate allow={["admin", "pharmacist"]}><FornecedoresPage /></RoleGate>,
});


type Supplier = { id: string; legal_name: string; tax_id: string | null; contact_name: string | null; email: string | null; phone: string | null; address: string | null; active: boolean };

function FornecedoresPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [open, setOpen] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("legal_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async (payload: Partial<Supplier>) => {
      if (payload.id) {
        const { error } = await supabase.from("suppliers").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("suppliers").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Fornecedor guardado");
      setOpen(false);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e: Error) => toast.error("Falha", { description: e.message }),
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    save.mutate({
      id: editing?.id,
      legal_name: String(f.get("legal_name") || ""),
      tax_id: (f.get("tax_id") as string) || null,
      contact_name: (f.get("contact_name") as string) || null,
      email: (f.get("email") as string) || null,
      phone: (f.get("phone") as string) || null,
      address: (f.get("address") as string) || null,
      active: f.get("active") === "on",
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" /> Fornecedores</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Distribuidores e parceiros que abastecem a farmácia.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo fornecedor
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>NUIT</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((s: Supplier) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.legal_name}</TableCell>
                  <TableCell className="text-sm">{s.tax_id ?? "—"}</TableCell>
                  <TableCell className="text-sm">{s.contact_name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{s.phone ?? "—"}</TableCell>
                  <TableCell>{s.active ? <Badge>Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar fornecedor" : "Novo fornecedor"}</DialogTitle></DialogHeader>
          <form id="sup-form" className="grid grid-cols-2 gap-3" onSubmit={onSubmit}>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="legal_name">Nome legal</Label>
              <Input id="legal_name" name="legal_name" defaultValue={editing?.legal_name ?? ""} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tax_id">NUIT</Label>
              <Input id="tax_id" name="tax_id" defaultValue={editing?.tax_id ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contact_name">Contacto</Label>
              <Input id="contact_name" name="contact_name" defaultValue={editing?.contact_name ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" defaultValue={editing?.email ?? ""} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" defaultValue={editing?.phone ?? ""} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="address">Morada</Label>
              <Input id="address" name="address" defaultValue={editing?.address ?? ""} />
            </div>
            <label className="col-span-2 flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={editing?.active ?? true} /> Ativo
            </label>
          </form>
          <DialogFooter>
            <Button type="submit" form="sup-form" disabled={save.isPending}>
              {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
