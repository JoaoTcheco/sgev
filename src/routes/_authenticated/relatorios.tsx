import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Download } from "lucide-react";
import { listReportSales30d } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMZN, formatDate } from "@/lib/format";

import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — PharmaSys" }] }),
  component: () => <RoleGate allow={["admin"]}><RelatoriosPage /></RoleGate>,
});


function RelatoriosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["report-sales-30d"],
    queryFn: async () => {
      const items = (await listReportSales30d()) as Array<{ product_name: string; quantity: number; total: number | string }>;
      const agg = new Map<string, { qty: number; total: number }>();
      for (const i of items) {
        const cur = agg.get(i.product_name) ?? { qty: 0, total: 0 };
        agg.set(i.product_name, { qty: cur.qty + i.quantity, total: cur.total + Number(i.total) });
      }
      return [...agg.entries()].map(([n, v]) => ({ name: n, ...v })).sort((a, b) => b.total - a.total);
    },
  });

  function downloadCSV() {
    if (!data) return;
    const lines = ["Produto;Quantidade;Total"];
    for (const r of data) lines.push(`${r.name};${r.qty};${r.total.toFixed(2)}`);
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-vendas-${formatDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Relatório de vendas (últimos 30 dias)</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Resumo por produto, com quantidade e receita.</p>
        </div>
        <Button variant="outline" onClick={downloadCSV} disabled={!data || data.length === 0}>
          <Download className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Receita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((r) => (
                <TableRow key={r.name}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right">{r.qty}</TableCell>
                  <TableCell className="text-right font-semibold">{formatMZN(r.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
