<?php /** @var array $data */ /** @var array $filters */ /** @var array $suppliers */ /** @var array $stats */ /** @var array $reasons */ ?>

<link rel="stylesheet" href="<?= asset('css/supplier_returns.css') ?>">

<div class="page-header">
  <div><h1>Devoluções a Fornecedor</h1><p class="muted">Saída de stock com crédito automático no fornecedor.</p></div>
  <div class="page-actions"><a href="<?= url('supplier-returns/new') ?>" class="btn btn-primary">+ Nova devolução</a></div>
</div>

<div class="po-stats">
  <div class="po-stat"><div class="po-stat-label">Rascunhos</div><div class="po-stat-value"><?= $stats['draft'] ?></div></div>
  <div class="po-stat"><div class="po-stat-label">Confirmadas</div><div class="po-stat-value"><?= $stats['confirmed'] ?></div></div>
  <div class="po-stat"><div class="po-stat-label">Devoluções (mês)</div><div class="po-stat-value"><?= formatMZN($stats['value_month']) ?></div></div>
</div>

<form method="get" class="po-filters card">
  <input type="hidden" name="r" value="supplier-returns">
  <input type="text" name="q" value="<?= e($filters['q']) ?>" placeholder="Nº ou fornecedor…">
  <select name="status">
    <option value="">Todos os estados</option>
    <?php foreach (['draft'=>'Rascunho','confirmed'=>'Confirmada','cancelled'=>'Cancelada'] as $k=>$v): ?>
      <option value="<?= $k ?>" <?= $filters['status']===$k?'selected':'' ?>><?= $v ?></option>
    <?php endforeach; ?>
  </select>
  <select name="supplier_id">
    <option value="">Todos os fornecedores</option>
    <?php foreach ($suppliers as $s): ?>
      <option value="<?= e($s['id']) ?>" <?= $filters['supplier_id']===$s['id']?'selected':'' ?>><?= e($s['legal_name']) ?></option>
    <?php endforeach; ?>
  </select>
  <select name="reason">
    <option value="">Todos os motivos</option>
    <?php foreach ($reasons as $k=>$v): ?>
      <option value="<?= $k ?>" <?= $filters['reason']===$k?'selected':'' ?>><?= e($v) ?></option>
    <?php endforeach; ?>
  </select>
  <input type="date" name="from" value="<?= e($filters['from']) ?>">
  <input type="date" name="to"   value="<?= e($filters['to']) ?>">
  <button class="btn btn-primary">Filtrar</button>
  <a href="<?= url('supplier-returns') ?>" class="btn btn-ghost">Limpar</a>
</form>

<div class="card">
  <table class="po-table">
    <thead><tr>
      <th>Nº</th><th>Fornecedor</th><th>Data</th><th>Motivo</th><th>Itens</th>
      <th class="right">Total</th><th>Estado</th><th></th>
    </tr></thead>
    <tbody>
    <?php if (!$data['rows']): ?>
      <tr><td colspan="8" class="empty">Nenhuma devolução encontrada.</td></tr>
    <?php else: foreach ($data['rows'] as $r): ?>
      <tr>
        <td><strong><?= e($r['sr_number']) ?></strong></td>
        <td><?= e($r['supplier_name']) ?></td>
        <td class="nowrap"><?= formatDate($r['created_at']) ?></td>
        <td><?= e($reasons[$r['reason']] ?? $r['reason']) ?></td>
        <td><?= $r['item_count'] ?></td>
        <td class="right"><?= formatMZN($r['total']) ?></td>
        <td><span class="po-status po-status-<?= e($r['status']) ?>"><?= e(sr_status_label($r['status'])) ?></span></td>
        <td><a href="<?= url('supplier-returns/view').'&id='.e($r['id']) ?>" class="btn btn-ghost btn-sm">Abrir</a></td>
      </tr>
    <?php endforeach; endif; ?>
    </tbody>
  </table>

  <?php if ($data['pages']>1): $qs=$_GET; unset($qs['page']); $base=url('supplier-returns').'&'.http_build_query($qs); ?>
    <div class="pagination">
      <?php if ($data['page']>1): ?><a class="btn btn-ghost btn-sm" href="<?= $base.'&page='.($data['page']-1) ?>">← Anterior</a><?php endif; ?>
      <span class="page-info">Página <?= $data['page'] ?> de <?= $data['pages'] ?> · <?= $data['total'] ?> registos</span>
      <?php if ($data['page']<$data['pages']): ?><a class="btn btn-ghost btn-sm" href="<?= $base.'&page='.($data['page']+1) ?>">Seguinte →</a><?php endif; ?>
    </div>
  <?php endif; ?>
</div>

<?php
function sr_status_label(string $s): string {
    return ['draft'=>'Rascunho','confirmed'=>'Confirmada','cancelled'=>'Cancelada'][$s] ?? $s;
}
?>
