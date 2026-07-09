<?php
// Consolida sale_items com o mesmo produto+preço (múltiplos lotes viram uma linha visual)
$grouped = [];
foreach ($items as $it) {
    $k = $it['product_id'] . '|' . $it['unit_price'] . '|' . $it['unit_kind'];
    if (!isset($grouped[$k])) $grouped[$k] = $it;
    else {
        $grouped[$k]['quantity'] += $it['quantity'];
        $grouped[$k]['total']    += $it['total'];
    }
}
$width       = strtolower($settings['receipt_width'] ?? '80mm');
$showBarcode = !empty($settings['receipt_show_barcode']);
$showQr      = !empty($settings['receipt_show_qr']);
$payLabels = [
  'cash'=>'💵 Numerário', 'mpesa'=>'📱 M-Pesa', 'emola'=>'📱 E-Mola',
  'card'=>'💳 Cartão',    'transfer'=>'🏦 Transferência',
];
$payMain = $payLabels[$sale['payment_method']] ?? strtoupper($sale['payment_method']);
if (!empty($sale['payment_wallet']) && isset($payLabels[$sale['payment_wallet']])) $payMain = $payLabels[$sale['payment_wallet']];

// Ajuste do código de barras conforme largura do recibo
$bcWidth  = $width === '58mm' ? 1.1 : ($width === 'a4' ? 1.8 : 1.4);
$bcHeight = $width === '58mm' ? 26  : ($width === 'a4' ? 50  : 36);
?>
<div class="receipt receipt-<?= e(str_replace('mm','',$width)) ?>">
  <?php if (!empty($settings['logo_url'])): ?>
    <img src="<?= e($settings['logo_url']) ?>" alt="Logo" class="logo">
  <?php endif; ?>
  <h1><?= e($settings['name'] ?? 'PharmaSys') ?></h1>
  <?php if (!empty($settings['slogan'])): ?><p class="slogan"><em><?= e($settings['slogan']) ?></em></p><?php endif; ?>
  <?php if (!empty($settings['address'])): ?><p><?= nl2br(e($settings['address'])) ?><?= !empty($settings['city']) ? ' — '.e($settings['city']) : '' ?></p><?php endif; ?>
  <?php if (!empty($settings['phone']) || !empty($settings['email'])): ?>
    <p>
      <?= !empty($settings['phone']) ? 'Tel: '.e($settings['phone']) : '' ?>
      <?= (!empty($settings['phone']) && !empty($settings['email'])) ? ' · ' : '' ?>
      <?= !empty($settings['email']) ? e($settings['email']) : '' ?>
    </p>
  <?php endif; ?>
  <?php if (!empty($settings['nuit'])): ?><p>NUIT: <?= e($settings['nuit']) ?></p><?php endif; ?>
  <?php if (!empty($settings['website'])): ?><p><?= e($settings['website']) ?></p><?php endif; ?>

  <?php if (!empty($settings['receipt_header'])): ?>
    <p class="hdr-note"><?= nl2br(e($settings['receipt_header'])) ?></p>
  <?php endif; ?>

  <div class="sep double"></div>
  <p class="meta">
    <strong>RECIBO Nº <?= e($sale['receipt_number']) ?></strong><br>
    Data: <?= e(formatDateTime($sale['created_at'])) ?><br>
    Atendente: <?= e($sale['user_name']) ?><br>
    <?php if (!empty($settings['show_pharmacist']) && !empty($settings['pharmacist_name'])): ?>
      Farmacêutico: <?= e($settings['pharmacist_name']) ?><br>
    <?php endif; ?>
    <?php if ($sale['customer_name']): ?>
      Cliente: <?= e($sale['customer_name']) ?>
      <?= $sale['customer_tax_id'] ? '<br>NUIT: '.e($sale['customer_tax_id']) : '' ?><br>
    <?php endif; ?>
  </p>

  <div class="sep"></div>
  <table class="items">
    <thead><tr><th class="l">Descrição</th><th class="r">Qtd</th><th class="r">P.Un</th><th class="r">Total</th></tr></thead>
    <tbody>
    <?php foreach ($grouped as $it): ?>
      <tr>
        <td colspan="4" class="p-name">
          <?= e($it['product_name']) ?><?= $it['unit_kind']==='sub' ? ' <small>('.e($it['unit_label']).')</small>' : '' ?>
        </td>
      </tr>
      <tr class="p-row">
        <td class="l"></td>
        <td class="r"><?= (int)$it['quantity'] ?></td>
        <td class="r"><?= e(formatMZN($it['unit_price'])) ?></td>
        <td class="r"><strong><?= e(formatMZN($it['total'])) ?></strong></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>

  <div class="sep"></div>
  <table class="totals">
    <tr><td>Subtotal</td><td class="r"><?= e(formatMZN($sale['subtotal'])) ?></td></tr>
    <?php if ((float)$sale['discount'] > 0): ?>
      <tr><td>Desconto</td><td class="r">- <?= e(formatMZN($sale['discount'])) ?></td></tr>
    <?php endif; ?>
    <tr class="grand"><td><strong>TOTAL</strong></td><td class="r"><strong><?= e(formatMZN($sale['total'])) ?></strong></td></tr>
    <tr><td>Pagamento</td><td class="r"><?= e($payMain) ?></td></tr>
    <?php if (!empty($sale['payment_ref'])): ?>
      <tr><td>Ref.</td><td class="r"><?= e($sale['payment_ref']) ?></td></tr>
    <?php endif; ?>
    <?php if ($sale['amount_received'] !== null && $sale['payment_method']==='cash'): ?>
      <tr><td>Valor recebido</td><td class="r"><?= e(formatMZN($sale['amount_received'])) ?></td></tr>
      <tr class="change"><td><strong>TROCO</strong></td><td class="r"><strong><?= e(formatMZN($sale['change_amount'])) ?></strong></td></tr>
    <?php endif; ?>
  </table>

  <?php if ($showBarcode): ?>
    <div class="sep"></div>
    <div class="bc-wrap">
      <svg class="barcode" data-value="<?= e($sale['receipt_number']) ?>"></svg>
      <div class="bc-code"><?= e($sale['receipt_number']) ?></div>
    </div>
  <?php endif; ?>

  <?php if (!empty($settings['receipt_footer'])): ?>
    <div class="sep"></div>
    <p class="footer-note"><?= nl2br(e($settings['receipt_footer'])) ?></p>
  <?php endif; ?>
  <p class="footer">— OBRIGADO PELA PREFERÊNCIA —</p>
  <p class="footer tiny">Processado por PharmaSys · <?= e(date('Y-m-d H:i')) ?></p>
</div>

<?php if ($showBarcode): ?>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<script>
document.querySelectorAll('svg.barcode').forEach(el => {
  try {
    JsBarcode(el, el.dataset.value, {
      format: 'CODE128',
      width: <?= $bcWidth ?>,
      height: <?= $bcHeight ?>,
      displayValue: false,
      margin: 0
    });
  } catch (e) { console.warn(e); }
});
</script>
<?php endif; ?>
