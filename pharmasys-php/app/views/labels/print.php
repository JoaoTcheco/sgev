<?php
$settings = SettingModel::get();
$labels = [];
foreach ($selection as $sel) {
    for ($i = 0; $i < $sel['qty']; $i++) $labels[] = $sel['product'];
}
?>
<div class="labels-grid">
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
      format: 'CODE128', displayValue: false, width: 1.3, height: 32, margin: 0
    });
  } catch (e) { console.warn('Barcode error:', e); }
});
setTimeout(() => window.print(), 400);
</script>
