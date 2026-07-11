<?php /** @var ?array $sr */ /** @var array $items */ /** @var array $suppliers */ /** @var array $products */ /** @var array $reasons */ ?>

<link rel="stylesheet" href="<?= asset('css/supplier_returns.css') ?>">

<div class="page-header">
  <div>
    <h1><?= $sr ? 'Editar devolução '.e($sr['sr_number']) : 'Nova devolução a fornecedor' ?></h1>
    <p class="muted">Escolha o fornecedor, o motivo e os lotes a devolver.</p>
  </div>
  <div class="page-actions"><a href="<?= url($sr ? 'supplier-returns/view&id='.$sr['id'] : 'supplier-returns') ?>" class="btn btn-ghost">Cancelar</a></div>
</div>

<form method="post" action="<?= url('supplier-returns/save') ?>" id="sr-form" class="po-form">
  <?= csrfField() ?>
  <?php if ($sr): ?><input type="hidden" name="id" value="<?= e($sr['id']) ?>"><?php endif; ?>

  <div class="card">
    <div class="form-grid">
      <div class="form-field">
        <label>Fornecedor *</label>
        <select name="supplier_id" required>
          <option value="">— seleccionar —</option>
          <?php foreach ($suppliers as $s): ?>
            <option value="<?= e($s['id']) ?>" <?= ($sr && $sr['supplier_id']===$s['id'])?'selected':'' ?>><?= e($s['legal_name']) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="form-field">
        <label>Motivo *</label>
        <select name="reason" required>
          <?php foreach ($reasons as $k=>$v): ?>
            <option value="<?= $k ?>" <?= ($sr && $sr['reason']===$k)?'selected':'' ?>><?= e($v) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="form-field" style="grid-column:1/-1">
        <label>Notas</label>
        <textarea name="notes" rows="2"><?= e($sr['notes'] ?? '') ?></textarea>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="items-header">
      <h3>Itens a devolver</h3>
      <button type="button" class="btn btn-outline btn-sm" id="add-item">+ Adicionar item</button>
    </div>
    <table class="po-items sr-items">
      <thead><tr>
        <th style="width:30%">Produto</th>
        <th style="width:25%">Lote (opcional — FEFO se vazio)</th>
        <th style="width:12%">Qtd</th>
        <th style="width:15%">Custo unit. (MT)</th>
        <th style="width:13%" class="right">Subtotal</th>
        <th style="width:5%"></th>
      </tr></thead>
      <tbody id="items-body">
        <?php if ($items): foreach ($items as $i => $it):
          $batches = SupplierReturnModel::availableBatches($it['product_id']); ?>
          <tr class="item-row">
            <td>
              <select name="items[<?= $i ?>][product_id]" class="prod-sel" required>
                <option value="">— produto —</option>
                <?php foreach ($products as $p): ?>
                  <option value="<?= e($p['id']) ?>" data-cost="<?= e($p['cost_price']) ?>" <?= $p['id']===$it['product_id']?'selected':'' ?>>
                    <?= e($p['name']) ?>
                  </option>
                <?php endforeach; ?>
              </select>
            </td>
            <td>
              <select name="items[<?= $i ?>][batch_id]" class="batch-sel">
                <option value="">— FEFO automático —</option>
                <?php foreach ($batches as $b): ?>
                  <option value="<?= e($b['id']) ?>" <?= $b['id']===$it['batch_id']?'selected':'' ?>>
                    <?= e($b['batch_number']) ?> · val <?= formatDate($b['expiry_date']) ?> · <?= (int)$b['quantity'] ?> un
                  </option>
                <?php endforeach; ?>
              </select>
            </td>
            <td><input type="number" min="1" name="items[<?= $i ?>][quantity]" class="qty" value="<?= (int)$it['quantity'] ?>" required></td>
            <td><input type="number" min="0" step="0.01" name="items[<?= $i ?>][unit_cost]" class="cost" value="<?= e($it['unit_cost']) ?>" required></td>
            <td class="right"><span class="line-total">0,00 MT</span></td>
            <td><button type="button" class="btn-remove">✕</button></td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" class="right"><strong>Total</strong></td>
          <td class="right"><strong id="total" class="total-big">0,00 MT</strong></td>
          <td></td>
        </tr>
      </tfoot>
    </table>
    <p class="muted small" id="no-items" style="display:none">Nenhum item ainda.</p>
  </div>

  <div class="form-actions">
    <button type="submit" class="btn btn-primary">💾 Guardar rascunho</button>
    <a href="<?= url('supplier-returns') ?>" class="btn btn-ghost">Cancelar</a>
  </div>
</form>

<template id="row-tpl">
  <tr class="item-row">
    <td>
      <select name="items[__i__][product_id]" class="prod-sel" required>
        <option value="">— produto —</option>
        <?php foreach ($products as $p): ?>
          <option value="<?= e($p['id']) ?>" data-cost="<?= e($p['cost_price']) ?>"><?= e($p['name']) ?></option>
        <?php endforeach; ?>
      </select>
    </td>
    <td>
      <select name="items[__i__][batch_id]" class="batch-sel">
        <option value="">— FEFO automático —</option>
      </select>
    </td>
    <td><input type="number" min="1" name="items[__i__][quantity]" class="qty" value="1" required></td>
    <td><input type="number" min="0" step="0.01" name="items[__i__][unit_cost]" class="cost" value="0" required></td>
    <td class="right"><span class="line-total">0,00 MT</span></td>
    <td><button type="button" class="btn-remove">✕</button></td>
  </tr>
</template>

<script>
window.SR_BATCHES_URL = <?= json_encode(url('supplier-returns/batches')) ?>;
</script>
<script src="<?= asset('js/supplier_returns.js') ?>"></script>
