import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({ meta: [{ title: "Histórico — PharmaSys" }] }),
  component: HistoricoPage,
});

function HistoricoPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const [moves, logs] = await Promise.all([
        supabase.from("stock_movements").select("id, type, quantity, reason, created_at, products(name)").order("created_at", { ascending: false }).limit(50),
        supabase.from("audit_logs").select("id, entity, action, created_at, details").order("created_at", { ascending: false }).limit(50),
      ]);
      if (moves.error) throw moves.error;
      if (logs.error) throw logs.error;
      return { moves: moves.data ?? [], logs: logs.data ?? [] };
    },
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Movimentos de estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead>Quando</TableHead></TableRow></TableHeader>
            <TableBody>
              {data?.moves.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm">{m.products?.name ?? "—"}</TableCell>
                  <TableCell><Badge variant={m.type === "in" ? "default" : "secondary"}>{m.type === "in" ? "Entrada" : m.type === "out" ? "Saída" : m.type}</Badge></TableCell>
                  <TableCell className="text-right">{m.quantity}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(m.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Logs de auditoria</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Entidade</TableHead><TableHead>Ação</TableHead><TableHead>Quando</TableHead></TableRow></TableHeader>
            <TableBody>
              {data?.logs.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">Sem registos.</TableCell></TableRow>
              ) : data?.logs.map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell className="text-sm">{l.entity}</TableCell>
                  <TableCell className="text-sm">{l.action}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(l.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
