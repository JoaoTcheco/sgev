<?php /** @var array $result */ /** @var array $filters */ /** @var array $suppliers */ /** @var array $stats */ ?>
<link rel="stylesheet" href="<?= asset('css/purchases.css') ?>">

<div class="page-header">
  <div><h1>Ordens de Compra</h1><p class="muted">Gestão de encomendas a fornecedores e receção de mercadoria.</p></div>
  <div class="page-actions"><a href="<?= url('purchases/new') ?>" class="btn btn-primary">+ Nova OC</a></div>
</div>

<div class="po-stats">
  <div class="po-stat"><div class="po-stat-label">Rascunhos</div><div class="po-stat-value"><?= $stats['draft'] ?></div></div>
  <div class="po-stat"><div class="po-stat-label">Em aberto</div><div class="po-stat-value"><?= $stats['confirmed'] ?></div><div class="po-stat-sub">confirmadas / parciais</div></div>
  <div class="po-stat"><div class="po-stat-label">Recebidas (mês)</div><div class="po-stat-value"><?= $stats['received_month'] ?></div></div>
  <div class="po-stat"><div class="po-stat-label">Compras (mês)</div><div class="po-stat-value"><?= formatMZN($stats['total_month']) ?></div></div>
</div>

<form method="get" class="po-filters card">
  <input type="hidden" name="r" value="purchases">
  <input type="text"  name="q"           value="<?= e($filters['q']) ?>" placeholder="Nº OC ou fornecedor…">
  <select name="status">
    <option value="">Todos os estados</option>
    <?php foreach (['draft'=>'Rascunho','confirmed'=>'Confirmada','partial'=>'Parcial','received'=>'Recebida','cancelled'=>'Cancelada'] as $k=>$v): ?>
      <option value="<?= $k ?>" <?= $filters['status']===$k?'selected':'' ?>><?= $v ?></option>
    <?php endforeach; ?>
  </select>
  <select name="supplier_id">
    <option value="">Todos os fornecedores</option>
    <?php foreach ($suppliers as $s): ?>
      <option value="<?= e($s['id']) ?>" <?= $filters['supplier_id']===$s['id']?'selected':'' ?>><?= e($s['legal_name']) ?></option>
    <?php endforeach; ?>
  </select>
  <input type="date" name="from" value="<?= e($filters['from']) ?>">
  <input type="date" name="to"   value="<?= e($filters['to']) ?>">
  <button class="btn btn-primary">Filtrar</button>
  <a href="<?= url('purchases') ?>" class="btn btn-ghost">Limpar</a>
</form>

<div class="card">
  <table class="po-table">
    <thead><tr>
      <th>Nº OC</th><th>Fornecedor</th><th>Data</th><th>Prev. Entrega</th><th>Itens</th>
      <th class="right">Total</th><th>Estado</th><th></th>
    </tr></thead>
    <tbody>
    <?php if (!$result['rows']): ?>
      <tr><td colspan="8" class="empty">Nenhuma ordem encontrada.</td></tr>
    <?php else: foreach ($result['rows'] as $r): ?>
      <tr>
        <td><strong><?= e($r['po_number']) ?></strong></td>
        <td><?= e($r['supplier_name']) ?></td>
        <td class="nowrap"><?= formatDate($r['created_at']) ?></td>
        <td class="nowrap"><?= $r['expected_date'] ? formatDate($r['expected_date']) : '—' ?></td>
        <td><?= $r['item_count'] ?></td>
        <td class="right"><?= formatMZN($r['total']) ?></td>
        <td><span class="po-status po-status-<?= e($r['status']) ?>"><?= po_status_label($r['status']) ?></span></td>
        <td><a href="<?= url('purchases/view').'&id='.e($r['id']) ?>" class="btn btn-ghost btn-sm">Abrir</a></td>
      </tr>
    <?php endforeach; endif; ?>
    </tbody>
  </table>

  <?php if ($result['pages']>1): $qs=$_GET; unset($qs['page']); $base=url('purchases').'&'.http_build_query($qs); ?>
    <div class="pagination">
      <?php if ($result['page']>1): ?><a class="btn btn-ghost btn-sm" href="<?= $base.'&page='.($result['page']-1) ?>">← Anterior</a><?php endif; ?>
      <span class="page-info">Página <?= $result['page'] ?> de <?= $result['pages'] ?> · <?= $result['total'] ?> registos</span>
      <?php if ($result['page']<$result['pages']): ?><a class="btn btn-ghost btn-sm" href="<?= $base.'&page='.($result['page']+1) ?>">Seguinte →</a><?php endif; ?>
    </div>
  <?php endif; ?>
</div>

<?php
function po_status_label(string $s): string {
    return ['draft'=>'Rascunho','confirmed'=>'Confirmada','partial'=>'Parcial','received'=>'Recebida','cancelled'=>'Cancelada'][$s] ?? $s;
}
?>
