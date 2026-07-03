import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw, Loader2, Check, PackageX, Clock, CalendarX, Package } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatDateTime } from "@/lib/format";
import { useAuthUser, useUserRoles, highestRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/alertas")({
  head: () => ({ meta: [{ title: "Alertas — PharmaSys" }] }),
  component: AlertasPage,
});

type Alert = {
  id: string;
  type: "low_stock" | "near_expiry" | "expired";
  severity: "critical" | "warning" | "info";
  message: string;
  created_at: string;
  resolved: boolean;
  product_id: string | null;
  batch_id: string | null;
};

const SEV_RANK: Record<string, number> = { critical: 3, warning: 2, info: 1 };

function AlertasPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | "low_stock" | "near_expiry" | "expired">("all");
  const { user } = useAuthUser();
  const { data: roles = [] } = useUserRoles(user?.id);
  // Funcionários (cashier) só visualizam — sem resolver, sem recalcular.
  const canManage = highestRole(roles) !== "cashier";

  const { data = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("id, type, severity, message, created_at, resolved, product_id, batch_id")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as Alert[];
    },
  });

  const refresh = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("refresh_alerts");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Alertas atualizados");
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
    onError: (e: Error) => toast.error("Falha", { description: e.message }),
  });

  const resolve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alerts").update({ resolved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const counts = useMemo(() => ({
    all: data.length,
    low_stock: data.filter((a) => a.type === "low_stock").length,
    near_expiry: data.filter((a) => a.type === "near_expiry").length,
    expired: data.filter((a) => a.type === "expired").length,
    critical: data.filter((a) => a.severity === "critical").length,
  }), [data]);

  const sorted = useMemo(() => {
    const filtered = tab === "all" ? data : data.filter((a) => a.type === tab);
    return [...filtered].sort((a, b) => (SEV_RANK[b.severity] - SEV_RANK[a.severity]) || (b.created_at.localeCompare(a.created_at)));
  }, [data, tab]);

  function sevVariant(s: string): "destructive" | "default" | "secondary" {
    if (s === "critical") return "destructive";
    if (s === "warning") return "default";
    return "secondary";
  }

  function sevLabel(s: string) {
    if (s === "critical") return "Crítico";
    if (s === "warning") return "Atenção";
    return "Info";
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard icon={<AlertTriangle className="h-5 w-5 text-destructive" />} label="Críticos" value={counts.critical} accent="destructive" />
        <SummaryCard icon={<PackageX className="h-5 w-5" />} label="Sem / pouco estoque" value={counts.low_stock} />
        <SummaryCard icon={<Clock className="h-5 w-5" />} label="Próximo do vencimento" value={counts.near_expiry} />
        <SummaryCard icon={<CalendarX className="h-5 w-5 text-destructive" />} label="Vencidos" value={counts.expired} accent="destructive" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Alertas ativos</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Limiares definidos por produto em <Link to="/estoque" className="underline">Estoque</Link>: estoque mínimo e dias de aviso de validade. Vendas de lotes vencidos são bloqueadas automaticamente.
            </p>
          </div>
          <Button variant="outline" onClick={() => refresh.mutate()} disabled={refresh.isPending}>
            {refresh.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Recalcular
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="all">Todos ({counts.all})</TabsTrigger>
              <TabsTrigger value="low_stock">Estoque ({counts.low_stock})</TabsTrigger>
              <TabsTrigger value="near_expiry">Próx. vencimento ({counts.near_expiry})</TabsTrigger>
              <TabsTrigger value="expired">Vencidos ({counts.expired})</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4">
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : sorted.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                  <Check className="h-8 w-8 text-emerald-500" />
                  Nenhum alerta ativo nesta categoria.
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">Severidade</TableHead>
                        <TableHead className="w-40">Tipo</TableHead>
                        <TableHead>Mensagem</TableHead>
                        <TableHead className="w-48">Criado</TableHead>
                        <TableHead className="w-40 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sorted.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell><Badge variant={sevVariant(a.severity)}>{sevLabel(a.severity)}</Badge></TableCell>
                          <TableCell className="text-sm">
                            {a.type === "low_stock" && <span className="inline-flex items-center gap-1"><PackageX className="h-3 w-3" /> Estoque</span>}
                            {a.type === "near_expiry" && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Vencimento</span>}
                            {a.type === "expired" && <span className="inline-flex items-center gap-1 text-destructive"><CalendarX className="h-3 w-3" /> Vencido</span>}
                          </TableCell>
                          <TableCell className="text-sm">{a.message}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {a.product_id && (
                                <Button asChild size="sm" variant="ghost" title="Ver no estoque">
                                  <Link to="/estoque"><Package className="mr-1 h-3 w-3" /> Estoque</Link>
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => resolve.mutate(a.id)}>
                                <Check className="mr-1 h-3 w-3" /> Resolver
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent?: "destructive" }) {
  return (
    <Card className={accent === "destructive" && value > 0 ? "border-destructive/50" : ""}>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${accent === "destructive" && value > 0 ? "text-destructive" : ""}`}>{value}</p>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}
