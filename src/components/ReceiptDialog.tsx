import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, FileDown, Mail, MessageCircle, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import jsPDF from "jspdf";

const PAYMENT_LABEL: Record<string, string> = {
  cash: "Dinheiro", debit: "Débito", credit: "Crédito", pix: "PIX", other: "Outro",
};

interface SaleRow {
  id: string;
  sale_number: number;
  created_at: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  notes: string | null;
  customers: { full_name: string; phone: string | null; email: string | null } | null;
  sale_items: { id: string; product_name: string; quantity: number; unit_price: number; total: number; unit_label: string | null; unit_kind: string | null }[];
}

const STORE = { name: "FarmaGest", address: "Av. Saúde, 1000 — Centro", phone: "(11) 4000-0000" };

function buildReceiptText(s: SaleRow): string {
  const lines: string[] = [];
  lines.push(`*${STORE.name}* — Recibo de venda`);
  lines.push(`Venda #${s.sale_number} — ${formatDateTime(s.created_at)}`);
  if (s.customers?.full_name) lines.push(`Cliente: ${s.customers.full_name}`);
  lines.push("--------------------------------");
  s.sale_items.forEach((i) => {
    const unit = i.unit_label ? ` (${i.unit_label})` : "";
    lines.push(`${i.quantity}× ${i.product_name}${unit}`);
    lines.push(`   ${formatCurrency(i.unit_price)}  =  ${formatCurrency(i.total)}`);
  });
  lines.push("--------------------------------");
  lines.push(`Subtotal: ${formatCurrency(s.subtotal)}`);
  if (s.discount > 0) lines.push(`Desconto: -${formatCurrency(s.discount)}`);
  lines.push(`*TOTAL: ${formatCurrency(s.total)}*`);
  lines.push(`Pagamento: ${PAYMENT_LABEL[s.payment_method] ?? s.payment_method}`);
  lines.push("");
  lines.push(`Obrigado pela preferência! — ${STORE.name}`);
  return lines.join("\n");
}

