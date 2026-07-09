<?php /** @var ?array $po */ /** @var array $items */ /** @var array $suppliers */ /** @var array $products */ ?>
<link rel="stylesheet" href="<?= asset('css/purchases.css') ?>">

<div class="page-header">
  <div>
    <h1><?= $po ? 'Editar OC '.e($po['po_number']) : 'Nova Ordem de Compra' ?></h1>
    <p class="muted">Preencha os dados do fornecedor e adicione os produtos.</p>
  </div>
  <div class="page-actions"><a href="<?= url($po ? 'purchases/view&id='.$po['id'] : 'purchases') ?>" class="btn btn-ghost">Cancelar</a></div>
</div>

<form method="post" action="<?= url('purchases/save') ?>" id="po-form" class="po-form">
  <?= csrfField() ?>
  <?php if ($po): ?><input type="hidden" name="id" value="<?= e($po['id']) ?>"><?php endif; ?>

  <div class="card">
    <div class="form-grid">
      <div class="form-field">
        <label>Fornecedor *</label>
        <select name="supplier_id" required>
          <option value="">— seleccionar —</option>
          <?php foreach ($suppliers as $s): ?>
            <option value="<?= e($s['id']) ?>" <?= ($po && $po['supplier_id']===$s['id'])?'selected':'' ?>><?= e($s['legal_name']) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div class="form-field">
        <label>Data prevista de entrega</label>
        <input type="date" name="expected_date" value="<?= e($po['expected_date'] ?? '') ?>">
      </div>
      <div class="form-field">
        <label>Desconto (MT)</label>
        <input type="number" step="0.01" min="0" name="discount" value="<?= e($po['discount'] ?? '0') ?>">
      </div>
      <div class="form-field" style="grid-column: 1 / -1;">
        <label>Notas</label>
        <textarea name="notes" rows="2"><?= e($po['notes'] ?? '') ?></textarea>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="items-header">
      <h3>Itens</h3>
      <button type="button" class="btn btn-outline btn-sm" id="add-item">+ Adicionar produto</button>
    </div>
    <table class="po-items">
      <thead><tr>
        <th style="width:40%">Produto</th>
        <th style="width:15%">Quantidade</th>
        <th style="width:20%">Custo unitário (MT)</th>
        <th style="width:20%" class="right">Subtotal</th>
        <th></th>
      </tr></thead>
      <tbody id="items-body">
        <?php if ($items): foreach ($items as $i => $it): ?>
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
            <td><input type="number" min="1" name="items[<?= $i ?>][quantity_ordered]" class="qty" value="<?= (int)$it['quantity_ordered'] ?>" required></td>
            <td><input type="number" min="0" step="0.01" name="items[<?= $i ?>][unit_cost]" class="cost" value="<?= e($it['unit_cost']) ?>" required></td>
            <td class="right"><span class="line-total">0,00 MT</span></td>
            <td><button type="button" class="btn-remove">✕</button></td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="right"><strong>Subtotal</strong></td>
          <td class="right"><strong id="subtotal">0,00 MT</strong></td>
          <td></td>
        </tr>
        <tr>
          <td colspan="3" class="right">Desconto</td>
          <td class="right" id="discount-view">0,00 MT</td>
          <td></td>
        </tr>
        <tr>
          <td colspan="3" class="right"><strong>Total</strong></td>
          <td class="right"><strong id="total" class="total-big">0,00 MT</strong></td>
          <td></td>
        </tr>
      </tfoot>
    </table>
    <p class="muted small" id="no-items" style="display:none">Nenhum item ainda. Clique em "Adicionar produto".</p>
  </div>

  <div class="form-actions">
    <button type="submit" class="btn btn-primary">💾 Guardar rascunho</button>
    <a href="<?= url('purchases') ?>" class="btn btn-ghost">Cancelar</a>
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
    <td><input type="number" min="1" name="items[__i__][quantity_ordered]" class="qty" value="1" required></td>
    <td><input type="number" min="0" step="0.01" name="items[__i__][unit_cost]" class="cost" value="0" required></td>
    <td class="right"><span class="line-total">0,00 MT</span></td>
    <td><button type="button" class="btn-remove">✕</button></td>
  </tr>
</template>

<script src="<?= asset('js/purchases.js') ?>"></script>
