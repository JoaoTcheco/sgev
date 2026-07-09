<section class="crud">
  <h1 class="page-title">Imprimir etiquetas</h1>
  <p class="page-subtitle">Selecciona os produtos e a quantidade de etiquetas de cada um.</p>

  <form method="POST" action="<?= url('labels/print') ?>" target="_blank" class="form-card">
    <?= csrfField() ?>
    <input type="text" id="lbl-search" class="table-search" placeholder="Filtrar produtos…">
    <table class="data-table" id="lbl-table">
      <thead><tr><th>Produto</th><th>Preço</th><th>Código</th><th style="width:120px;">Etiquetas</th></tr></thead>
      <tbody>
      <?php foreach ($products as $p): ?>
        <tr>
          <td><strong><?= e($p['name']) ?></strong></td>
          <td><?= e(formatMZN($p['sale_price'])) ?></td>
          <td><small><?= e($p['barcode'] ?: '—') ?></small></td>
          <td><input type="number" min="0" name="qty[<?= e($p['id']) ?>]" value="0" style="width:70px;"></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>

    <div class="form-actions">
      <button class="btn btn-primary" type="submit">Gerar página de impressão</button>
    </div>
  </form>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
<script>
document.getElementById('lbl-search')?.addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll('#lbl-table tbody tr').forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});
</script>
