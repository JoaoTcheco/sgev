import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, RefreshCw, AlertTriangle, Bell } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/alerts")({
  component: AlertsPage,
});

type Alert = { id: string; type: string; severity: string; message: string; resolved: boolean; created_at: string; product_id: string | null; batch_id: string | null };

function AlertsPage() {
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("alerts").select("*").eq("resolved", false).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Alert[];
    },
  });

  const refresh = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("refresh_alerts");
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Alertas atualizados"); qc.invalidateQueries({ queryKey: ["alerts"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const resolve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alerts").update({ resolved: true } as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["alerts"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); },
  });

  const byType = {
    all: data,
    low_stock: data.filter((a) => a.type === "low_stock"),
    near_expiry: data.filter((a) => a.type === "near_expiry"),
    expired: data.filter((a) => a.type === "expired"),
  };

  const render = (list: Alert[]) => (
    <Card><CardContent className="pt-6">
      {isLoading && <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></div>}
      {!isLoading && list.length === 0 && <p className="text-center py-8 text-muted-foreground">Nenhum alerta nesta categoria.</p>}
      <ul className="space-y-2">
        {list.map((a) => (
          <li key={a.id} className="flex items-center justify-between p-3 rounded-md bg-muted/40">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-4 w-4 ${a.severity === "critical" ? "text-destructive" : a.severity === "warning" ? "text-warning" : "text-muted-foreground"}`} />
              <span className="text-sm">{a.message}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                a.severity === "critical" ? "bg-destructive text-destructive-foreground" :
                a.severity === "warning" ? "bg-warning text-warning-foreground" :
                "bg-secondary text-secondary-foreground"
              }`}>{a.severity}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => resolve.mutate(a.id)}>
              <CheckCircle2 className="h-4 w-4" /> Resolver
            </Button>
          </li>
        ))}
      </ul>
    </CardContent></Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Bell className="h-7 w-7" /> Alertas</h1>
          <p className="text-muted-foreground">Estoque mínimo, vencimento e produtos vencidos</p>
        </div>
        <Button onClick={() => refresh.mutate()} disabled={refresh.isPending}>
          {refresh.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Atualizar alertas
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos ({byType.all.length})</TabsTrigger>
          <TabsTrigger value="low_stock">Estoque baixo ({byType.low_stock.length})</TabsTrigger>
          <TabsTrigger value="near_expiry">Próximos do vencimento ({byType.near_expiry.length})</TabsTrigger>
          <TabsTrigger value="expired">Vencidos ({byType.expired.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">{render(byType.all)}</TabsContent>
        <TabsContent value="low_stock" className="mt-4">{render(byType.low_stock)}</TabsContent>
        <TabsContent value="near_expiry" className="mt-4">{render(byType.near_expiry)}</TabsContent>
        <TabsContent value="expired" className="mt-4">{render(byType.expired)}</TabsContent>
      </Tabs>
    </div>
  );
}
