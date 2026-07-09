<?php
$settings = SettingModel::get();
$labels = [];
foreach ($selection as $sel) {
    for ($i = 0; $i < $sel['qty']; $i++) $labels[] = $sel['product'];
}
$layout   = $settings['label_layout']   ?? 'a4';
$lw       = (int)($settings['label_width_mm']  ?? 40);
$lh       = (int)($settings['label_height_mm'] ?? 25);
$cols     = (int)($settings['label_columns']   ?? 5);
$margin   = (int)($settings['label_margin']    ?? 4);
$bcHeight = max(18, (int)round($lh * 1.1));   // altura relativa
$bcWidth  = $lw <= 32 ? 1.0 : ($lw <= 45 ? 1.3 : 1.7);
$gridClass= $layout === 'thermal' ? 'labels-roll' : 'labels-grid';
?>
<style>
  :root {
    --lw: <?= $lw ?>mm;
    --lh: <?= $lh ?>mm;
    --cols: <?= $cols ?>;
    --sheet-margin: <?= $margin ?>mm;
  }
</style>

<div class="no-print">
  <?php if (!empty($settings['printer_name'])): ?>
    <span class="printer-hint">Impressora configurada: <strong><?= e($settings['printer_name']) ?></strong></span>
  <?php endif; ?>
</div>

<div class="<?= $gridClass ?>">
  <?php foreach ($labels as $p): ?>
    <div class="label">
      <div class="label-pharmacy"><?= e($settings['name']) ?></div>
      <div class="label-name"><?= e($p['name']) ?></div>
      <div class="label-price"><?= e(formatMZN($p['sale_price'])) ?></div>
      <?php if ($p['barcode']): ?>
        <svg class="barcode" data-value="<?= e($p['barcode']) ?>"></svg>
        <div class="label-code"><?= e($p['barcode']) ?></div>
      <?php endif; ?>
    </div>
  <?php endforeach; ?>
</div>

<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<script>
document.querySelectorAll('svg.barcode').forEach(el => {
  try {
    JsBarcode(el, el.dataset.value, {
      format: 'CODE128', displayValue: false,
      width: <?= $bcWidth ?>, height: <?= $bcHeight ?>, margin: 0
    });
  } catch (e) { console.warn('Barcode error:', e); }
});
setTimeout(() => window.print(), 500);
</script>
