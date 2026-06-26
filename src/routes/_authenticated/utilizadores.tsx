import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Users, Loader2, UserPlus, KeyRound, ShieldCheck, ShieldOff, Lock, Pencil, Trash2, History,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDateTime } from "@/lib/format";
import { useAuthUser, useUserRoles, highestRole, roleLabel, type AppRole } from "@/hooks/use-auth";
import {
  adminCreateUser, adminResetPassword, adminUpdateUser, adminDeleteUser,
} from "@/lib/admin-users.functions";
import { isDesktop, desktop } from "@/lib/desktop";
import {
  listAdminUsers, adminSetUserRole, adminSetUserActive, listAdminAuditLogs,
  type AdminUserRow,
} from "@/lib/db";
import { getDesktopUser } from "@/hooks/use-desktop-auth";

export const Route = createFileRoute("/_authenticated/utilizadores")({
  head: () => ({ meta: [{ title: "Utilizadores — PharmaSys" }] }),
  component: UtilizadoresPage,
});

type UserRow = AdminUserRow;

const ROLES: AppRole[] = ["admin", "pharmacist", "cashier"];

// Wrappers que escolhem entre server-fn (web) e desktop bridge (Electron).
function useAdminFns() {
  const createWeb = useServerFn(adminCreateUser);
  const resetWeb = useServerFn(adminResetPassword);
  const updateWeb = useServerFn(adminUpdateUser);
  const deleteWeb = useServerFn(adminDeleteUser);

  const actor = () => {
    const id = getDesktopUser()?.id;
    if (!id) throw new Error("Sessão desktop inválida");
    return id;
  };

  return {
    create: (data: { email: string; password: string; full_name: string; role: AppRole }) =>
      isDesktop()
        ? desktop.admin.createUser({ actor_id: actor(), ...data })
        : createWeb({ data }),
    reset: (data: { user_id: string; password: string }) =>
      isDesktop()
        ? desktop.admin.resetPassword({ actor_id: actor(), ...data })
        : resetWeb({ data }),
    update: (data: { user_id: string; full_name?: string; email?: string }) =>
      isDesktop()
        ? desktop.admin.updateUser({ actor_id: actor(), ...data })
        : updateWeb({ data }),
    remove: (data: { user_id: string }) =>
      isDesktop()
        ? desktop.admin.deleteUser({ actor_id: actor(), ...data })
        : deleteWeb({ data }),
  };
}

function UtilizadoresPage() {
  const { user } = useAuthUser();
  const { data: myRoles = [] } = useUserRoles(user?.id);
  const isAdmin = highestRole(myRoles) === "admin";
  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ["users-admin", isDesktop() ? "desktop" : "web"],
    queryFn: () => listAdminUsers(),
  });

  const adminCount = data.filter((u) => u.roles.includes("admin")).length;

  const fns = useAdminFns();

  const [createOpen, setCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users-admin"] });

  const setRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AppRole }) => adminSetUserRole(userId, role),
    onSuccess: () => { toast.success("Perfil atualizado"); invalidate(); },
    onError: (e: Error) => toast.error("Falha ao alterar perfil", { description: e.message }),
  });

  const setActive = useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) => adminSetUserActive(userId, active),
    onSuccess: (_d, v) => { toast.success(v.active ? "Utilizador ativado" : "Utilizador desativado"); invalidate(); },
    onError: (e: Error) => toast.error("Falha", { description: e.message }),
  });

  const deleteMut = useMutation({
    mutationFn: (userId: string) => fns.remove({ user_id: userId }),
    onSuccess: () => { toast.success("Utilizador eliminado"); setDeleteUser(null); invalidate(); },
    onError: (e: Error) => toast.error("Falha ao eliminar", { description: e.message }),
  });

  if (!isAdmin) {
    return (
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent className="flex items-center gap-2 py-6 text-sm">
          <Lock className="h-5 w-5" /> Apenas administradores podem aceder a esta página.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Utilizadores</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.length} utilizadores · {adminCount} administrador(es)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAuditOpen(true)}>
              <History className="mr-2 h-4 w-4" /> Auditoria
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button><UserPlus className="mr-2 h-4 w-4" /> Novo utilizador</Button>
              </DialogTrigger>
              <CreateUserDialog onClose={() => setCreateOpen(false)} createFn={fns.create} onCreated={invalidate} />
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Criado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((u) => {
                  const top = highestRole(u.roles);
                  const isSelf = u.id === user?.id;
                  const isLastAdmin = top === "admin" && adminCount <= 1;
                  return (
                    <TableRow key={u.id} className={!u.active ? "opacity-60" : ""}>
                      <TableCell className="font-medium">
                        {u.full_name ?? "—"}
                        {isSelf && <Badge variant="outline" className="ml-2 text-[10px]">Você</Badge>}
                      </TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell>
                        <Select
                          value={top ?? ""}
                          onValueChange={(v) => setRole.mutate({ userId: u.id, role: v as AppRole })}
                          disabled={isSelf || isLastAdmin || setRole.isPending}
                        >
                          <SelectTrigger className="h-8 w-[150px]"><SelectValue placeholder="Sem perfil" /></SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {u.active ? (
                            <Badge className="bg-emerald-600/15 text-emerald-700 hover:bg-emerald-600/20"><ShieldCheck className="mr-1 h-3 w-3" /> Ativo</Badge>
                          ) : (
                            <Badge variant="secondary"><ShieldOff className="mr-1 h-3 w-3" /> Desativado</Badge>
                          )}
                          <Switch
                            checked={u.active}
                            disabled={isSelf || isLastAdmin || setActive.isPending}
                            onCheckedChange={(checked) => setActive.mutate({ userId: u.id, active: checked })}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDateTime(u.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setEditUser(u)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setResetUser(u)} disabled={isSelf}>
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteUser(u)}
                            disabled={isSelf || isLastAdmin}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!resetUser} onOpenChange={(o) => !o && setResetUser(null)}>
        <ResetPasswordDialog user={resetUser} resetFn={fns.reset} onClose={() => setResetUser(null)} />
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <EditUserDialog user={editUser} updateFn={fns.update} onClose={() => setEditUser(null)} onSaved={invalidate} />
      </Dialog>

      <AlertDialog open={!!deleteUser} onOpenChange={(o) => !o && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar utilizador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente. <strong>{deleteUser?.full_name ?? deleteUser?.email}</strong> perderá
              imediatamente o acesso. Movimentos e vendas anteriores permanecem no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => { e.preventDefault(); if (deleteUser) deleteMut.mutate(deleteUser.id); }}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <AuditDialog open={auditOpen} />
      </Dialog>
    </div>
  );
}

