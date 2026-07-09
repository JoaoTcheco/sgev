<?php /** @var array $po */ /** @var array $items */ ?>
<link rel="stylesheet" href="<?= asset('css/purchases.css') ?>">

<div class="page-header">
  <div>
    <h1>OC <?= e($po['po_number']) ?>
      <span class="po-status po-status-<?= e($po['status']) ?>"><?= ['draft'=>'Rascunho','confirmed'=>'Confirmada','partial'=>'Parcial','received'=>'Recebida','cancelled'=>'Cancelada'][$po['status']] ?? $po['status'] ?></span>
    </h1>
    <p class="muted">Criada em <?= formatDateTime($po['created_at']) ?> por <?= e($po['user_name'] ?: '—') ?></p>
  </div>
  <div class="page-actions">
    <a href="<?= url('purchases') ?>" class="btn btn-ghost">← Voltar</a>
    <?php if ($po['status']==='draft'): ?>
      <a href="<?= url('purchases/edit&id='.$po['id']) ?>" class="btn btn-outline">✎ Editar</a>
      <form method="post" action="<?= url('purchases/confirm') ?>" style="display:inline">
        <?= csrfField() ?><input type="hidden" name="id" value="<?= e($po['id']) ?>">
        <button class="btn btn-primary" onclick="return confirm('Confirmar esta OC?')">✓ Confirmar</button>
      </form>
    <?php endif; ?>
    <?php if (in_array($po['status'], ['confirmed','partial'], true)): ?>
      <a href="<?= url('purchases/receive&id='.$po['id']) ?>" class="btn btn-primary">📦 Receber mercadoria</a>
    <?php endif; ?>
    <?php if (!in_array($po['status'], ['received','cancelled'], true)): ?>
      <form method="post" action="<?= url('purchases/cancel') ?>" style="display:inline">
        <?= csrfField() ?><input type="hidden" name="id" value="<?= e($po['id']) ?>">
        <button class="btn btn-danger-outline" onclick="return confirm('Cancelar esta OC?')">Cancelar OC</button>
      </form>
    <?php endif; ?>
  </div>
</div>

<div class="card">
  <div class="po-detail-grid">
    <div><span class="dl-label">Fornecedor</span><span class="dl-value"><?= e($po['supplier_name']) ?></span></div>
    <div><span class="dl-label">Contacto</span><span class="dl-value"><?= e($po['contact_name'] ?: '—') ?> · <?= e($po['phone'] ?: '') ?></span></div>
    <div><span class="dl-label">Data prevista</span><span class="dl-value"><?= $po['expected_date'] ? formatDate($po['expected_date']) : '—' ?></span></div>
    <div><span class="dl-label">Confirmada em</span><span class="dl-value"><?= $po['confirmed_at'] ? formatDateTime($po['confirmed_at']) : '—' ?></span></div>
    <div><span class="dl-label">Recebida em</span><span class="dl-value"><?= $po['received_at'] ? formatDateTime($po['received_at']) : '—' ?></span></div>
    <div><span class="dl-label">Utilizador</span><span class="dl-value"><?= e($po['user_name']) ?></span></div>
    <?php if ($po['notes']): ?>
    <div style="grid-column: 1 / -1"><span class="dl-label">Notas</span><span class="dl-value"><?= nl2br(e($po['notes'])) ?></span></div>
    <?php endif; ?>
  </div>
</div>

<div class="card">
  <h3>Itens</h3>
  <table class="po-items">
    <thead><tr>
      <th>Produto</th>
      <th class="right">Qtd. pedida</th>
      <th class="right">Qtd. recebida</th>
      <th class="right">Pendente</th>
      <th class="right">Custo unit.</th>
      <th class="right">Total</th>
      <th>Lote / Validade</th>
    </tr></thead>
    <tbody>
      <?php foreach ($items as $it):
        $pend = (int)$it['quantity_ordered'] - (int)$it['quantity_received']; ?>
        <tr>
          <td><?= e($it['product_name']) ?></td>
          <td class="right"><?= (int)$it['quantity_ordered'] ?></td>
          <td class="right"><?= (int)$it['quantity_received'] ?></td>
          <td class="right"><?php if ($pend>0): ?><strong class="pending"><?= $pend ?></strong><?php else: ?><span class="muted">0</span><?php endif; ?></td>
          <td class="right"><?= formatMZN($it['unit_cost']) ?></td>
          <td class="right"><?= formatMZN($it['total']) ?></td>
          <td class="small">
            <?php if ($it['batch_number']): ?>
              <?= e($it['batch_number']) ?><br><span class="muted"><?= formatDate($it['expiry_date']) ?></span>
            <?php else: ?><span class="muted">—</span><?php endif; ?>
          </td>
        </tr>
      <?php endforeach; ?>
    </tbody>
    <tfoot>
      <tr><td colspan="5" class="right"><strong>Subtotal</strong></td><td class="right"><strong><?= formatMZN($po['subtotal']) ?></strong></td><td></td></tr>
      <tr><td colspan="5" class="right">Desconto</td><td class="right"><?= formatMZN($po['discount']) ?></td><td></td></tr>
      <tr><td colspan="5" class="right"><strong>Total</strong></td><td class="right"><strong class="total-big"><?= formatMZN($po['total']) ?></strong></td><td></td></tr>
    </tfoot>
  </table>
</div>

<?php if ($po['status']==='draft'): ?>
<form method="post" action="<?= url('purchases/delete') ?>" onsubmit="return confirm('Eliminar definitivamente esta OC em rascunho?')" style="margin-top:16px">
  <?= csrfField() ?><input type="hidden" name="id" value="<?= e($po['id']) ?>">
  <button class="btn btn-danger-outline btn-sm">🗑 Eliminar rascunho</button>
</form>
<?php endif; ?>
