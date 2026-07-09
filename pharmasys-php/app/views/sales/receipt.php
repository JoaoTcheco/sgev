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
?>
<div class="receipt">
  <?php if (!empty($settings['logo_url'])): ?>
    <img src="<?= e($settings['logo_url']) ?>" alt="Logo" class="logo">
  <?php endif; ?>
  <h1><?= e($settings['name'] ?? 'PharmaSys') ?></h1>
  <?php if (!empty($settings['address'])): ?><p><?= nl2br(e($settings['address'])) ?></p><?php endif; ?>
  <?php if (!empty($settings['phone'])):   ?><p>Tel: <?= e($settings['phone']) ?></p><?php endif; ?>
  <?php if (!empty($settings['tax_id'])):  ?><p>NUIT: <?= e($settings['tax_id']) ?></p><?php endif; ?>

  <?php if (!empty($settings['receipt_header'])): ?>
    <p class="hdr-note"><?= nl2br(e($settings['receipt_header'])) ?></p>
  <?php endif; ?>

  <div class="sep"></div>
  <p class="meta">
    <strong>Recibo <?= e($sale['receipt_number']) ?></strong><br>
    <?= e(formatDateTime($sale['created_at'])) ?><br>
    Atendente: <?= e($sale['user_name']) ?><br>
    <?php if ($sale['customer_name']): ?>
      Cliente: <?= e($sale['customer_name']) ?>
      <?= $sale['customer_tax_id'] ? '<br>NUIT: '.e($sale['customer_tax_id']) : '' ?><br>
    <?php endif; ?>
  </p>

  <div class="sep"></div>
  <table class="items">
    <?php foreach ($grouped as $it): ?>
      <tr class="item">
        <td colspan="3"><?= e($it['product_name']) ?><?= $it['unit_kind']==='sub' ? ' ('.e($it['unit_label']).')' : '' ?></td>
      </tr>
      <tr class="item">
        <td><?= (int)$it['quantity'] ?> ×</td>
        <td class="r"><?= e(formatMZN($it['unit_price'])) ?></td>
        <td class="r"><?= e(formatMZN($it['total'])) ?></td>
      </tr>
    <?php endforeach; ?>
  </table>

  <div class="sep"></div>
  <table class="totals">
    <tr><td>Subtotal</td><td class="r"><?= e(formatMZN($sale['subtotal'])) ?></td></tr>
    <?php if ((float)$sale['discount'] > 0): ?>
      <tr><td>Desconto</td><td class="r">- <?= e(formatMZN($sale['discount'])) ?></td></tr>
    <?php endif; ?>
    <tr class="grand"><td><strong>TOTAL</strong></td><td class="r"><strong><?= e(formatMZN($sale['total'])) ?></strong></td></tr>
    <tr><td>Pagamento</td><td class="r"><?= e(strtoupper($sale['payment_method'])) ?></td></tr>
  </table>

  <?php if (!empty($settings['receipt_footer'])): ?>
    <div class="sep"></div>
    <p class="footer-note"><?= nl2br(e($settings['receipt_footer'])) ?></p>
  <?php endif; ?>
  <p class="footer">— OBRIGADO PELA PREFERÊNCIA —</p>
</div>
