<section class="crud">
  <h1 class="page-title"><?= $editing ? 'Editar lote' : 'Nova entrada de mercadoria' ?></h1>
  <p class="page-subtitle">
    <?= $editing ? 'Ajuste dos dados do lote. Para alterar quantidade usa o botão "Ajustar" na página do produto.' : 'A quantidade indicada será somada ao stock e registada como movimento tipo IN.' ?>
  </p>

  <form method="POST" action="<?= url('batches/save') ?>" class="form-card">
    <?= csrfField() ?>
    <input type="hidden" name="id" value="<?= e($editing['id'] ?? '') ?>">

    <?php if (!$editing): ?>
    <div class="scan-box" style="background:#f0fdfa;border:1px dashed #0f766e;padding:14px 16px;border-radius:10px;margin-bottom:16px;">
      <label style="font-weight:600;color:#0f766e;">📷 Escaneie o código de barras da embalagem</label>
      <p style="margin:4px 0 10px;font-size:13px;color:#475569;">
        Use o código do <strong>fornecedor</strong> (EAN/GTIN da embalagem) ou o seu código interno.
        O produto é seleccionado automaticamente. Se não existir, poderá cadastrá-lo com o código já preenchido.
      </p>
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="text" id="scan-barcode" autofocus autocomplete="off"
               placeholder="Aponte o leitor aqui e escaneie…"
               style="flex:1;font-size:16px;padding:10px 12px;">
        <span id="scan-status" style="font-size:13px;font-weight:600;min-width:180px;"></span>
      </div>
    </div>
    <?php endif; ?>

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
<script>
(function(){
  const input = document.getElementById('scan-barcode');
  const status = document.getElementById('scan-status');
  const select = document.querySelector('select[name="product_id"]');
  if (!input || !select) return;
  const lookupUrl = <?= json_encode(url('products/lookup')) ?>;
  const newProdUrl = <?= json_encode(url('products/new')) ?>;
  async function lookup(v){
    status.textContent = 'A procurar…'; status.style.color = '#64748b';
    try {
      const r = await fetch(lookupUrl + '&barcode=' + encodeURIComponent(v));
      const d = await r.json();
      if (d.found) {
        const opt = select.querySelector('option[value="'+d.id+'"]');
        if (opt) {
          select.value = d.id;
          status.innerHTML = '✓ <span style="color:#0f766e">' + d.name + '</span>';
          // foca o próximo campo útil
          const bn = document.querySelector('input[name="batch_number"]');
          if (bn) bn.focus();
        } else {
          status.innerHTML = '⚠ Produto inactivo ou removido';
          status.style.color = '#dc2626';
        }
      } else {
        status.innerHTML = '✗ Não cadastrado. <a href="' + newProdUrl + '&barcode=' + encodeURIComponent(v) + '" style="color:#0f766e;font-weight:600;">Cadastrar agora →</a>';
        status.style.color = '#dc2626';
      }
    } catch(e) { status.textContent = 'Erro ao consultar'; }
  }
  let t;
  input.addEventListener('input', ()=>{
    clearTimeout(t);
    const v = input.value.trim();
    if (v.length < 4) { status.textContent=''; return; }
    // leitores de código emitem Enter no fim — reage imediato, senão debounce
    t = setTimeout(()=>lookup(v), 250);
  });
  input.addEventListener('keydown', e=>{
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(t);
      const v = input.value.trim();
      if (v.length >= 4) lookup(v);
    }
  });
})();
</script>

