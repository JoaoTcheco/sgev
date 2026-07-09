<section class="crud">
  <h1 class="page-title"><?= $editing ? 'Editar produto' : 'Novo produto' ?></h1>
  <form method="POST" action="<?= url('products/save') ?>" class="form-card">
    <?= csrfField() ?>
    <input type="hidden" name="id" value="<?= e($editing['id'] ?? '') ?>">

    <h3 class="form-section">Identificação</h3>
    <div class="grid-2">
      <div><label>Nome *</label>
        <input type="text" name="name" required value="<?= e($editing['name'] ?? '') ?>"></div>
      <div><label>Categoria</label>
        <select name="category_id">
          <option value="">— Sem categoria —</option>
          <?php foreach ($categories as $c): ?>
            <option value="<?= e($c['id']) ?>" <?= ($editing['category_id'] ?? '') === $c['id'] ? 'selected' : '' ?>><?= e($c['name']) ?></option>
          <?php endforeach; ?>
        </select></div>
      <div><label>Código de barras (pack)</label>
        <input type="text" name="barcode" value="<?= e($editing['barcode'] ?? '') ?>"></div>
      <div><label>Código de barras (sub-unidade)</label>
        <input type="text" name="sub_barcode" value="<?= e($editing['sub_barcode'] ?? '') ?>"></div>
    </div>
    <label>Descrição</label>
    <textarea name="description" rows="2"><?= e($editing['description'] ?? '') ?></textarea>

    <h3 class="form-section">Preços e unidades</h3>
    <div class="grid-4">
      <div><label>Unidade</label>
        <input type="text" name="unit" value="<?= e($editing['unit'] ?? 'cx') ?>" placeholder="cx, cp, ml…"></div>
      <div><label>Tamanho do pack</label>
        <input type="number" name="pack_size" min="1" value="<?= e($editing['pack_size'] ?? 1) ?>"></div>
      <div><label>Preço custo (MT)</label>
        <input type="number" step="0.01" name="cost_price" value="<?= e($editing['cost_price'] ?? 0) ?>"></div>
      <div><label>Preço venda (MT) *</label>
        <input type="number" step="0.01" name="sale_price" required value="<?= e($editing['sale_price'] ?? 0) ?>"></div>
    </div>
    <div class="grid-2">
      <div><label>Rótulo sub-unidade (ex: "Comprimido")</label>
        <input type="text" name="sub_unit_label" value="<?= e($editing['sub_unit_label'] ?? '') ?>"></div>
      <div><label>Preço sub-unidade (MT)</label>
        <input type="number" step="0.01" name="sub_unit_price" value="<?= e($editing['sub_unit_price'] ?? '') ?>"></div>
    </div>

    <h3 class="form-section">Stock e alertas</h3>
    <div class="grid-2">
      <div><label>Stock mínimo</label>
        <input type="number" name="min_stock" min="0" value="<?= e($editing['min_stock'] ?? 5) ?>"></div>
      <div><label>Aviso de validade (dias antes)</label>
        <input type="number" name="expiry_alert_days" min="0" value="<?= e($editing['expiry_alert_days'] ?? 60) ?>"></div>
    </div>

    <label class="checkbox">
      <input type="checkbox" name="requires_prescription" <?= !empty($editing['requires_prescription']) ? 'checked' : '' ?>>
      Requer receita médica
    </label>

    <label>Notas</label>
    <textarea name="notes" rows="2"><?= e($editing['notes'] ?? '') ?></textarea>

    <div class="form-actions">
      <a class="btn btn-ghost" href="<?= url('products') ?>">Cancelar</a>
      <button class="btn btn-primary" type="submit">Guardar</button>
    </div>
  </form>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
