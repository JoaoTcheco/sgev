<section class="crud">
  <div class="crud-header">
    <div>
      <h1 class="page-title">Lotes / Entradas</h1>
      <p class="page-subtitle">Cada entrada de mercadoria gera um lote com data de validade.</p>
    </div>
    <a href="<?= url('batches/new') ?>" class="btn btn-primary">+ Registar entrada</a>
  </div>

  <div class="crud-table-card">
    <table class="data-table">
      <thead><tr><th>Produto</th><th>Lote</th><th>Validade</th><th>Qtd.</th><th>Fornecedor</th><th>Custo</th><th>Registado</th><th style="width:130px;">Acções</th></tr></thead>
      <tbody>
      <?php if (!$items): ?>
        <tr><td colspan="8" class="empty">Nenhum lote registado. <a href="<?= url('batches/new') ?>">Registar entrada</a></td></tr>
      <?php else: foreach ($items as $b):
        $days = (int)((strtotime($b['expiry_date']) - strtotime('today')) / 86400);
      ?>
        <tr>
          <td><strong><?= e($b['product_name']) ?></strong></td>
          <td><?= e($b['batch_number']) ?></td>
          <td>
            <?= e(formatDate($b['expiry_date'])) ?>
            <?php if ($days < 0): ?><span class="badge badge-red">Expirado</span>
            <?php elseif ($days <= 30): ?><span class="badge badge-orange"><?= $days ?>d</span><?php endif; ?>
          </td>
          <td><strong><?= (int)$b['quantity'] ?></strong></td>
          <td><?= e($b['supplier_name'] ?: '—') ?></td>
          <td><?= e(formatMZN($b['cost_price'])) ?></td>
          <td><small><?= e(formatDate($b['created_at'])) ?></small></td>
          <td class="actions">
            <a href="<?= url('batches/edit') ?>&id=<?= e($b['id']) ?>" class="btn btn-sm">Editar</a>
            <?php if (hasRole('admin')): ?>
            <form method="POST" action="<?= url('batches/delete') ?>" onsubmit="return confirm('Remover lote? Movimentos são preservados.')" style="display:inline;">
              <?= csrfField() ?><input type="hidden" name="id" value="<?= e($b['id']) ?>">
              <button class="btn btn-sm btn-danger">×</button>
            </form>
            <?php endif; ?>
          </td>
        </tr>
      <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
<link rel="stylesheet" href="<?= asset('css/stock.css') ?>">