type CreateFn = (data: { email: string; password: string; full_name: string; role: AppRole }) => Promise<unknown>;
type ResetFn = (data: { user_id: string; password: string }) => Promise<unknown>;
type UpdateFn = (data: { user_id: string; full_name?: string; email?: string }) => Promise<unknown>;

function CreateUserDialog({ onClose, createFn, onCreated }: { onClose: () => void; createFn: CreateFn; onCreated: () => void }) {
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "cashier" as AppRole });
  const mut = useMutation({
    mutationFn: () => createFn(form),
    onSuccess: () => { toast.success("Utilizador criado", { description: form.email }); onCreated(); onClose(); },
    onError: (e: Error) => toast.error("Falha ao criar", { description: e.message }),
  });
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Novo utilizador</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Nome completo</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
        <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><Label>Palavra-passe inicial</Label><Input type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
        <div>
          <Label>Perfil</Label>
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending || !form.email || form.password.length < 8 || !form.full_name}>
          {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Criar utilizador
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function EditUserDialog({ user, updateFn, onClose, onSaved }: {
  user: UserRow | null;
  updateFn: ReturnType<typeof useServerFn<typeof adminUpdateUser>>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");


  const mut = useMutation({
    mutationFn: () => updateFn({
      data: {
        user_id: user!.id,
        full_name: fullName !== user?.full_name ? fullName : undefined,
        email: email !== user?.email ? email : undefined,
      },
    }),
    onSuccess: () => { toast.success("Utilizador atualizado"); onSaved(); onClose(); },
    onError: (e: Error) => toast.error("Falha ao atualizar", { description: e.message }),
  });
  if (!user) return null;
  const changed = fullName !== (user.full_name ?? "") || email !== (user.email ?? "");
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Editar utilizador</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Nome completo</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
        <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending || !changed || fullName.length < 2 || !email.includes("@")}>
          {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ResetPasswordDialog({ user, resetFn, onClose }: { user: UserRow | null; resetFn: ReturnType<typeof useServerFn<typeof adminResetPassword>>; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const mut = useMutation({
    mutationFn: () => resetFn({ data: { user_id: user!.id, password } }),
    onSuccess: () => { toast.success("Palavra-passe redefinida"); setPassword(""); onClose(); },
    onError: (e: Error) => toast.error("Falha", { description: e.message }),
  });
  if (!user) return null;
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Redefinir palavra-passe</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">Utilizador: <strong>{user.full_name ?? user.email}</strong></p>
      <div>
        <Label>Nova palavra-passe</Label>
        <Input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending || password.length < 8}>
          {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Redefinir
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function AuditDialog({ open }: { open: boolean }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["audit-users"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, user_id, entity_id, action, details, created_at")
        .eq("entity", "user")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>Auditoria de utilizadores</DialogTitle></DialogHeader>
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : data.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Sem registos.</p>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-xs">{formatDateTime(l.created_at)}</TableCell>
                  <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {l.details ? JSON.stringify(l.details) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DialogContent>
  );
}
