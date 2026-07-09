<section class="crud">
  <div class="crud-header">
    <div>
      <h1 class="page-title">Estoque</h1>
      <p class="page-subtitle">Visão geral por produto — stock consolidado dos lotes activos</p>
    </div>
    <a href="<?= url('batches/new') ?>" class="btn btn-primary">+ Registar entrada</a>
  </div>

  <div class="crud-table-card">
    <input type="text" id="stock-search" class="table-search" placeholder="Filtrar por produto, categoria, código…">
    <table class="data-table" id="stock-table">
      <thead>
        <tr><th>Produto</th><th>Categoria</th><th>Stock</th><th>Mín.</th><th>Estado</th><th>Próxima validade</th><th style="width:100px;">Acções</th></tr>
      </thead>
      <tbody>
      <?php foreach ($items as $p):
        $status = 'ok';
        if ($p['stock'] == 0) $status = 'zero';
        elseif ($p['stock'] <= $p['min_stock']) $status = 'low';
      ?>
        <tr>
          <td><strong><?= e($p['name']) ?></strong></td>
          <td><?= e($p['category_name'] ?: '—') ?></td>
          <td><strong class="<?= $status === 'ok' ? 'stock-ok' : 'stock-low' ?>"><?= (int)$p['stock'] ?></strong> <?= e($p['unit']) ?></td>
          <td><?= (int)$p['min_stock'] ?></td>
          <td>
            <?php if ($status === 'ok'): ?><span class="badge badge-green">OK</span>
            <?php elseif ($status === 'low'): ?><span class="badge badge-orange">Baixo</span>
            <?php else: ?><span class="badge badge-red">Esgotado</span>
            <?php endif; ?>
          </td>
          <td><?= $p['next_expiry'] ? e(formatDate($p['next_expiry'])) : '—' ?></td>
          <td><a href="<?= url('stock/view') ?>&id=<?= e($p['id']) ?>" class="btn btn-sm">Ver</a></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
<link rel="stylesheet" href="<?= asset('css/stock.css') ?>">
<script>
document.getElementById('stock-search')?.addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll('#stock-table tbody tr').forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});
</script>
