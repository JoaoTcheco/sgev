import type { PharmacySettings } from "@/hooks/use-settings";
import { formatMZN, formatDateTime } from "@/lib/format";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export interface TestReceiptItem {
  name: string;
  quantity: number;
  unit_label: string;
  unit_price: number;
}

export interface PrintReceiptInput {
  settings: PharmacySettings;
  items: TestReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentLabel: string;
  received: number | null;
  change: number | null;
  ref: string;
  operatorName?: string | null;
  at: Date;
  isTest?: boolean;
}

function paperCss(w: PharmacySettings["receipt_width"]) {
  if (w === "58mm") return { page: "58mm auto", width: "58mm", font: "10px" };
  if (w === "a4") return { page: "A4", width: "190mm", font: "12px" };
  return { page: "80mm auto", width: "80mm", font: "11px" };
}

export function printReceiptWindow(input: PrintReceiptInput) {
  const { settings: s, items, subtotal, discount, total, paymentLabel, received, change, ref, operatorName, at, isTest } = input;
  const paper = paperCss(s.receipt_width);
  const barcodeHeight = s.receipt_width === "a4" ? 70 : s.receipt_width === "58mm" ? 45 : 55;
  const barcodeWidth = s.receipt_width === "58mm" ? 0.9 : s.receipt_width === "80mm" ? 1.2 : 2;

  const rows = items.map((it) => `
    <tr>
      <td style="padding:1px 2px 1px 0;">
        <div style="line-height:1.15;">${escapeHtml(it.name)}</div>
        <div style="font-size:9px;opacity:.7;">(${escapeHtml(it.unit_label)})</div>
      </td>
      <td style="text-align:right;padding:1px 0;">${it.quantity}</td>
      <td style="text-align:right;padding:1px 0;">${escapeHtml(formatMZN(it.unit_price))}</td>
      <td style="text-align:right;padding:1px 0;">${escapeHtml(formatMZN(it.quantity * it.unit_price))}</td>
    </tr>
  `).join("");

  const html = `<!doctype html><html><head><title>${isTest ? "Recibo de teste" : "Recibo"} — ${escapeHtml(s.name)}</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
    <style>
      @page { size: ${paper.page}; margin: 3mm; }
      html,body { margin:0; padding:0; background:#fff; color:#000; }
      body { font-family: 'Courier New', ui-monospace, monospace; font-size:${paper.font}; }
      .receipt { width:${paper.width}; margin:0 auto; padding:6px; }
      .center { text-align:center; }
      .bold { font-weight:700; }
      .row { display:flex; justify-content:space-between; }
      .small { font-size:10px; }
      .xs { font-size:9px; opacity:.7; }
      .dashed { border-top:1px dashed #000; margin:4px 0; }
      table { width:100%; border-collapse:collapse; }
      th { text-align:left; font-size:10px; font-weight:600; padding:1px 0; }
      th.r { text-align:right; }
      .badge { display:inline-block; border:1px dashed #000; padding:2px 8px; font-weight:700; font-size:10px; letter-spacing:1px; }
      .logo { max-height:56px; object-fit:contain; margin:0 auto 4px; display:block; }
      .hint { position:fixed; top:8px; right:8px; background:#111; color:#fff; padding:6px 10px; font-family:system-ui,sans-serif; font-size:12px; border-radius:4px; }
      @media print { .hint { display:none; } }
    </style></head><body>
    <div class="hint">A abrir janela de impressão…</div>
    <div class="receipt">
      ${s.logo_url ? `<img class="logo" src="${escapeHtml(s.logo_url)}" alt="${escapeHtml(s.name)}" />` : ""}
      <div class="center">
        <div class="bold" style="font-size:14px;">${escapeHtml(s.name)}</div>
        ${s.slogan ? `<div class="xs" style="font-style:italic;">${escapeHtml(s.slogan)}</div>` : ""}
        ${s.address ? `<div class="small">${escapeHtml(s.address)}</div>` : ""}
        ${s.city ? `<div class="small">${escapeHtml(s.city)}</div>` : ""}
        <div class="small">
          ${s.phone ? `Tel: ${escapeHtml(s.phone)}` : ""}${s.phone && s.email ? " · " : ""}${s.email ? escapeHtml(s.email) : ""}
        </div>
        ${s.nuit ? `<div class="small">NUIT: ${escapeHtml(s.nuit)}</div>` : ""}
        ${s.receipt_header ? `<div class="small" style="margin-top:2px;white-space:pre-line;">${escapeHtml(s.receipt_header)}</div>` : ""}
      </div>

      <div class="dashed"></div>
      ${isTest ? `<div class="center" style="margin-bottom:4px;"><span class="badge">*** RECIBO DE TESTE ***</span></div>` : ""}
      <div class="center bold">RECIBO DE VENDA</div>
      <div class="row small"><span>Nº ${escapeHtml(ref)}</span><span>${escapeHtml(formatDateTime(at))}</span></div>
      ${s.show_pharmacist && operatorName ? `<div class="small">Operador: ${escapeHtml(operatorName)}</div>` : ""}

      <div class="dashed"></div>
      <table>
        <thead><tr><th>Descrição</th><th class="r">Qtd</th><th class="r">P.Unit</th><th class="r">Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="dashed"></div>
      <div class="row"><span>Subtotal</span><span>${escapeHtml(formatMZN(subtotal))}</span></div>
      ${discount > 0 ? `<div class="row"><span>Desconto</span><span>− ${escapeHtml(formatMZN(discount))}</span></div>` : ""}
      <div class="row bold"><span>TOTAL</span><span>${escapeHtml(formatMZN(total))}</span></div>
      <div class="dashed"></div>
      <div class="row"><span>Pagamento</span><span>${escapeHtml(paymentLabel)}</span></div>
      ${received != null ? `<div class="row"><span>Entregue</span><span>${escapeHtml(formatMZN(received))}</span></div>` : ""}
      ${change != null ? `<div class="row bold"><span>Troco</span><span>${escapeHtml(formatMZN(change))}</span></div>` : ""}

      <div class="dashed"></div>
      <div style="padding:2px 0;">
        <svg id="bc" style="width:100%;"></svg>
        <div class="center bold" style="letter-spacing:2px;margin-top:2px;">${escapeHtml(ref)}</div>
        <div class="center xs">Leia o código de barras para validar este recibo</div>
      </div>
      <div class="dashed"></div>
      ${s.receipt_footer ? `<div class="center small" style="white-space:pre-line;">${escapeHtml(s.receipt_footer)}</div>` : ""}
      <div class="center xs" style="margin-top:2px;">Documento não fiscal · ${escapeHtml(s.name)}${isTest ? " · TESTE" : ""}</div>
    </div>
    <script>
      window.onload = function(){
        try { JsBarcode(document.getElementById('bc'), ${JSON.stringify(ref)}, { format:'CODE128', height:${barcodeHeight}, width:${barcodeWidth}, displayValue:false, margin:0 }); } catch(e) {}
        setTimeout(function(){ window.print(); }, 350);
      };
    </script></body></html>`;

  const w = window.open("", "_blank", "width=480,height=720");
  if (!w) {
    throw new Error("O navegador bloqueou a janela de impressão. Permita popups para este site.");
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

export function printTestReceipt(settings: PharmacySettings, operatorName?: string | null) {
  const items: TestReceiptItem[] = [
    { name: "Paracetamol 500mg", quantity: 2, unit_label: "cx", unit_price: 150 },
    { name: "Amoxicilina 250mg", quantity: 1, unit_label: "carteira", unit_price: 85 },
    { name: "Soro fisiológico 500ml", quantity: 1, unit_label: "un", unit_price: 65 },
  ];
  const subtotal = items.reduce((a, i) => a + i.quantity * i.unit_price, 0);
  const total = subtotal;
  printReceiptWindow({
    settings,
    items,
    subtotal,
    discount: 0,
    total,
    paymentLabel: "Numerário",
    received: 500,
    change: 500 - total,
    ref: `TEST-${new Date().getTime().toString().slice(-6)}`,
    operatorName: operatorName ?? "Operador de Teste",
    at: new Date(),
    isTest: true,
  });
}
