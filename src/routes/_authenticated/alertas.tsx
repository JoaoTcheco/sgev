import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { listAlerts, refreshAlerts, resolveAlert } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/alertas")({
  head: () => ({ meta: [{ title: "Alertas — PharmaSys" }] }),
  component: AlertasPage,
});

const TYPE_LABEL: Record<string, string> = {
  low_stock: "Estoque baixo",
  near_expiry: "Próximo a vencer",
  expired: "Vencido",
};

function AlertasPage() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => listAlerts(),
  });

  const refresh = useMutation({
    mutationFn: () => refreshAlerts(),
    onSuccess: () => {
      toast.success("Alertas atualizados");
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (e: Error) => toast.error("Falha", { description: e.message }),
  });

  const resolve = useMutation({
    mutationFn: (id: string) => resolveAlert(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  function sevColor(s: string) {
    if (s === "critical") return "destructive";
    if (s === "warning") return "default";
    return "secondary";
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Alertas</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Estoque mínimo, validade próxima e produtos vencidos.</p>
        </div>
        <Button variant="outline" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
          {refresh.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Recalcular
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sem alertas ativos. Tudo em ordem.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severidade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Criado</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell><Badge variant={sevColor(a.severity) as any}>{a.severity}</Badge></TableCell>
                  <TableCell className="text-sm">{TYPE_LABEL[a.type] ?? a.type}</TableCell>
                  <TableCell className="text-sm">{a.message}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => resolve.mutate(a.id)}>
                      <Check className="mr-1 h-3 w-3" /> Resolver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
