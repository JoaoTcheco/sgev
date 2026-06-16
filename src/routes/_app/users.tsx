import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserCog, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth, roleLabel, type AppRole } from "@/hooks/useAuth";

export const Route = createFileRoute("/_app/users")({
  component: UsersPage,
});

type Row = { id: string; full_name: string; email: string; active: boolean; created_at: string; roles: AppRole[] };

function UsersPage() {
  const auth = useAuth();
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["users-list"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const rolesByUser = new Map<string, AppRole[]>();
      ((roles ?? []) as { user_id: string; role: AppRole }[]).forEach((r) => {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role);
        rolesByUser.set(r.user_id, arr);
      });
      return ((profiles ?? []) as Omit<Row, "roles">[]).map((p) => ({ ...p, roles: rolesByUser.get(p.id) ?? [] }));
    },
    enabled: auth.isAdmin,
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (delErr) throw delErr;
      const { error: insErr } = await supabase.from("user_roles").insert({ user_id: userId, role } as never);
      if (insErr) throw insErr;
    },
    onSuccess: () => { toast.success("Papel atualizado"); qc.invalidateQueries({ queryKey: ["users-list"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!auth.isAdmin) {
    return (
      <div className="space-y-4">
        <Card><CardContent className="pt-6 text-center py-12">
          <ShieldAlert className="h-12 w-12 text-warning mx-auto mb-3" />
          <h2 className="text-xl font-bold">Acesso restrito</h2>
          <p className="text-muted-foreground">Apenas administradores podem gerenciar usuários.</p>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><UserCog className="h-7 w-7" /> Usuários</h1>
        <p className="text-muted-foreground">Gerencie papéis e permissões da equipe</p>
      </div>
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Papel</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>}
            {data.map((u) => {
              const current: AppRole = u.roles.includes("admin") ? "admin" : u.roles.includes("pharmacist") ? "pharmacist" : "cashier";
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell><span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{roleLabel[current]}</span></TableCell>
                  <TableCell>
                    <Select
                      value={current}
                      onValueChange={(v) => setRole.mutate({ userId: u.id, role: v as AppRole })}
                      disabled={u.id === auth.user?.id}
                    >
                      <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">{roleLabel.admin}</SelectItem>
                        <SelectItem value="pharmacist">{roleLabel.pharmacist}</SelectItem>
                        <SelectItem value="cashier">{roleLabel.cashier}</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground mt-4">
          Novos usuários são cadastrados pela tela de criar conta. Você pode então ajustar o papel deles aqui.
        </p>
      </CardContent></Card>
    </div>
  );
}
