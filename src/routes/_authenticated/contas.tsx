import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, CheckCircle2, Wallet, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoleGate } from "@/components/role-gate";
import { useAuthUser, useUserRoles, highestRole } from "@/hooks/use-auth";
import { formatMZN, formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/contas")({
  head: () => ({ meta: [{ title: "Contas — PharmaSys" }] }),
  component: () => <RoleGate allow={["admin", "pharmacist"]}><ContasPage /></RoleGate>,
});

type Kind = "payable" | "receivable";
type Status = "pending" | "paid" | "overdue" | "cancelled";

interface Account {
  id: string;
  kind: Kind;
  description: string;
  party: string | null;
  amount: number;
  due_date: string | null;
  paid_at: string | null;
  payment_method: string | null;
  status: Status;
  notes: string | null;
  supplier_id: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<Status, string> = {
  pending: "Pendente",
  paid: "Paga",
  overdue: "Vencida",
  cancelled: "Cancelada",
};
const STATUS_VARIANT: Record<Status, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  paid: "default",
  overdue: "destructive",
  cancelled: "outline",
};

function emptyForm(): Partial<Account> {
  return {
    kind: "payable",
    description: "",
    party: "",
    amount: 0,
    due_date: "",
    payment_method: "",
    status: "pending",
    notes: "",
    supplier_id: null,
  };
}

