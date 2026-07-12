<?php
// Agrupa items por produto+preço+unidade (múltiplos lotes → linha única visual, mantém IDs para estorno)
$grouped = [];
foreach ($items as $it) {
    $k = $it['product_id'] . '|' . $it['unit_price'] . '|' . $it['unit_kind'];
    if (!isset($grouped[$k])) $grouped[$k] = ['sample' => $it, 'rows' => []];
    $grouped[$k]['rows'][] = $it;
}
$canRefund = hasRole('admin','pharmacist') && $sale['status'] !== 'refunded';

// ---- Validação de integridade do recibo (campos + totais) ----
$itemsSum = 0.0; $itemCount = 0; $missingFields = [];
foreach ($items as $it) {
    $itemsSum += (float)$it['total'];
    $itemCount += (int)$it['quantity'];
    foreach (['product_name','quantity','unit_price','total'] as $req) {
        if ($it[$req] === null || $it[$req] === '') $missingFields[] = $req;
    }
}
$eps = 0.01;
$subtotal = (float)$sale['subtotal']; $discount = (float)$sale['discount']; $total = (float)$sale['total'];
$checks = [
    'Nº de recibo presente'      => !empty($sale['receipt_number']),
    'Atendente identificado'     => !empty($sale['user_name']),
    'Método de pagamento válido' => in_array($sale['payment_method'], ['cash','mpesa','emola','card','transfer'], true),
    'Contém itens'               => $itemCount > 0,
    'Soma dos itens = subtotal'  => abs($itemsSum - $subtotal) < $eps,
    'Total = Subtotal − Desconto'=> abs(($subtotal - $discount) - $total) < $eps,
    'Sem campos vazios em itens' => empty($missingFields),
];
$allOk = !in_array(false, $checks, true);
?>
<section class="crud">
  <a href="<?= url('history') ?>" class="btn btn-ghost btn-sm" style="margin-bottom:12px;">← Voltar ao histórico</a>

  <div class="hist-view-header">
    <div>
      <h1 class="page-title">Recibo <?= e($sale['receipt_number']) ?></h1>
      <p class="page-subtitle">
        <?= e(formatDateTime($sale['created_at'])) ?> · Atendente <?= e($sale['user_name']) ?>
      </p>
    </div>
    <div class="hist-view-actions">
      <a href="<?= url('sales/receipt') ?>&id=<?= e($sale['id']) ?>" target="_blank" class="btn btn-ghost">🖨️ Reimprimir</a>
      <a href="<?= url('sales/receipt') ?>&id=<?= e($sale['id']) ?>&pdf=1" target="_blank" class="btn btn-primary">📄 Baixar PDF</a>
      <?php $badge = ['completed'=>'badge-green','partial_refund'=>'badge-orange','refunded'=>'badge-red'][$sale['status']]; ?>
      <span class="badge <?= $badge ?>" style="font-size:14px;padding:6px 12px;">
        <?= ['completed'=>'Concluída','partial_refund'=>'Estorno parcial','refunded'=>'Estornada'][$sale['status']] ?>
      </span>
    </div>
  </div>

  <div class="hist-validate <?= $allOk ? '' : 'invalid' ?>">
    <h3><?= $allOk ? '✅ Recibo válido — todos os campos íntegros' : '⚠️ Recibo com inconsistências' ?></h3>
    <ul>
      <?php foreach ($checks as $label => $ok): ?>
        <li><span class="<?= $ok?'ok':'err' ?>"><?= $ok?'✓':'✗' ?></span> <?= e($label) ?></li>
      <?php endforeach; ?>
    </ul>
  </div>


  <form method="POST" action="<?= url('history/refund') ?>" class="hist-detail" onsubmit="return confirm('Confirmar estorno? Reverte stock e conta financeira.');">
    <?= csrfField() ?>
    <input type="hidden" name="sale_id" value="<?= e($sale['id']) ?>">

    <div class="crud-table-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Produto</th><th>Un.</th><th>Preço</th><th>Vendido</th><th>Já estornado</th><th>Disponível</th>
            <?php if ($canRefund): ?><th style="width:160px;">Estornar</th><?php endif; ?>
          </tr>
        </thead>
        <tbody>
        <?php foreach ($grouped as $g):
          $s = $g['sample'];
          $totalQty      = array_sum(array_map(fn($r)=>(int)$r['quantity'],     $g['rows']));
          $totalRefunded = array_sum(array_map(fn($r)=>(int)$r['refunded_qty'], $g['rows']));
          $available     = $totalQty - $totalRefunded;
        ?>
          <tr>
            <td><strong><?= e($s['product_name']) ?></strong></td>
            <td><span class="tag <?= e($s['unit_kind']) ?>"><?= e($s['unit_label']) ?></span></td>
            <td><?= e(formatMZN($s['unit_price'])) ?></td>
            <td><?= $totalQty ?></td>
            <td class="<?= $totalRefunded>0?'orange':'' ?>"><?= $totalRefunded ?></td>
            <td><strong><?= $available ?></strong></td>
            <?php if ($canRefund): ?>
              <td>
                <?php if ($available > 0): ?>
                  <?php foreach ($g['rows'] as $row):
                    $itemAvail = (int)$row['quantity'] - (int)$row['refunded_qty'];
                    if ($itemAvail <= 0) continue; ?>
                    <input type="number" name="refund[<?= e($row['id']) ?>]" min="0" max="<?= $itemAvail ?>"
                           value="0" data-max="<?= $itemAvail ?>" class="refund-inp"
                           title="Lote — máx: <?= $itemAvail ?>">
                  <?php endforeach; ?>
                <?php else: ?>—<?php endif; ?>
              </td>
            <?php endif; ?>
          </tr>
        <?php endforeach; ?>
        </tbody>
      </table>
    </div>

    <div class="hist-totals-view">
      <div><span>Subtotal</span><strong><?= e(formatMZN($sale['subtotal'])) ?></strong></div>
      <?php if ((float)$sale['discount'] > 0): ?><div><span>Desconto</span><strong>- <?= e(formatMZN($sale['discount'])) ?></strong></div><?php endif; ?>
      <div class="grand"><span>TOTAL</span><strong><?= e(formatMZN($sale['total'])) ?></strong></div>
      <div><span>Pagamento</span><strong><?= e(strtoupper($sale['payment_method'])) ?></strong></div>
    </div>

    <?php if ($canRefund): ?>
      <div class="refund-actions">
        <label>Motivo do estorno (opcional)</label>
        <input type="text" name="reason" placeholder="Ex: produto trocado, cliente desistiu…">
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" onclick="refundAll()">Preencher tudo (estorno total)</button>
          <button type="submit" class="btn btn-danger">Confirmar estorno</button>
        </div>
      </div>
    <?php elseif ($sale['status'] === 'refunded'): ?>
      <p class="empty" style="margin-top:16px;">Esta venda foi totalmente estornada.</p>
    <?php endif; ?>

    <?php if ($sale['notes']): ?>
      <details class="hist-notes"><summary>Notas / histórico</summary><pre><?= e($sale['notes']) ?></pre></details>
    <?php endif; ?>
  </form>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
<link rel="stylesheet" href="<?= asset('css/history.css') ?>">
<link rel="stylesheet" href="<?= asset('css/pdv.css') ?>">
<script>
function refundAll(){
  document.querySelectorAll('.refund-inp').forEach(i => i.value = i.dataset.max);
}
document.querySelectorAll('.refund-inp').forEach(i => {
  i.addEventListener('input', () => {
    const max = +i.dataset.max, v = +i.value || 0;
    if (v > max) i.value = max;
    if (v < 0)   i.value = 0;
  });
});
</script>
