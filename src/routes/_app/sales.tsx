import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Receipt } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { ReceiptDialog } from "@/components/ReceiptDialog";

export const Route = createFileRoute("/_app/sales")({
  component: SalesPage,
});

const PAYMENT_LABEL: Record<string, string> = {
  cash: "Dinheiro", debit: "Débito", credit: "Crédito", pix: "PIX", other: "Outro",
};

function SalesPage() {
  const [receiptSaleId, setReceiptSaleId] = useState<string | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["sales-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, customers(full_name), sale_items(id, quantity)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Histórico de vendas</h1>
        <p className="text-muted-foreground">Últimas 200 vendas registradas. Clique em "Recibo" para imprimir, salvar PDF ou compartilhar.</p>
      </div>
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow>
            <TableHead>#</TableHead><TableHead>Data</TableHead><TableHead>Cliente</TableHead>
            <TableHead className="text-right">Itens</TableHead><TableHead>Pagamento</TableHead>
            <TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead>
            <TableHead className="text-right">Recibo</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>}
            {!isLoading && data.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma venda registrada</TableCell></TableRow>}
            {data.map((s: { id: string; sale_number: number; created_at: string; customers: { full_name: string } | null; sale_items: { id: string; quantity: number }[]; payment_method: string; total: number; status: string }) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono">#{s.sale_number}</TableCell>
                <TableCell>{formatDateTime(s.created_at)}</TableCell>
                <TableCell>{s.customers?.full_name ?? "—"}</TableCell>
                <TableCell className="text-right">{s.sale_items?.reduce((a, i) => a + i.quantity, 0) ?? 0}</TableCell>
                <TableCell>{PAYMENT_LABEL[s.payment_method] ?? s.payment_method}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(s.total)}</TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === "completed" ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}`}>
                    {s.status === "completed" ? "Concluída" : "Cancelada"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => setReceiptSaleId(s.id)}>
                    <Receipt className="h-4 w-4" /> Ver
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>

      <ReceiptDialog
        saleId={receiptSaleId}
        open={!!receiptSaleId}
        onOpenChange={(o) => { if (!o) setReceiptSaleId(null); }}
      />
    </div>
  );
}
