import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, Loader2, UserPlus, KeyRound, ShieldCheck, ShieldOff, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/format";
import { useAuthUser, useUserRoles, highestRole, roleLabel, type AppRole } from "@/hooks/use-auth";
import { adminCreateUser, adminResetPassword } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/_authenticated/utilizadores")({
  head: () => ({ meta: [{ title: "Utilizadores — PharmaSys" }] }),
  component: UtilizadoresPage,
});

type UserRow = {
  id: string; full_name: string | null; email: string | null;
  active: boolean; created_at: string; roles: AppRole[];
};

const ROLES: AppRole[] = ["admin", "pharmacist", "cashier"];

function UtilizadoresPage() {
  const { user } = useAuthUser();
  const { data: myRoles = [] } = useUserRoles(user?.id);
  const isAdmin = highestRole(myRoles) === "admin";
  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ["users-admin"],
    queryFn: async () => {
      const [{ data: profiles, error }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, active, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (error) throw error;
      if (rErr) throw rErr;
      const map = new Map<string, AppRole[]>();
      for (const r of roles ?? []) {
        const list = map.get(r.user_id) ?? [];
        list.push(r.role as AppRole);
        map.set(r.user_id, list);
      }
      return (profiles ?? []).map((p: any) => ({ ...p, roles: map.get(p.id) ?? [] }));
    },
  });

  const createFn = useServerFn(adminCreateUser);
  const resetFn = useServerFn(adminResetPassword);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState<UserRow | null>(null);

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.rpc("admin_set_user_role", { p_user_id: userId, p_role: role });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Perfil atualizado"); queryClient.invalidateQueries({ queryKey: ["users-admin"] }); },
    onError: (e: Error) => toast.error("Falha ao alterar perfil", { description: e.message }),
  });

  const setActive = useMutation({
    mutationFn: async ({ userId, active }: { userId: string; active: boolean }) => {
      const { error } = await supabase.rpc("admin_set_user_active", { p_user_id: userId, p_active: active });
      if (error) throw error;
    },
    onSuccess: (_d, v) => { toast.success(v.active ? "Utilizador ativado" : "Utilizador desativado"); queryClient.invalidateQueries({ queryKey: ["users-admin"] }); },
    onError: (e: Error) => toast.error("Falha", { description: e.message }),
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Utilizadores</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Crie, atribua perfis e ative/desative membros da equipa.</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="mr-2 h-4 w-4" /> Novo utilizador</Button>
            </DialogTrigger>
            <CreateUserDialog onClose={() => setCreateOpen(false)} createFn={createFn} onCreated={() => queryClient.invalidateQueries({ queryKey: ["users-admin"] })} />
          </Dialog>
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
                  return (
                    <TableRow key={u.id} className={!u.active ? "opacity-60" : ""}>
                      <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell>
                        <Select
                          value={top ?? ""}
                          onValueChange={(v) => setRole.mutate({ userId: u.id, role: v as AppRole })}
                          disabled={isSelf || setRole.isPending}
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
                            disabled={isSelf || setActive.isPending}
                            onCheckedChange={(checked) => setActive.mutate({ userId: u.id, active: checked })}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDateTime(u.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setResetUser(u)} disabled={isSelf}>
                          <KeyRound className="mr-1 h-4 w-4" /> Senha
                        </Button>
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
        <ResetPasswordDialog user={resetUser} resetFn={resetFn} onClose={() => setResetUser(null)} />
      </Dialog>
    </div>
  );
}

function CreateUserDialog({ onClose, createFn, onCreated }: { onClose: () => void; createFn: ReturnType<typeof useServerFn<typeof adminCreateUser>>; onCreated: () => void }) {
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "cashier" as AppRole });
  const mut = useMutation({
    mutationFn: () => createFn({ data: form }),
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
