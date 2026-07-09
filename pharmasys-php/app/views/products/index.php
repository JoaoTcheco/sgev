<section class="crud">
  <div class="crud-header">
    <div>
      <h1 class="page-title">Produtos</h1>
      <p class="page-subtitle"><?= count($items) ?> produto(s) activos</p>
    </div>
    <a href="<?= url('products/new') ?>" class="btn btn-primary">+ Novo produto</a>
  </div>

  <div class="crud-table-card">
    <input type="text" id="prod-search" class="table-search" placeholder="Filtrar por nome, código de barras, categoria…">
    <table class="data-table" id="products-table">
      <thead>
        <tr>
          <th>Nome</th><th>Categoria</th><th>Código</th>
          <th>Preço venda</th><th>Sub-unidade</th><th>Stock</th>
          <th style="width:130px;">Acções</th>
        </tr>
      </thead>
      <tbody>
      <?php if (!$items): ?>
        <tr><td colspan="7" class="empty">Nenhum produto. <a href="<?= url('products/new') ?>">Criar o primeiro</a></td></tr>
      <?php else: foreach ($items as $p): ?>
        <tr>
          <td>
            <strong><?= e($p['name']) ?></strong>
            <?php if ($p['requires_prescription']): ?><span class="badge badge-orange">Receita</span><?php endif; ?>
          </td>
          <td><?= e($p['category_name'] ?: '—') ?></td>
          <td><small><?= e($p['barcode'] ?: '—') ?></small></td>
          <td><?= e(formatMZN($p['sale_price'])) ?></td>
          <td>
            <?php if ($p['sub_unit_price']): ?>
              <?= e($p['sub_unit_label'] ?: 'Un') ?>: <?= e(formatMZN($p['sub_unit_price'])) ?>
            <?php else: ?>—<?php endif; ?>
          </td>
          <td>
            <span class="<?= $p['stock'] <= $p['min_stock'] ? 'stock-low' : 'stock-ok' ?>">
              <?= (int)$p['stock'] ?> / mín <?= (int)$p['min_stock'] ?>
            </span>
          </td>
          <td class="actions">
            <a href="<?= url('products/edit') ?>&id=<?= e($p['id']) ?>" class="btn btn-sm">Editar</a>
            <?php if (!empty($p['barcode'])): ?>
              <a href="<?= url('labels/quick') ?>&id=<?= e($p['id']) ?>&qty=1" target="_blank" class="btn btn-sm" title="Imprimir etiqueta">🏷️</a>
            <?php endif; ?>
            <form method="POST" action="<?= url('products/delete') ?>" onsubmit="return confirm('Remover?')" style="display:inline;">
              <?= csrfField() ?><input type="hidden" name="id" value="<?= e($p['id']) ?>">
              <button class="btn btn-sm btn-danger">×</button>
            </form>
          </td>
        </tr>
      <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
<script>
document.getElementById('prod-search')?.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll('#products-table tbody tr').forEach(tr => {
    tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
});
</script>
