import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Loader2, Printer, Search, ShieldCheck, ShieldAlert, ScanLine } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePharmacySettings } from "@/hooks/use-settings";
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner";
import { formatDateTime } from "@/lib/format";
import { ReceiptBody } from "@/routes/_authenticated/configuracoes";

export const Route = createFileRoute("/_authenticated/recibo/$ref")({
  head: () => ({ meta: [{ title: "Validar Recibo — PharmaSys" }] }),
  component: ReciboPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-sm text-destructive">Erro ao carregar recibo: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6 text-sm">Recibo não encontrado.</div>,
});

const PAYMENT_LABEL: Record<string, string> = {
  cash: "Numerário",
  debit: "Cartão Bancário",
  credit: "Cartão de Crédito",
  pix: "M-Pesa",
  other: "e-Mola",
  bank_transfer: "Transferência",
};

function ReciboPage() {
  const { ref } = Route.useParams();
  const navigate = useNavigate();
  const { data: settings } = usePharmacySettings();
  const [search, setSearch] = useState(ref);

  const { data, isLoading, error } = useQuery({
    queryKey: ["sale-by-ref", ref],
    queryFn: async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);
      const base = supabase
        .from("sales")
        .select("id, receipt_number, created_at, subtotal, discount, total, payment_method, status, user_id, sale_items(id, product_name, quantity, unit_price, total, unit_label, unit_kind)");
      const { data: sale, error } = isUuid
        ? await base.eq("id", ref).maybeSingle()
        : await base.eq("receipt_number", ref).maybeSingle();
      if (error) throw error;
      if (!sale) return null;
      let operator: { full_name: string | null; email: string | null } | null = null;
      if (sale.user_id) {
        const { data: prof } = await supabase.from("profiles").select("full_name, email").eq("id", sale.user_id).maybeSingle();
        operator = prof as any;
      }
      return { ...sale, operator };
    },
  });

  useBarcodeScanner((code) => {
    if (code === ref) return;
    toast.success(`Código lido: ${code}`);
    navigate({ to: "/recibo/$ref", params: { ref: code } });
  }, { minLength: 6 });

  // Automatic integrity validation: items must sum to subtotal, total = subtotal − discount.
  const integrity = useMemo(() => {
    if (!data) return null;
    const items = (data.sale_items ?? []) as Array<{ total: number | string }>;
    const itemsSum = items.reduce((s, i) => s + Number(i.total), 0);
    const subtotal = Number(data.subtotal);
    const discount = Number(data.discount);
    const total = Number(data.total);
    const eps = 0.01;
    const subtotalOk = Math.abs(itemsSum - subtotal) < eps;
    const totalOk = Math.abs(subtotal - discount - total) < eps;
    const statusOk = data.status === "completed";
    return { ok: subtotalOk && totalOk && statusOk, subtotalOk, totalOk, statusOk, itemsSum };
  }, [data]);

  function lookup(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    navigate({ to: "/recibo/$ref", params: { ref: search.trim() } });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/vendas"><ArrowLeft className="mr-1 h-4 w-4" /> Voltar a vendas</Link>
        </Button>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
            <ScanLine className="h-4 w-4 animate-pulse text-emerald-600" /> Leitor ativo — escaneie outro recibo
          </div>
          <form onSubmit={lookup} className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nº do recibo (REC-2026-…)" className="w-72 pl-9" />
            </div>
            <Button type="submit">Procurar</Button>
          </form>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !data ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-center gap-2 py-6 text-sm">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Recibo <code className="rounded bg-background px-1.5 py-0.5">{ref}</code> não encontrado ou inválido.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_460px]">
          <Card className={integrity?.ok ? "border-emerald-500/50" : "border-amber-500/50"}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {integrity?.ok ? (
                  <><ShieldCheck className="h-5 w-5 text-emerald-600" /> Recibo válido e autenticado</>
                ) : (
                  <><ShieldAlert className="h-5 w-5 text-amber-600" /> Recibo com inconsistências</>
                )}
              </CardTitle>
              <Badge variant={data.status === "completed" ? "default" : "secondary"}>{data.status}</Badge>
            </CardHeader>
            {integrity && !integrity.ok && (
              <CardContent className="pt-0">
                <ul className="space-y-1 rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
                  {!integrity.statusOk && <li>• Estado da venda não é “completed”.</li>}
                  {!integrity.subtotalOk && <li>• Soma dos itens ({integrity.itemsSum.toFixed(2)} MT) não bate com o subtotal.</li>}
                  {!integrity.totalOk && <li>• Total não corresponde a Subtotal − Desconto.</li>}
                </ul>
              </CardContent>
            )}
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Número">{data.receipt_number ?? "—"}</Field>
                <Field label="Data">{formatDateTime(new Date(data.created_at))}</Field>
                <Field label="Operador">{(data as any).operator?.full_name ?? (data as any).operator?.email ?? "—"}</Field>
                <Field label="Pagamento">{PAYMENT_LABEL[data.payment_method] ?? data.payment_method}</Field>
                <Field label="Subtotal">{Number(data.subtotal).toFixed(2)} MT</Field>
                <Field label="Desconto">{Number(data.discount).toFixed(2)} MT</Field>
                <Field label="Total" emphasis>{Number(data.total).toFixed(2)} MT</Field>
                <Field label="ID interno"><code className="text-[11px]">{data.id}</code></Field>
              </div>

              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left">Produto</th>
                      <th className="px-3 py-2 text-right">Qtd</th>
                      <th className="px-3 py-2 text-right">Unitário</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.sale_items ?? []).map((it: any) => (
                      <tr key={it.id} className="border-t">
                        <td className="px-3 py-2">
                          <div>{it.product_name}</div>
                          <div className="text-xs text-muted-foreground">{it.unit_label} ({it.unit_kind})</div>
                        </td>
                        <td className="px-3 py-2 text-right">{it.quantity}</td>
                        <td className="px-3 py-2 text-right">{Number(it.unit_price).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-medium">{Number(it.total).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="self-start">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recibo</CardTitle>
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                <Printer className="mr-1 h-4 w-4" /> Imprimir
              </Button>
            </CardHeader>
            <CardContent>
              <div id="print-area" className="flex justify-center overflow-auto rounded-md bg-muted/30 p-3">
                {settings && (
                  <ReceiptBody
                    s={settings}
                    items={(data.sale_items ?? []).map((i: any) => ({
                      name: i.product_name, quantity: i.quantity, unit_label: i.unit_label, unit_price: Number(i.unit_price),
                    }))}
                    subtotal={Number(data.subtotal)}
                    discount={Number(data.discount)}
                    total={Number(data.total)}
                    paymentLabel={PAYMENT_LABEL[data.payment_method] ?? data.payment_method}
                    received={null}
                    change={null}
                    saleId={data.id}
                    receiptNumber={data.receipt_number}
                    operatorName={(data as any).operator?.full_name ?? (data as any).operator?.email ?? null}
                    at={new Date(data.created_at)}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {error && <div className="text-sm text-destructive">{(error as Error).message}</div>}
    </div>
  );
}

function Field({ label, children, emphasis }: { label: string; children: React.ReactNode; emphasis?: boolean }) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={emphasis ? "text-base font-semibold" : "text-sm"}>{children}</div>
    </div>
  );
}