function ContasPage() {
  const qc = useQueryClient();
  const { user } = useAuthUser();
  const { data: roles = [] } = useUserRoles(user?.id);
  const isAdmin = highestRole(roles) === "admin";

  const [tab, setTab] = useState<"all" | Kind>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState<Partial<Account>>(emptyForm());

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["financial-accounts"],
    queryFn: async (): Promise<Account[]> => {
      const { data, error } = await supabase
        .from("financial_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Account[];
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers-list"],
    queryFn: async () => {
      const { data } = await supabase.from("suppliers").select("id, name").order("name");
      return data ?? [];
    },
  });

  const filtered = useMemo(
    () => (tab === "all" ? accounts : accounts.filter((a) => a.kind === tab)),
    [accounts, tab]
  );

  const stats = useMemo(() => {
    const pending = accounts.filter((a) => a.status === "pending" || a.status === "overdue");
    const payable = pending.filter((a) => a.kind === "payable").reduce((s, a) => s + Number(a.amount), 0);
    const receivable = pending.filter((a) => a.kind === "receivable").reduce((s, a) => s + Number(a.amount), 0);
    const overdue = accounts.filter((a) => a.status === "overdue").length;
    return { payable, receivable, overdue, balance: receivable - payable };
  }, [accounts]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        kind: form.kind as Kind,
        description: (form.description ?? "").trim(),
        party: form.party?.trim() || null,
        amount: Number(form.amount ?? 0),
        due_date: form.due_date || null,
        payment_method: form.payment_method?.trim() || null,
        status: form.status as Status,
        notes: form.notes?.trim() || null,
        supplier_id: form.supplier_id || null,
        paid_at: form.status === "paid" ? (form.paid_at ?? new Date().toISOString()) : null,
      };
      if (!payload.description) throw new Error("Descrição é obrigatória");
      if (payload.amount <= 0) throw new Error("Valor deve ser maior que zero");

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
      setOpen(false);
      setEditing(null);
      setForm(emptyForm());
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao gravar"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conta eliminada");
      qc.invalidateQueries({ queryKey: ["financial-accounts"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao eliminar"),
  });

  const markPaid = useMutation({
    mutationFn: async (a: Account) => {
      const { error } = await supabase
        .from("financial_accounts")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", a.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Conta marcada como paga");
      qc.invalidateQueries({ queryKey: ["financial-accounts"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }
  function openEdit(a: Account) {
    setEditing(a);
    setForm({ ...a, due_date: a.due_date ?? "" });
    setOpen(true);
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="A pagar (pendente)" value={formatMZN(stats.payable)} icon={<TrendingDown className="h-4 w-4 text-destructive" />} />
        <StatCard label="A receber (pendente)" value={formatMZN(stats.receivable)} icon={<TrendingUp className="h-4 w-4 text-primary" />} />
        <StatCard label="Saldo previsto" value={formatMZN(stats.balance)} icon={<Wallet className="h-4 w-4 text-primary" />} />
        <StatCard label="Contas vencidas" value={String(stats.overdue)} icon={<Clock className="h-4 w-4 text-destructive" />} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Contas a pagar e a receber</CardTitle>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "Crie, edite, marque como paga ou elimine contas." : "Apenas o administrador pode criar ou editar."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="payable">A pagar</TabsTrigger>
                <TabsTrigger value="receivable">A receber</TabsTrigger>
              </TabsList>
            </Tabs>
            {isAdmin && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreate}><Plus className="h-4 w-4" /> Nova conta</Button>
                </DialogTrigger>
                <AccountDialog
                  form={form}
                  setForm={setForm}
                  suppliers={suppliers as any}
                  editing={!!editing}
                  onSubmit={() => save.mutate()}
                  saving={save.isPending}
                />
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Contraparte</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[160px] text-right">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">Sem contas registadas.</TableCell></TableRow>
              )}
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Badge variant={a.kind === "payable" ? "destructive" : "default"}>
                      {a.kind === "payable" ? "A pagar" : "A receber"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{a.description}</div>
                    {a.notes && <div className="text-xs text-muted-foreground line-clamp-1">{a.notes}</div>}
                  </TableCell>
                  <TableCell className="text-sm">{a.party ?? "—"}</TableCell>
                  <TableCell className="text-sm">{a.due_date ? new Date(a.due_date).toLocaleDateString("pt-PT") : "—"}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[a.status]}>{STATUS_LABEL[a.status]}</Badge></TableCell>
                  <TableCell className="text-right font-semibold">{formatMZN(Number(a.amount))}</TableCell>
                  <TableCell className="text-right">
                    {isAdmin ? (
                      <div className="flex justify-end gap-1">
                        {a.status !== "paid" && (
                          <Button size="icon" variant="ghost" title="Marcar como paga" onClick={() => markPaid.mutate(a)}>
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" title="Editar" onClick={() => openEdit(a)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" title="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eliminar conta?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acção é irreversível. A conta "{a.description}" será removida.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => remove.mutate(a.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Só leitura</span>
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

function AccountDialog({
  form, setForm, suppliers, editing, onSubmit, saving,
}: {
  form: Partial<Account>;
  setForm: (f: Partial<Account>) => void;
  suppliers: { id: string; name: string }[];
  editing: boolean;
  onSubmit: () => void;
  saving: boolean;
}) {
  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>{editing ? "Editar conta" : "Nova conta"}</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Tipo</Label>
          <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as Kind })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="payable">A pagar</SelectItem>
              <SelectItem value="receivable">A receber</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Estado</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Paga</SelectItem>
              <SelectItem value="overdue">Vencida</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Descrição *</Label>
          <Input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Compra de Paracetamol — Fornecedor X" />
        </div>
        <div className="space-y-1">
          <Label>Contraparte</Label>
          <Input value={form.party ?? ""} onChange={(e) => setForm({ ...form, party: e.target.value })} placeholder="Nome do fornecedor / cliente" />
        </div>
        <div className="space-y-1">
          <Label>Fornecedor (opcional)</Label>
          <Select value={form.supplier_id ?? "none"} onValueChange={(v) => setForm({ ...form, supplier_id: v === "none" ? null : v })}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Nenhum —</SelectItem>
              {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Valor (MZN) *</Label>
          <Input type="number" step="0.01" min="0" value={form.amount ?? 0} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
        </div>
        <div className="space-y-1">
          <Label>Vencimento</Label>
          <Input type="date" value={form.due_date ?? ""} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Método de pagamento</Label>
          <Input value={form.payment_method ?? ""} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} placeholder="Numerário, transferência, M-Pesa..." />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Notas</Label>
          <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onSubmit} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {editing ? "Guardar alterações" : "Criar conta"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
