import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Loader2 } from "lucide-react";
import { listAccounts30d } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatMZN, formatDateTime } from "@/lib/format";

import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/contas")({
  head: () => ({ meta: [{ title: "Contas — PharmaSys" }] }),
  component: () => <RoleGate allow={["admin", "pharmacist"]}><ContasPage /></RoleGate>,
});


const LABELS: Record<string, string> = {
  cash: "Numerário",
  debit: "Cartão Débito",
  credit: "Cartão Crédito",
  pix: "M-Pesa / e-Mola",
  other: "Outro",
};

function ContasPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["accounts-30d"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("sales")
        .select("id, sale_number, total, payment_method, created_at, status")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const totals = new Map<string, number>();
      for (const s of data ?? []) totals.set(s.payment_method, (totals.get(s.payment_method) ?? 0) + Number(s.total));
      const grand = (data ?? []).reduce((s, x) => s + Number(x.total), 0);
      return { rows: data ?? [], totals: [...totals.entries()], grand };
    },
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total a receber/recebido (30d)</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatMZN(data?.grand ?? 0)}</div></CardContent>
        </Card>
        {data?.totals.map(([k, v]) => (
          <Card key={k}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{LABELS[k] ?? k}</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-semibold">{formatMZN(v)}</div></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Últimos lançamentos</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.rows.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">#{s.sale_number}</TableCell>
                  <TableCell className="text-sm">{formatDateTime(s.created_at)}</TableCell>
                  <TableCell className="text-sm">{LABELS[s.payment_method] ?? s.payment_method}</TableCell>
                  <TableCell><Badge variant={s.status === "completed" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
                  <TableCell className="text-right font-semibold">{formatMZN(s.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
