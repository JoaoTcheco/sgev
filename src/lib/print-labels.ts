import { formatMZN } from "./format";

export type LabelInput = {
  name: string;
  barcode: string;
  price?: number | null;
  batch_number?: string | null;
  expiry_date?: string | null; // YYYY-MM-DD
  qty: number;
};

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function fmtDate(d?: string | null) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

/**
 * Open a printable A4 grid of labels in a new window.
 * Each entry contributes `qty` copies. Labels show name, barcode (CODE128),
 * optional price, lote and validade.
 */
export function printLabels(entries: LabelInput[]) {
  const all = entries.flatMap((e, ei) =>
    Array.from({ length: Math.max(0, e.qty) }).map((_, i) => ({
      id: `bc_${ei}_${i}`,
      name: e.name,
      barcode: e.barcode,
      price: e.price ?? null,
      lote: e.batch_number ?? null,
      val: e.expiry_date ?? null,
    })),
  );
  if (all.length === 0) return;
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  const labels = all.map((l) => `
    <div class="label">
      <div class="name">${escapeHtml(l.name)}</div>
      <svg id="${l.id}" class="bc"></svg>
      <div class="meta">
        ${l.lote ? `<span>Lote: ${escapeHtml(l.lote)}</span>` : ""}
        ${l.val ? `<span>Val: ${fmtDate(l.val)}</span>` : ""}
      </div>
      ${l.price != null ? `<div class="price">${escapeHtml(formatMZN(l.price))}</div>` : ""}
    </div>
  `).join("");

  const init = all
    .map((l) => `JsBarcode(document.getElementById(${JSON.stringify(l.id)}), ${JSON.stringify(l.barcode)}, { format:'CODE128', height:38, width:1.4, fontSize:10, margin:0 });`)
    .join("\n");

  w.document.write(`<!doctype html><html><head><title>Etiquetas</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
    <style>
      @page { size: A4; margin: 8mm; }
      body { font-family: system-ui, sans-serif; margin: 0; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }
      .label { border: 1px dashed #ccc; padding: 3mm; text-align: center; page-break-inside: avoid; }
      .name { font-size: 11px; font-weight: 600; margin-bottom: 1mm; line-height: 1.15; }
      .bc { width: 100%; height: 38px; }
      .meta { display:flex; justify-content:space-between; gap:4px; font-size: 9px; color: #333; margin-top: 1mm; }
      .price { font-size: 12px; font-weight: 700; margin-top: 1mm; }
      @media print { .label { border-color: transparent; } }
    </style></head><body>
    <div class="grid">${labels}</div>
    <script>
      window.onload = function(){
        ${init}
        setTimeout(function(){ window.print(); }, 350);
      };
    </script></body></html>`);
  w.document.close();
}
