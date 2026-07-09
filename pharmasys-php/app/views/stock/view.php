<section class="crud">
  <a href="<?= url('stock') ?>" class="btn btn-ghost btn-sm" style="margin-bottom:12px;">← Voltar</a>
  <h1 class="page-title"><?= e($product['name']) ?></h1>
  <p class="page-subtitle">
    Stock actual: <strong class="<?= $stock <= $product['min_stock'] ? 'stock-low' : 'stock-ok' ?>"><?= (int)$stock ?></strong> <?= e($product['unit']) ?>
    · Mínimo: <?= (int)$product['min_stock'] ?>
    · Preço: <?= e(formatMZN($product['sale_price'])) ?>
  </p>

  <h3 class="form-section">Lotes activos</h3>
  <div class="crud-table-card">
    <table class="data-table">
      <thead><tr><th>Lote</th><th>Validade</th><th>Qtd.</th><th>Custo</th><th>Fornecedor</th><th>Registado em</th><th style="width:220px;">Ajuste</th></tr></thead>
      <tbody>
      <?php if (!$batches): ?>
        <tr><td colspan="7" class="empty">Nenhum lote registado. <a href="<?= url('batches/new') ?>&product_id=<?= e($product['id']) ?>">Registar entrada</a></td></tr>
      <?php else: foreach ($batches as $b):
        $days = (int)((strtotime($b['expiry_date']) - strtotime('today')) / 86400);
      ?>
        <tr>
          <td><strong><?= e($b['batch_number']) ?></strong></td>
          <td>
            <?= e(formatDate($b['expiry_date'])) ?>
            <?php if ($days < 0): ?><span class="badge badge-red">Expirado</span>
            <?php elseif ($days <= 30): ?><span class="badge badge-orange"><?= $days ?>d</span><?php endif; ?>
          </td>
          <td><strong><?= (int)$b['quantity'] ?></strong></td>
          <td><?= e(formatMZN($b['cost_price'])) ?></td>
          <td><?= e($b['supplier_name'] ?: '—') ?></td>
          <td><small><?= e(formatDateTime($b['created_at'])) ?></small></td>
          <td>
            <form method="POST" action="<?= url('batches/adjust') ?>" class="adjust-form">
              <?= csrfField() ?><input type="hidden" name="id" value="<?= e($b['id']) ?>">
              <input type="number" name="delta" placeholder="±" style="width:70px;">
              <input type="text"   name="reason" placeholder="Motivo" style="width:100px;">
              <button class="btn btn-sm">Ajustar</button>
            </form>
          </td>
        </tr>
      <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>

  <h3 class="form-section">Movimentos recentes</h3>
  <div class="crud-table-card">
    <table class="data-table">
      <thead><tr><th>Data</th><th>Tipo</th><th>Qtd.</th><th>Lote</th><th>Motivo</th><th>Utilizador</th></tr></thead>
      <tbody>
      <?php if (!$movements): ?>
        <tr><td colspan="6" class="empty">Sem movimentos.</td></tr>
      <?php else: foreach ($movements as $m):
        $badge = ['in'=>'badge-green', 'out'=>'badge-blue', 'refund'=>'badge-orange', 'adjust'=>'badge-gray', 'expired'=>'badge-red'][$m['type']] ?? 'badge-gray';
      ?>
        <tr>
          <td><small><?= e(formatDateTime($m['created_at'])) ?></small></td>
          <td><span class="badge <?= $badge ?>"><?= e(strtoupper($m['type'])) ?></span></td>
          <td><strong><?= $m['quantity'] > 0 ? '+' : '' ?><?= (int)$m['quantity'] ?></strong></td>
          <td><?= e($m['batch_number'] ?: '—') ?></td>
          <td><?= e($m['reason'] ?: '—') ?></td>
          <td><?= e($m['user_name'] ?: '—') ?></td>
        </tr>
      <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
<link rel="stylesheet" href="<?= asset('css/stock.css') ?>">
