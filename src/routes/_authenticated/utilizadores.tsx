import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";
import { roleLabel } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/utilizadores")({
  head: () => ({ meta: [{ title: "Utilizadores — PharmaSys" }] }),
  component: UtilizadoresPage,
});

function UtilizadoresPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const { data: roles, error: rErr } = await supabase.from("user_roles").select("user_id, role");
      if (rErr) throw rErr;
      const map = new Map<string, string[]>();
      for (const r of roles ?? []) {
        const list = map.get(r.user_id) ?? [];
        list.push(r.role);
        map.set(r.user_id, list);
      }
      return (profiles ?? []).map((p) => ({ ...p, roles: map.get(p.id) ?? [] }));
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Utilizadores</CardTitle>
        <p className="text-sm text-muted-foreground">Equipa registada e respetivos perfis de acesso.</p>
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
                <TableHead>Perfis</TableHead>
                <TableHead>Criado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.length === 0 ? <span className="text-xs text-muted-foreground">sem perfil</span> :
                        u.roles.map((r: string) => <Badge key={r} variant="outline">{roleLabel(r as any)}</Badge>)}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(u.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
