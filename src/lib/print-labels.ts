import { formatMZN } from "./format";
import { getLabelSettings, type LabelSettings } from "@/hooks/use-label-settings";

export type LabelInput = {
  name: string;
  barcode: string;
  price?: number | null;
  cost?: number | null;
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

function expand(entries: LabelInput[]) {
  return entries.flatMap((e, ei) =>
    Array.from({ length: Math.max(0, Math.floor(e.qty)) }).map((_, i) => ({
      id: `bc_${ei}_${i}`,
      name: e.name,
      barcode: e.barcode,
      price: e.price ?? null,
      cost: e.cost ?? null,
      lote: e.batch_number ?? null,
      val: e.expiry_date ?? null,
    })),
  );
}

/**
 * Open a printable window of labels. Layout (A4 grid vs thermal continuous)
 * and margins come from saved label settings; pass `override` to force.
 */
export function printLabels(entries: LabelInput[], override?: Partial<LabelSettings>) {
  const cfg: LabelSettings = { ...getLabelSettings(), ...(override ?? {}) };
  const all = expand(entries);
  if (all.length === 0) return;
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;

  const html = cfg.mode === "thermal" ? renderThermal(all, cfg) : renderA4(all, cfg);
  w.document.write(html);
  w.document.close();
}

function renderA4(
  all: ReturnType<typeof expand>,
  cfg: LabelSettings,
) {
  const { columns, marginMm, gapMm, labelHeightMm, showPrice, showBatch, showExpiry, showCost } = cfg.a4;
  const labels = all.map((l) => `
    <div class="label">
      <div class="name">${escapeHtml(l.name)}</div>
      <svg id="${l.id}" class="bc"></svg>
      ${(showBatch && l.lote) || (showExpiry && l.val) ? `
      <div class="meta">
        ${showBatch && l.lote ? `<span>Lote: ${escapeHtml(l.lote)}</span>` : ""}
        ${showExpiry && l.val ? `<span>Val: ${fmtDate(l.val)}</span>` : ""}
      </div>` : ""}
      <div class="prices">
        ${showPrice && l.price != null ? `<span class="price">${escapeHtml(formatMZN(l.price))}</span>` : ""}
        ${showCost && l.cost != null ? `<span class="cost">Custo: ${escapeHtml(formatMZN(l.cost))}</span>` : ""}
      </div>
    </div>
  `).join("");

  const init = all
    .map((l) => `JsBarcode(document.getElementById(${JSON.stringify(l.id)}), ${JSON.stringify(l.barcode)}, { format:'CODE128', height:34, width:1.3, fontSize:9, margin:0 });`)
    .join("\n");

  const printerHint = cfg.printerName ? `<div class="hint">Impressora sugerida: <b>${escapeHtml(cfg.printerName)}</b></div>` : "";

  return `<!doctype html><html><head><title>Etiquetas A4</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
    <style>
      @page { size: A4; margin: ${marginMm}mm; }
      body { font-family: system-ui, sans-serif; margin: 0; }
      .hint { font-size: 11px; color:#555; margin-bottom: 4mm; }
      .grid { display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: ${gapMm}mm; }
      .label { border: 1px dashed #ccc; padding: 2mm; text-align: center; page-break-inside: avoid; height: ${labelHeightMm}mm; display:flex; flex-direction:column; justify-content:center; overflow:hidden; }
      .name { font-size: 10px; font-weight: 600; margin-bottom: 1mm; line-height: 1.1; max-height: 2.4em; overflow:hidden; }
      .bc { width: 100%; height: 38%; }
      .meta { display:flex; justify-content:space-between; gap:4px; font-size: 8px; color: #333; margin-top: 1mm; }
      .prices { display:flex; justify-content:space-between; align-items:baseline; gap:6px; margin-top: 1mm; }
      .price { font-size: 11px; font-weight: 700; }
      .cost { font-size: 8px; color:#555; font-weight: 600; }
      @media print { .label { border-color: transparent; } .hint { display:none; } }
    </style></head><body>
    ${printerHint}
    <div class="grid">${labels}</div>
    <script>
      window.onload = function(){
        ${init}
        setTimeout(function(){ window.print(); }, 350);
      };
    </script></body></html>`;
}

function renderThermal(
  all: ReturnType<typeof expand>,
  cfg: LabelSettings,
) {
  const { widthMm, heightMm, marginMm, barcodeHeightMm, fontSizePt, showPrice, showBatch, showExpiry, showCost } = cfg.thermal;
  const labels = all.map((l) => `
    <div class="label">
      <div class="name">${escapeHtml(l.name)}</div>
      <svg id="${l.id}" class="bc"></svg>
      ${(showBatch && l.lote) || (showExpiry && l.val) ? `
      <div class="meta">
        ${showBatch && l.lote ? `<span>L:${escapeHtml(l.lote)}</span>` : ""}
        ${showExpiry && l.val ? `<span>V:${fmtDate(l.val)}</span>` : ""}
      </div>` : ""}
      <div class="prices">
        ${showPrice && l.price != null ? `<span class="price">${escapeHtml(formatMZN(l.price))}</span>` : ""}
        ${showCost && l.cost != null ? `<span class="cost">C: ${escapeHtml(formatMZN(l.cost))}</span>` : ""}
      </div>
    </div>
  `).join("");

  const init = all
    .map((l) => `JsBarcode(document.getElementById(${JSON.stringify(l.id)}), ${JSON.stringify(l.barcode)}, { format:'CODE128', height:${Math.round(barcodeHeightMm * 3.78)}, width:1.2, fontSize:${Math.max(6, fontSizePt - 1)}, margin:0, displayValue:true });`)
    .join("\n");

  const printerHint = cfg.printerName ? `<div class="hint">Impressora sugerida: <b>${escapeHtml(cfg.printerName)}</b></div>` : "";

  return `<!doctype html><html><head><title>Etiquetas térmicas</title>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
    <style>
      @page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }
      body { font-family: system-ui, sans-serif; margin: 0; font-size: ${fontSizePt}pt; }
      .hint { font-size: 11px; color:#555; padding: 4px 8px; }
      .label {
        width: ${widthMm}mm; height: ${heightMm}mm;
        padding: ${marginMm}mm; box-sizing: border-box;
        display: flex; flex-direction: column; justify-content: center; text-align: center;
        page-break-after: always; overflow: hidden;
      }
      .label:last-child { page-break-after: auto; }
      .name { font-weight: 700; line-height: 1.1; max-height: 2.4em; overflow: hidden; margin-bottom: 1mm; }
      .bc { width: 100%; height: ${barcodeHeightMm}mm; }
      .meta { display:flex; justify-content:space-between; gap:2mm; margin-top: 0.5mm; font-size: ${Math.max(6, fontSizePt - 1)}pt; }
      .prices { display:flex; justify-content:space-between; gap:2mm; margin-top: 0.5mm; }
      .price { font-weight: 800; }
      .cost { font-weight: 600; font-size: ${Math.max(6, fontSizePt - 1)}pt; color:#444; }
      @media print { .hint { display: none; } }
    </style></head><body>
    ${printerHint}
    ${labels}
    <script>
      window.onload = function(){
        ${init}
        setTimeout(function(){ window.print(); }, 350);
      };
    </script></body></html>`;
}