function buildReceiptHTML(s: SaleRow): string {
  const rows = s.sale_items.map((i) => `
    <tr>
      <td>${i.quantity}×</td>
      <td>${i.product_name}${i.unit_label ? ` <small style="color:#666">(${i.unit_label})</small>` : ""}</td>
      <td style="text-align:right">${formatCurrency(i.unit_price)}</td>
      <td style="text-align:right">${formatCurrency(i.total)}</td>
    </tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Recibo #${s.sale_number}</title>
<style>
  *{box-sizing:border-box} body{font-family:ui-monospace,Menlo,Consolas,monospace;color:#111;margin:0;padding:24px;max-width:360px}
  h1{font-size:18px;margin:0 0 4px;text-align:center}
  .muted{color:#555;font-size:12px;text-align:center;margin-bottom:12px}
  .meta{font-size:12px;margin:8px 0;border-top:1px dashed #999;border-bottom:1px dashed #999;padding:8px 0}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-top:8px}
  td{padding:3px 4px;vertical-align:top}
  .totals{margin-top:8px;border-top:1px dashed #999;padding-top:8px;font-size:13px}
  .totals .row{display:flex;justify-content:space-between;padding:2px 0}
  .total{font-size:16px;font-weight:700;border-top:1px solid #000;margin-top:6px;padding-top:6px}
  .footer{text-align:center;font-size:11px;color:#666;margin-top:14px}
  @media print { body{padding:0} @page{size:80mm auto;margin:6mm} }
</style></head><body>
  <h1>${STORE.name}</h1>
  <div class="muted">${STORE.address}<br/>${STORE.phone}</div>
  <div class="meta">
    <div><b>Venda #${s.sale_number}</b></div>
    <div>${formatDateTime(s.created_at)}</div>
    ${s.customers?.full_name ? `<div>Cliente: ${s.customers.full_name}</div>` : ""}
    <div>Pagamento: ${PAYMENT_LABEL[s.payment_method] ?? s.payment_method}</div>
  </div>
  <table>${rows}</table>
  <div class="totals">
    <div class="row"><span>Subtotal</span><span>${formatCurrency(s.subtotal)}</span></div>
    ${s.discount > 0 ? `<div class="row"><span>Desconto</span><span>-${formatCurrency(s.discount)}</span></div>` : ""}
    <div class="row total"><span>TOTAL</span><span>${formatCurrency(s.total)}</span></div>
  </div>
  <div class="footer">Obrigado pela preferência!</div>
  <script>window.onload=()=>{setTimeout(()=>window.print(),150)};</script>
</body></html>`;
}

interface Props {
  saleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptDialog({ saleId, open, onOpenChange }: Props) {
  const { data: sale, isLoading } = useQuery({
    queryKey: ["sale-receipt", saleId],
    enabled: !!saleId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("id, sale_number, created_at, subtotal, discount, total, payment_method, notes, customers(full_name, phone, email), sale_items(id, product_name, quantity, unit_price, total)")
        .eq("id", saleId!)
        .single();
      if (error) throw error;
      return data as unknown as SaleRow;
    },
  });

  const [emailTo, setEmailTo] = useState("");
  const [phoneTo, setPhoneTo] = useState("");

  useEffect(() => {
    if (sale) {
      setEmailTo(sale.customers?.email ?? "");
      setPhoneTo((sale.customers?.phone ?? "").replace(/\D/g, ""));
    }
  }, [sale]);

  const handlePrint = () => {
    if (!sale) return;
    const w = window.open("", "_blank", "width=420,height=640");
    if (!w) return toast.error("Bloqueado pelo navegador. Permita pop-ups.");
    w.document.write(buildReceiptHTML(sale));
    w.document.close();
  };

  const handleDownloadPDF = () => {
    if (!sale) return;
    // 80mm thermal receipt format
    const doc = new jsPDF({ unit: "mm", format: [80, 200] });
    const W = 80;
    let y = 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(STORE.name, W / 2, y, { align: "center" }); y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(STORE.address, W / 2, y, { align: "center" }); y += 3.5;
    doc.text(STORE.phone, W / 2, y, { align: "center" }); y += 5;
    doc.setLineDashPattern([0.5, 0.5], 0);
    doc.line(4, y, W - 4, y); y += 4;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Venda #${sale.sale_number}`, 4, y); y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(formatDateTime(sale.created_at), 4, y); y += 3.5;
    if (sale.customers?.full_name) { doc.text(`Cliente: ${sale.customers.full_name}`, 4, y); y += 3.5; }
    doc.text(`Pagamento: ${PAYMENT_LABEL[sale.payment_method] ?? sale.payment_method}`, 4, y); y += 4;
    doc.line(4, y, W - 4, y); y += 4;
    doc.setFontSize(8);
    sale.sale_items.forEach((i) => {
      const name = doc.splitTextToSize(`${i.quantity}x ${i.product_name}`, W - 8);
      doc.text(name, 4, y); y += name.length * 3.2;
      doc.text(`${formatCurrency(i.unit_price)}`, 4, y);
      doc.text(`${formatCurrency(i.total)}`, W - 4, y, { align: "right" });
      y += 4;
    });
    doc.line(4, y, W - 4, y); y += 4;
    doc.text("Subtotal", 4, y);
    doc.text(formatCurrency(sale.subtotal), W - 4, y, { align: "right" }); y += 4;
    if (sale.discount > 0) {
      doc.text("Desconto", 4, y);
      doc.text(`-${formatCurrency(sale.discount)}`, W - 4, y, { align: "right" }); y += 4;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TOTAL", 4, y);
    doc.text(formatCurrency(sale.total), W - 4, y, { align: "right" }); y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Obrigado pela preferencia!", W / 2, y, { align: "center" });
    doc.save(`recibo-${sale.sale_number}.pdf`);
    toast.success("PDF baixado!");
  };

  const handleWhatsApp = () => {
    if (!sale) return;
    const text = encodeURIComponent(buildReceiptText(sale));
    const phone = phoneTo.replace(/\D/g, "");
    const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank", "noopener");
  };

  const handleEmail = () => {
    if (!sale) return;
    const subject = encodeURIComponent(`Recibo #${sale.sale_number} — ${STORE.name}`);
    const body = encodeURIComponent(buildReceiptText(sale));
    window.location.href = `mailto:${emailTo}?subject=${subject}&body=${body}`;
  };

  const handleCopy = async () => {
    if (!sale) return;
    await navigator.clipboard.writeText(buildReceiptText(sale));
    toast.success("Recibo copiado!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Recibo da venda{sale ? ` #${sale.sale_number}` : ""}</DialogTitle>
          <DialogDescription>Imprima, salve em PDF ou compartilhe.</DialogDescription>
        </DialogHeader>

        {isLoading || !sale ? (
          <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="rounded-md border bg-muted/30 p-4 max-h-[260px] overflow-y-auto font-mono text-xs whitespace-pre-wrap">
              {buildReceiptText(sale).replace(/\*/g, "")}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button onClick={handlePrint} variant="default">
                <Printer className="h-4 w-4" /> Imprimir
              </Button>
              <Button onClick={handleDownloadPDF} variant="secondary">
                <FileDown className="h-4 w-4" /> Baixar PDF
              </Button>
              <Button onClick={handleWhatsApp} variant="outline">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
              <Button onClick={handleEmail} variant="outline">
                <Mail className="h-4 w-4" /> E-mail
              </Button>
              <Button onClick={handleCopy} variant="ghost" className="col-span-2">
                <Copy className="h-4 w-4" /> Copiar texto
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground pt-1">
              Dica: no diálogo de impressão escolha <b>"Salvar como PDF"</b> para gerar o arquivo.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
