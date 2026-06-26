import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Loader2, Plus, Pencil, Trash2, Wallet, TrendingUp, TrendingDown,
  RotateCcw, History, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { RoleGate } from "@/components/role-gate";
import { useAuthUser, useUserRoles, highestRole } from "@/hooks/use-auth";
import { formatMZN, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/contas")({
  head: () => ({ meta: [{ title: "Contas — PharmaSys" }] }),
  component: () => <RoleGate allow={["admin", "pharmacist"]}><ContasPage /></RoleGate>,
});

interface Account {
  id: string;
  name: string;
  notes: string | null;
  is_system: boolean;
  active: boolean;
  balance: number;
  created_at: string;
}

interface Movement {
  id: string;
  account_id: string;
  type: "credit" | "debit" | "reset";
  amount: number;
  reason: string | null;
  sale_id: string | null;
  created_at: string;
}

const MOVE_LABEL: Record<Movement["type"], string> = {
  credit: "Entrada",
  debit: "Saída",
  reset: "Zeragem",
};

function ContasPage() {
  const qc = useQueryClient();
  const { user } = useAuthUser();
  const { data: roles = [] } = useUserRoles(user?.id);
  const isAdmin = highestRole(roles) === "admin";

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState<{ name: string; notes: string; active: boolean }>({
    name: "", notes: "", active: true,
  });

  const [movementsFor, setMovementsFor] = useState<Account | null>(null);
  const [adjustFor, setAdjustFor] = useState<Account | null>(null);
  const [adjType, setAdjType] = useState<"credit" | "debit" | "reset">("debit");
  const [adjAmount, setAdjAmount] = useState<number>(0);
  const [adjReason, setAdjReason] = useState("");

  const accounts = useQuery({
    queryKey: ["financial-accounts"],
    queryFn: async (): Promise<Account[]> => {
      const { data, error } = await supabase
        .from("financial_accounts")
        .select("id, name, notes, is_system, active, balance, created_at")
        .order("is_system", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as Account[];
    },
  });

  const movements = useQuery({
    queryKey: ["account-movements", movementsFor?.id],
    enabled: !!movementsFor,
    queryFn: async (): Promise<Movement[]> => {
      const { data, error } = await supabase
        .from("account_movements")
        .select("id, account_id, type, amount, reason, sale_id, created_at")
        .eq("account_id", movementsFor!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as Movement[];
    },
  });

  const totals = useMemo(() => {
    const list = accounts.data ?? [];
    return {
      count: list.length,
      total: list.reduce((s, a) => s + Number(a.balance), 0),
      caixa: list.find((a) => a.is_system)?.balance ?? 0,
    };
  }, [accounts.data]);

  const save = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      if (!name) throw new Error("Nome é obrigatório");
      const payload = { name, notes: form.notes.trim() || null, active: form.active };
      if (editing) {
        const { error } = await supabase.from("financial_accounts").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("financial_accounts").insert({ ...payload, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Conta actualizada" : "Conta criada");
      qc.invalidateQueries({ queryKey: ["financial-accounts"] });
      setCreateOpen(false); setEditing(null);
      setForm({ name: "", notes: "", active: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("delete_account", { p_account_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conta eliminada");
      qc.invalidateQueries({ queryKey: ["financial-accounts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const adjust = useMutation({
    mutationFn: async () => {
      if (!adjustFor) return;
      const { error } = await supabase.rpc("adjust_account", {
        p_account_id: adjustFor.id,
        p_type: adjType,
        p_amount: adjType === "reset" ? 0 : Number(adjAmount),
        p_reason: adjReason.trim() || "",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ajuste aplicado");
      qc.invalidateQueries({ queryKey: ["financial-accounts"] });
      qc.invalidateQueries({ queryKey: ["account-movements"] });
      setAdjustFor(null); setAdjAmount(0); setAdjReason(""); setAdjType("debit");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openCreate() {
    setEditing(null);
    setForm({ name: "", notes: "", active: true });
    setCreateOpen(true);
  }
  function openEdit(a: Account) {
    setEditing(a);
    setForm({ name: a.name, notes: a.notes ?? "", active: a.active });
    setCreateOpen(true);
  }
  function openAdjust(a: Account, type: "debit" | "reset" | "credit" = "debit") {
    setAdjustFor(a); setAdjType(type); setAdjAmount(0); setAdjReason("");
  }

  if (accounts.isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Saldo total" value={formatMZN(totals.total)} icon={<Wallet className="h-4 w-4 text-primary" />} />
        <StatCard label="Saldo em Caixa" value={formatMZN(Number(totals.caixa))} icon={<TrendingUp className="h-4 w-4 text-emerald-600" />} />
        <StatCard label="Contas activas" value={String(totals.count)} icon={<ShieldCheck className="h-4 w-4 text-primary" />} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Contas de entrada</CardTitle>
            <p className="text-xs text-muted-foreground">
              Cada conta acumula o dinheiro das vendas. No PDV o operador escolhe onde entra o valor.
              A conta <strong>Caixa</strong> é do sistema — pode ser zerada ou ajustada, mas nunca eliminada.
            </p>
          </div>
          {isAdmin && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nova conta</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editing ? "Editar conta" : "Nova conta"}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Nome *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: M-Pesa, BCI, e-Mola" disabled={editing?.is_system} />
                  </div>
                  <div className="space-y-1">
                    <Label>Notas</Label>
                    <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                  <div className="flex items-center justify-between rounded-md border p-2">
                    <Label className="text-sm">Activa (visível no PDV)</Label>
                    <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => save.mutate()} disabled={save.isPending}>
                    {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {editing ? "Guardar" : "Criar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Conta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="w-[280px] text-right">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(accounts.data ?? []).map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{a.name}</span>
                      {a.is_system && <Badge variant="secondary" className="text-[10px]">SISTEMA</Badge>}
                    </div>
                    {a.notes && <div className="text-xs text-muted-foreground">{a.notes}</div>}
                  </TableCell>
                  <TableCell>
                    {a.active
                      ? <Badge className="bg-emerald-600/15 text-emerald-700">Activa</Badge>
                      : <Badge variant="outline">Inactiva</Badge>}
                  </TableCell>
                  <TableCell className="text-right text-base font-semibold">{formatMZN(Number(a.balance))}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setMovementsFor(a)}>
                        <History className="h-4 w-4" /> Movimentos
                      </Button>
                      {isAdmin && (
                        <>
                          <Button size="sm" variant="ghost" title="Subtrair" onClick={() => openAdjust(a, "debit")}>
                            <TrendingDown className="h-4 w-4 text-destructive" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Zerar" onClick={() => openAdjust(a, "reset")}>
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" title="Editar" onClick={() => openEdit(a)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {!a.is_system && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" title="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Eliminar conta "{a.name}"?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acção é irreversível e removerá o histórico de movimentos desta conta.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => remove.mutate(a.id)}>Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Adjust dialog */}
      <Dialog open={!!adjustFor} onOpenChange={(o) => !o && setAdjustFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Ajustar conta {adjustFor?.name} — saldo {formatMZN(Number(adjustFor?.balance ?? 0))}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {(["debit","credit","reset"] as const).map((t) => (
                <button key={t}
                  onClick={() => setAdjType(t)}
                  className={`rounded-md border p-2 text-sm ${adjType===t ? "border-primary bg-primary/5 font-semibold" : ""}`}>
                  {t === "debit" ? "Subtrair" : t === "credit" ? "Adicionar" : "Zerar"}
                </button>
              ))}
            </div>
            {adjType !== "reset" && (
              <div className="space-y-1">
                <Label>Valor (MZN)</Label>
                <Input type="number" min="0" step="0.01" value={adjAmount || ""} onChange={(e) => setAdjAmount(Number(e.target.value))} />
              </div>
            )}
            <div className="space-y-1">
              <Label>Motivo</Label>
              <Input value={adjReason} onChange={(e) => setAdjReason(e.target.value)} placeholder="Ex: Levantamento, depósito, fundo de troco..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAdjustFor(null)}>Cancelar</Button>
            <Button onClick={() => adjust.mutate()} disabled={adjust.isPending}>
              {adjust.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movements dialog */}
      <Dialog open={!!movementsFor} onOpenChange={(o) => !o && setMovementsFor(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Movimentos — {movementsFor?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.isLoading && <TableRow><TableCell colSpan={4} className="text-center py-6"><Loader2 className="inline h-4 w-4 animate-spin" /></TableCell></TableRow>}
                {!movements.isLoading && (movements.data ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-6">Sem movimentos.</TableCell></TableRow>
                )}
                {(movements.data ?? []).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">{formatDateTime(m.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant={m.type === "credit" ? "default" : m.type === "debit" ? "destructive" : "outline"}>
                        {MOVE_LABEL[m.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{m.reason ?? "—"}</TableCell>
                    <TableCell className={`text-right font-semibold ${m.type === "credit" ? "text-emerald-600" : m.type === "debit" ? "text-destructive" : ""}`}>
                      {m.type === "credit" ? "+" : m.type === "debit" ? "−" : ""}{formatMZN(Number(m.amount))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
    </Card>
  );
}
