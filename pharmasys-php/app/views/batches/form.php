<section class="crud">
  <h1 class="page-title"><?= $editing ? 'Editar lote' : 'Nova entrada de mercadoria' ?></h1>
  <p class="page-subtitle">
    <?= $editing ? 'Ajuste dos dados do lote. Para alterar quantidade usa o botão "Ajustar" na página do produto.' : 'A quantidade indicada será somada ao stock e registada como movimento tipo IN.' ?>
  </p>

  <form method="POST" action="<?= url('batches/save') ?>" class="form-card">
    <?= csrfField() ?>
    <input type="hidden" name="id" value="<?= e($editing['id'] ?? '') ?>">

    <div class="grid-2">
      <div><label>Produto *</label>
        <?php $sel = $editing['product_id'] ?? ($_GET['product_id'] ?? ''); ?>
        <?php if ($editing): ?>
          <input type="text" disabled value="<?= e($products[array_search($sel, array_column($products, 'id'))]['name'] ?? '—') ?>">
          <input type="hidden" name="product_id" value="<?= e($sel) ?>">
        <?php else: ?>
          <select name="product_id" required>
            <option value="">— Escolhe o produto —</option>
            <?php foreach ($products as $p): ?>
              <option value="<?= e($p['id']) ?>" <?= $sel === $p['id'] ? 'selected' : '' ?>>
                <?= e($p['name']) ?> <?= $p['barcode'] ? '('.e($p['barcode']).')' : '' ?>
              </option>
            <?php endforeach; ?>
          </select>
        <?php endif; ?>
      </div>
      <div><label>Fornecedor</label>
        <select name="supplier_id">
          <option value="">— Sem fornecedor —</option>
          <?php foreach ($suppliers as $s): ?>
            <option value="<?= e($s['id']) ?>" <?= ($editing['supplier_id'] ?? '') === $s['id'] ? 'selected' : '' ?>><?= e($s['legal_name']) ?></option>
          <?php endforeach; ?>
        </select>
      </div>
      <div><label>Número do lote *</label>
        <input type="text" name="batch_number" required value="<?= e($editing['batch_number'] ?? '') ?>"></div>
      <div><label>Data de validade *</label>
        <input type="date" name="expiry_date" required value="<?= e($editing['expiry_date'] ?? '') ?>"></div>

      <?php if (!$editing): ?>
      <div><label>Quantidade *</label>
        <input type="number" name="quantity" min="1" required></div>
      <?php endif; ?>
      <div><label>Custo unitário (MT)</label>
        <input type="number" step="0.01" name="cost_price" value="<?= e($editing['cost_price'] ?? 0) ?>"></div>
    </div>

    <label>Notas</label>
    <textarea name="notes" rows="2"><?= e($editing['notes'] ?? '') ?></textarea>

    <?php if (!$editing): ?>
      <label class="checkbox" style="margin-top:8px;">
        <input type="checkbox" name="print_labels" value="1" checked>
        Imprimir etiquetas para este lote logo após guardar
      </label>
    <?php endif; ?>

    <div class="form-actions">
      <a class="btn btn-ghost" href="<?= url('batches') ?>">Cancelar</a>
      <button class="btn btn-primary" type="submit"><?= $editing ? 'Actualizar' : 'Registar entrada' ?></button>
    </div>

  </form>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
