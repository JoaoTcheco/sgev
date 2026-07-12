<?php
$settings = SettingModel::get();

// Expand selection into flat list of labels (com contexto de lote quando existir).
$labels = [];
foreach ($selection as $sel) {
    for ($i = 0; $i < $sel['qty']; $i++) {
        $labels[] = [
            'product' => $sel['product'],
            'batch'   => $sel['batch'] ?? null,
        ];
    }
}

$layout    = $settings['label_layout']    ?? 'a4';
$lw        = (int)($settings['label_width_mm']  ?? 40);
$lh        = (int)($settings['label_height_mm'] ?? 25);
$cols      = (int)($settings['label_columns']   ?? 5);
$margin    = (int)($settings['label_margin']    ?? 4);
$gap       = (int)($settings['label_gap_mm']    ?? 3);
$showPrice = !empty($settings['label_show_price']);
$showCost  = !empty($settings['label_show_cost']);
$showBatch = !empty($settings['label_show_batch']);
$showExp   = !empty($settings['label_show_expiry']);
$bcHeight  = max(18, (int)round($lh * 1.1));
$bcWidth   = $lw <= 32 ? 1.0 : ($lw <= 45 ? 1.3 : 1.7);
$gridClass = $layout === 'thermal' ? 'labels-roll' : 'labels-grid';

function fmt_val(?string $d): string {
    if (!$d) return '';
    $parts = explode('-', $d);
    if (count($parts) !== 3) return $d;
    return "{$parts[2]}/{$parts[1]}/{$parts[0]}";
}
?>
<style>
  :root {
    --lw: <?= $lw ?>mm;
    --lh: <?= $lh ?>mm;
    --cols: <?= $cols ?>;
    --sheet-margin: <?= $margin ?>mm;
    --label-gap: <?= $gap ?>mm;
  }
  @page { size: A4; margin: <?= $margin ?>mm; }
  .labels-grid { display: grid; grid-template-columns: repeat(var(--cols), 1fr); gap: var(--label-gap); }
  .labels-roll .label { page-break-after: always; }
  .label {
    border: 1px dashed #cbd5e1;
    padding: 2mm; text-align: center;
    height: var(--lh); overflow: hidden;
    display: flex; flex-direction: column; justify-content: center;
    page-break-inside: avoid;
  }
  .label-pharmacy { font-size: 8px; color:#64748b; font-weight:600; }
  .label-name { font-size: 10px; font-weight:700; line-height:1.1; margin: 1mm 0; max-height: 2.4em; overflow: hidden; }
  .label-meta { display:flex; justify-content:space-between; gap:4px; font-size: 8px; color:#334155; margin-top: 0.5mm; }
  .label-prices { display:flex; justify-content:space-between; align-items:baseline; gap:6px; margin-top: 1mm; }
  .label-price { font-size: 11px; font-weight:800; color:#0f766e; }
  .label-cost { font-size: 8px; color:#64748b; }
  .label-code { font-size: 8px; color:#475569; }
  .barcode { width: 100%; height: 38%; }
  .no-print { padding: 12px 16px; background:#f0fdfa; border-bottom:1px solid #ccfbf1; display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
  .no-print .btn { padding:6px 14px; border-radius:6px; border:0; background:#0f766e; color:#fff; font-weight:600; cursor:pointer; }
  .no-print .btn.ghost { background:#fff; color:#0f766e; border:1px solid #0f766e; }
  .printer-hint { font-size: 12px; color:#334155; }
  @media print {
    .no-print { display: none !important; }
    .label { border-color: transparent; }
  }
</style>

<div class="no-print">
  <?php if (!empty($settings['printer_name'])): ?>
    <span class="printer-hint">Impressora configurada: <strong><?= e($settings['printer_name']) ?></strong></span>
  <?php endif; ?>
  <span class="printer-hint"><?= count($labels) ?> etiqueta(s) — <?= $cols ?> por linha, <?= $lw ?>×<?= $lh ?>mm</span>
  <span style="flex:1"></span>
  <button class="btn" type="button" onclick="window.print()">Imprimir</button>
  <button class="btn ghost" type="button" onclick="downloadPdf()">Descarregar PDF</button>
</div>

<div class="<?= $gridClass ?>">
  <?php foreach ($labels as $l): $p = $l['product']; $b = $l['batch']; ?>
    <div class="label">
      <div class="label-pharmacy"><?= e($settings['name']) ?></div>
      <div class="label-name"><?= e($p['name']) ?></div>
      <?php if (($showBatch && $b) || ($showExp && $b)): ?>
        <div class="label-meta">
          <?php if ($showBatch && !empty($b['batch_number'])): ?><span>L: <?= e($b['batch_number']) ?></span><?php endif; ?>
          <?php if ($showExp && !empty($b['expiry_date'])): ?><span>Val: <?= e(fmt_val($b['expiry_date'])) ?></span><?php endif; ?>
        </div>
      <?php endif; ?>
      <?php if ($showPrice || $showCost): ?>
        <div class="label-prices">
          <?php if ($showPrice): ?><span class="label-price"><?= e(formatMZN($p['sale_price'])) ?></span><?php endif; ?>
          <?php if ($showCost && !empty($p['cost_price'])): ?><span class="label-cost">C: <?= e(formatMZN($p['cost_price'])) ?></span><?php endif; ?>
        </div>
      <?php endif; ?>
      <?php if (!empty($p['barcode'])): ?>
        <svg class="barcode" data-value="<?= e($p['barcode']) ?>"></svg>
        <div class="label-code"><?= e($p['barcode']) ?></div>
      <?php endif; ?>
    </div>
  <?php endforeach; ?>
</div>

<script src="<?= asset("js/vendor/JsBarcode.all.min.js") ?>"></script>
<script>
document.querySelectorAll('svg.barcode').forEach(el => {
  try {
    JsBarcode(el, el.dataset.value, {
      format: 'CODE128', displayValue: false,
      width: <?= $bcWidth ?>, height: <?= $bcHeight ?>, margin: 0
    });
  } catch (e) { console.warn('Barcode error:', e); }
});
function downloadPdf() {
  // Truque universal: usa a mesma pipeline do browser "Guardar como PDF".
  alert('No diálogo de impressão, escolha "Guardar como PDF" no destino.');
  window.print();
}
// Auto-open só se abrimos em nova janela via POST/GET quick
if (!window.__noAutoPrint) setTimeout(() => window.print(), 600);
</script>
