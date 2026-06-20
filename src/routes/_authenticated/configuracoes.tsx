import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Settings as SettingsIcon, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAuthUser, useUserRoles, highestRole } from "@/hooks/use-auth";
import { usePharmacySettings, receiptWidthClass, type PharmacySettings, type ReceiptWidth } from "@/hooks/use-settings";
import { formatMZN, formatDateTime } from "@/lib/format";
import { Barcode } from "@/components/barcode";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — PharmaSys" }] }),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const { user } = useAuthUser();
  const { data: roles = [] } = useUserRoles(user?.id);
  const isAdmin = highestRole(roles) === "admin";
  const { data: settings, isLoading } = usePharmacySettings();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<PharmacySettings | null>(null);

  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const { error } = await supabase
        .from("pharmacy_settings")
        .update({
          name: form.name,
          slogan: form.slogan,
          nuit: form.nuit,
          address: form.address,
          city: form.city,
          phone: form.phone,
          email: form.email,
          website: form.website,
          logo_url: form.logo_url,
          receipt_width: form.receipt_width,
          receipt_header: form.receipt_header,
          receipt_footer: form.receipt_footer,
          show_pharmacist: form.show_pharmacist,
        })
        .eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações guardadas");
      queryClient.invalidateQueries({ queryKey: ["pharmacy-settings"] });
    },
    onError: (e: Error) => toast.error("Falha ao guardar", { description: e.message }),
  });

  if (isLoading || !form) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const set = <K extends keyof PharmacySettings>(k: K, v: PharmacySettings[K]) =>
    setForm((p) => (p ? { ...p, [k]: v } : p));

  const disabled = !isAdmin;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_420px]">
      <div className="space-y-4">
        {!isAdmin && (
          <Card className="border-amber-500/40 bg-amber-500/5">
            <CardContent className="flex items-center gap-2 py-3 text-sm">
              <Lock className="h-4 w-4" /> Apenas administradores podem alterar estas configurações.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><SettingsIcon className="h-5 w-5" /> Dados da farmácia</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Nome">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} disabled={disabled} />
            </Field>
            <Field label="Slogan">
              <Input value={form.slogan ?? ""} onChange={(e) => set("slogan", e.target.value)} disabled={disabled} />
            </Field>
            <Field label="NUIT">
              <Input value={form.nuit ?? ""} onChange={(e) => set("nuit", e.target.value)} disabled={disabled} />
            </Field>
            <Field label="Telefone">
              <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} disabled={disabled} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} disabled={disabled} />
            </Field>
            <Field label="Website">
              <Input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} disabled={disabled} />
            </Field>
            <Field label="Endereço" full>
              <Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} disabled={disabled} />
            </Field>
            <Field label="Cidade / País">
              <Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} disabled={disabled} />
            </Field>
            <Field label="URL do logótipo">
              <Input value={form.logo_url ?? ""} placeholder="https://…" onChange={(e) => set("logo_url", e.target.value)} disabled={disabled} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recibo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Tamanho do papel">
                <Select value={form.receipt_width} onValueChange={(v) => set("receipt_width", v as ReceiptWidth)} disabled={disabled}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">Térmico 58 mm</SelectItem>
                    <SelectItem value="80mm">Térmico 80 mm</SelectItem>
                    <SelectItem value="a4">Folha A4</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Mostrar nome do operador">
                <div className="flex h-9 items-center">
                  <Switch checked={form.show_pharmacist} onCheckedChange={(v) => set("show_pharmacist", v)} disabled={disabled} />
                </div>
              </Field>
            </div>
            <Field label="Cabeçalho extra (opcional)" full>
              <Textarea rows={2} value={form.receipt_header ?? ""} onChange={(e) => set("receipt_header", e.target.value)} disabled={disabled} placeholder="Ex.: Licença sanitária nº 123/2026" />
            </Field>
            <Field label="Rodapé / mensagem final" full>
              <Textarea rows={2} value={form.receipt_footer ?? ""} onChange={(e) => set("receipt_footer", e.target.value)} disabled={disabled} />
            </Field>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => save.mutate()} disabled={disabled || save.isPending} size="lg">
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar alterações
          </Button>
        </div>
      </div>

      <Card className="self-start">
        <CardHeader><CardTitle>Pré-visualização do recibo</CardTitle></CardHeader>
        <CardContent>
          <div className="flex justify-center rounded-lg bg-muted/40 p-4">
            <ReceiptPreview s={form} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? "md:col-span-2" : ""}`}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ReceiptPreview({ s }: { s: PharmacySettings }) {
  const sampleItems = [
    { name: "Paracetamol 500mg", qty: 2, unit: "cx", price: 150 },
    { name: "Amoxicilina 250mg", qty: 1, unit: "carteira", price: 85 },
  ];
  const subtotal = sampleItems.reduce((s, i) => s + i.qty * i.price, 0);
  return (
    <ReceiptBody
      s={s}
      items={sampleItems.map((i) => ({ name: i.name, quantity: i.qty, unit_label: i.unit, unit_price: i.price }))}
      subtotal={subtotal}
      discount={0}
      total={subtotal}
      paymentLabel="M-Pesa"
      received={null}
      change={null}
      saleId="PREVIEW-0001"
      operatorName="Operador Exemplo"
      at={new Date()}
    />
  );
}

export function ReceiptBody(props: {
  s: PharmacySettings;
  items: Array<{ name: string; quantity: number; unit_label: string; unit_price: number }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentLabel: string;
  received: number | null;
  change: number | null;
  saleId: string;
  receiptNumber?: string | null;
  operatorName?: string | null;
  at: Date;
}) {
  const { s, items, subtotal, discount, total, paymentLabel, received, change, saleId, receiptNumber, operatorName, at } = props;
  const ref = receiptNumber || `REC-${saleId.slice(0, 8).toUpperCase()}`;
  // Bar width tuned so the symbol fits within the paper while staying scannable.
  // Receipt numbers are ~15 chars (CODE128 ≈ 200 modules).
  const barcodeHeight = s.receipt_width === "a4" ? 70 : s.receipt_width === "58mm" ? 45 : 55;
  const barcodeWidth = s.receipt_width === "58mm" ? 0.9 : s.receipt_width === "80mm" ? 1.2 : 2;
  return (
    <div className={`${receiptWidthClass(s.receipt_width)} bg-white p-3 font-mono leading-snug text-black shadow-sm`}>
      {s.logo_url && (
        <div className="mb-2 flex justify-center">
          <img src={s.logo_url} alt={s.name} className="max-h-14 object-contain" />
        </div>
      )}
      <div className="text-center">
        <div className="text-base font-bold tracking-tight">{s.name}</div>
        {s.slogan && <div className="text-[10px] italic opacity-80">{s.slogan}</div>}
        {s.address && <div className="text-[10px]">{s.address}</div>}
        {s.city && <div className="text-[10px]">{s.city}</div>}
        <div className="text-[10px]">
          {s.phone && <span>Tel: {s.phone}</span>}
          {s.phone && s.email && <span> · </span>}
          {s.email && <span>{s.email}</span>}
        </div>
        {s.nuit && <div className="text-[10px]">NUIT: {s.nuit}</div>}
        {s.receipt_header && <div className="mt-1 text-[10px] whitespace-pre-line">{s.receipt_header}</div>}
      </div>

      <Dashed />
      <div className="text-center font-bold">RECIBO DE VENDA</div>
      <div className="flex justify-between text-[10px]">
        <span>Nº {ref}</span>
        <span>{formatDateTime(at)}</span>
      </div>
      {s.show_pharmacist && operatorName && (
        <div className="text-[10px]">Operador: {operatorName}</div>
      )}

      <Dashed />
      <table className="w-full">
        <thead>
          <tr className="text-left text-[10px]">
            <th className="py-0.5">Descrição</th>
            <th className="py-0.5 text-right">Qtd</th>
            <th className="py-0.5 text-right">P.Unit</th>
            <th className="py-0.5 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className="align-top">
              <td className="py-0.5 pr-1">
                <div className="leading-tight">{it.name}</div>
                <div className="text-[9px] opacity-70">({it.unit_label})</div>
              </td>
              <td className="py-0.5 text-right">{it.quantity}</td>
              <td className="py-0.5 text-right">{formatMZN(it.unit_price)}</td>
              <td className="py-0.5 text-right">{formatMZN(it.quantity * it.unit_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dashed />
      <Row label="Subtotal" value={formatMZN(subtotal)} />
      {discount > 0 && <Row label="Desconto" value={`− ${formatMZN(discount)}`} />}
      <Row label="TOTAL" value={formatMZN(total)} bold />
      <Dashed />
      <Row label="Pagamento" value={paymentLabel} />
      {received != null && <Row label="Entregue" value={formatMZN(received)} />}
      {change != null && <Row label="Troco" value={formatMZN(change)} bold />}

      <Dashed />
      <div className="barcode-block flex flex-col items-center gap-1 bg-white px-2 py-1">
        <Barcode value={ref} height={barcodeHeight} width={barcodeWidth} fontSize={0} displayValue={false} />
        <div className="text-center text-[11px] font-mono font-bold tracking-widest">{ref}</div>
        <div className="text-center text-[9px] opacity-70">Leia o código de barras para validar este recibo</div>
      </div>
      <Dashed />
      {s.receipt_footer && <div className="text-center text-[10px] whitespace-pre-line">{s.receipt_footer}</div>}
      <div className="mt-1 text-center text-[9px] opacity-70">Documento não fiscal · {s.name}</div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-bold" : ""}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

function Dashed() {
  return <div className="my-1 border-t border-dashed border-black/60" />;
}
