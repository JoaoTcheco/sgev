<?php /** @var array $po */ /** @var array $items */ ?>
<link rel="stylesheet" href="<?= asset('css/purchases.css') ?>">

<div class="page-header">
  <div>
    <h1>Receber OC <?= e($po['po_number']) ?></h1>
    <p class="muted">Indique quantidades, lote e validade. Serão criados lotes automaticamente e o stock será actualizado.</p>
  </div>
  <div class="page-actions">
    <a href="<?= url('purchases/view&id='.$po['id']) ?>" class="btn btn-ghost">Cancelar</a>
  </div>
</div>

<form method="post" action="<?= url('purchases/receive/submit') ?>">
  <?= csrfField() ?>
  <input type="hidden" name="id" value="<?= e($po['id']) ?>">

  <div class="card">
    <table class="po-items">
      <thead><tr>
        <th>Produto</th>
        <th class="right">Pedido</th>
        <th class="right">Já recebido</th>
        <th class="right">Pendente</th>
        <th style="width:12%">Receber agora</th>
        <th style="width:16%">Nº Lote</th>
        <th style="width:14%">Validade *</th>
      </tr></thead>
      <tbody>
      <?php foreach ($items as $it):
        $pend = (int)$it['quantity_ordered'] - (int)$it['quantity_received'];
        $defaultBatch = $it['batch_number'] ?: ('OC-'.substr($po['po_number'], -8));
      ?>
        <tr class="<?= $pend<=0 ? 'row-done' : '' ?>">
          <td><?= e($it['product_name']) ?></td>
          <td class="right"><?= (int)$it['quantity_ordered'] ?></td>
          <td class="right"><?= (int)$it['quantity_received'] ?></td>
          <td class="right"><strong><?= $pend ?></strong></td>
          <td>
            <input type="number" min="0" max="<?= $pend ?>"
                   name="receipts[<?= e($it['id']) ?>][qty]"
                   value="<?= $pend ?>" <?= $pend<=0?'disabled':'' ?>>
          </td>
          <td>
            <input type="text" name="receipts[<?= e($it['id']) ?>][batch_number]"
                   value="<?= e($defaultBatch) ?>" <?= $pend<=0?'disabled':'' ?>>
          </td>
          <td>
            <input type="date" name="receipts[<?= e($it['id']) ?>][expiry_date]"
                   value="<?= e($it['expiry_date'] ?? '') ?>" <?= $pend<=0?'disabled':'' ?>>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>

  <div class="form-actions">
    <button class="btn btn-primary">📦 Confirmar receção</button>
    <a href="<?= url('purchases/view&id='.$po['id']) ?>" class="btn btn-ghost">Cancelar</a>
  </div>
</form>
