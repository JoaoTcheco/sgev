<?php /** @var array $sr */ /** @var array $items */ /** @var array $reasons */ ?>
<link rel="stylesheet" href="<?= asset('css/purchases.css') ?>">
<link rel="stylesheet" href="<?= asset('css/supplier_returns.css') ?>">

<div class="page-header">
  <div>
    <h1>Devolução <?= e($sr['sr_number']) ?></h1>
    <p class="muted">
      <?= e($sr['supplier_name']) ?> · criada em <?= formatDate($sr['created_at']) ?>
      · <span class="po-status po-status-<?= e($sr['status']) ?>"><?= e(['draft'=>'Rascunho','confirmed'=>'Confirmada','cancelled'=>'Cancelada'][$sr['status']] ?? $sr['status']) ?></span>
    </p>
  </div>
  <div class="page-actions">
    <a href="<?= url('supplier-returns') ?>" class="btn btn-ghost">← Voltar</a>
    <?php if ($sr['status']==='draft'): ?>
      <a href="<?= url('supplier-returns/edit&id='.$sr['id']) ?>" class="btn btn-outline">✏️ Editar</a>
      <form method="post" action="<?= url('supplier-returns/confirm') ?>" style="display:inline"
            onsubmit="return confirm('Confirmar devolução? Isto irá debitar o stock e criar um crédito no fornecedor.');">
        <?= csrfField() ?><input type="hidden" name="id" value="<?= e($sr['id']) ?>">
        <button class="btn btn-primary">✅ Confirmar devolução</button>
      </form>
      <form method="post" action="<?= url('supplier-returns/cancel') ?>" style="display:inline"
            onsubmit="return confirm('Cancelar esta devolução?');">
        <?= csrfField() ?><input type="hidden" name="id" value="<?= e($sr['id']) ?>">
        <button class="btn btn-ghost">Cancelar</button>
      </form>
    <?php endif; ?>
    <?php if (in_array($sr['status'], ['draft','cancelled'], true)): ?>
      <form method="post" action="<?= url('supplier-returns/delete') ?>" style="display:inline"
            onsubmit="return confirm('Eliminar definitivamente?');">
        <?= csrfField() ?><input type="hidden" name="id" value="<?= e($sr['id']) ?>">
        <button class="btn btn-danger">🗑 Eliminar</button>
      </form>
    <?php endif; ?>
  </div>
</div>

<div class="grid-2">
  <div class="card">
    <h3>Detalhes</h3>
    <dl class="kv">
      <dt>Fornecedor</dt><dd><?= e($sr['supplier_name']) ?></dd>
      <dt>Motivo</dt><dd><?= e($reasons[$sr['reason']] ?? $sr['reason']) ?></dd>
      <?php if ($sr['po_number']): ?><dt>OC associada</dt><dd><?= e($sr['po_number']) ?></dd><?php endif; ?>
      <dt>Responsável</dt><dd><?= e($sr['user_name'] ?? '—') ?></dd>
      <?php if ($sr['confirmed_at']): ?><dt>Confirmada em</dt><dd><?= formatDateTime($sr['confirmed_at']) ?></dd><?php endif; ?>
      <?php if ($sr['notes']): ?><dt>Notas</dt><dd><?= nl2br(e($sr['notes'])) ?></dd><?php endif; ?>
    </dl>
  </div>
  <div class="card">
    <h3>Financeiro</h3>
    <p class="total-big"><?= formatMZN($sr['total']) ?></p>
    <?php if ($sr['credit_payable_id']): ?>
      <p class="muted small">Crédito registado como conta a pagar negativa.</p>
      <a class="btn btn-outline btn-sm" href="<?= url('payables/view&id='.$sr['credit_payable_id']) ?>">Ver crédito →</a>
    <?php else: ?>
      <p class="muted small">O crédito será criado ao confirmar.</p>
    <?php endif; ?>
  </div>
</div>

<div class="card">
  <h3>Itens (<?= count($items) ?>)</h3>
  <table class="po-items">
    <thead><tr>
      <th>Produto</th><th>Lote</th><th>Validade</th>
      <th class="right">Qtd</th><th class="right">Custo unit.</th><th class="right">Subtotal</th>
    </tr></thead>
    <tbody>
      <?php foreach ($items as $it): ?>
        <tr>
          <td><?= e($it['product_name']) ?></td>
          <td><?= e($it['batch_number'] ?? '— FEFO —') ?></td>
          <td><?= $it['expiry_date'] ? formatDate($it['expiry_date']) : '—' ?></td>
          <td class="right"><?= (int)$it['quantity'] ?></td>
          <td class="right"><?= formatMZN($it['unit_cost']) ?></td>
          <td class="right"><?= formatMZN($it['total']) ?></td>
        </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
</div>
