<?php /** @var array $filters */ /** @var array $result */ /** @var array $actions */ /** @var array $entities */ /** @var array $users */ /** @var array $summary */ /** @var array $top */ ?>
<link rel="stylesheet" href="<?= asset('css/audit.css') ?>">

<div class="page-header">
  <div>
    <h1>Auditoria & Logs</h1>
    <p class="muted">Rastreio detalhado de todas as ações executadas no sistema.</p>
  </div>
  <div class="page-actions">
    <a href="<?= url('audit/export') . '&' . http_build_query($filters) ?>" class="btn btn-outline">⬇ Exportar CSV</a>
  </div>
</div>

<div class="audit-summary">
  <div class="audit-card">
    <div class="audit-card-title">Total (filtrado)</div>
    <div class="audit-card-value"><?= number_format($result['total'], 0, ',', '.') ?></div>
    <div class="audit-card-sub">registos</div>
  </div>
  <div class="audit-card">
    <div class="audit-card-title">Ações distintas</div>
    <div class="audit-card-value"><?= count($actions) ?></div>
    <div class="audit-card-sub">tipos únicos</div>
  </div>
  <div class="audit-card">
    <div class="audit-card-title">Entidades rastreadas</div>
    <div class="audit-card-value"><?= count($entities) ?></div>
    <div class="audit-card-sub">domínios</div>
  </div>
  <div class="audit-card">
    <div class="audit-card-title">Utilizadores ativos</div>
    <div class="audit-card-value"><?= count(array_filter($users, fn($u) => (int)$u['active'] === 1)) ?></div>
    <div class="audit-card-sub">de <?= count($users) ?> totais</div>
  </div>
</div>

<div class="audit-grid">
  <div class="audit-chart">
    <h3>Atividade — últimos 14 dias</h3>
    <?php if (!$summary): ?>
      <p class="muted">Sem dados no período.</p>
    <?php else: ?>
      <?php $max = max(array_column($summary,'c')) ?: 1; ?>
      <div class="bars">
        <?php foreach ($summary as $s): $h = round(($s['c']/$max)*100); ?>
          <div class="bar-wrap" title="<?= e($s['d']) ?>: <?= $s['c'] ?>">
            <div class="bar" style="height: <?= $h ?>%"></div>
            <div class="bar-label"><?= date('d/m', strtotime($s['d'])) ?></div>
            <div class="bar-val"><?= $s['c'] ?></div>
          </div>
        <?php endforeach; ?>
      </div>
    <?php endif; ?>
  </div>
  <div class="audit-top">
    <h3>Top ações — 30 dias</h3>
    <?php if (!$top): ?>
      <p class="muted">Sem dados.</p>
    <?php else: ?>
      <ul class="top-list">
        <?php $tmax = $top[0]['c']; foreach ($top as $t): ?>
          <li>
            <div class="top-row">
              <span class="top-label"><?= e($t['action']) ?></span>
              <span class="top-count"><?= $t['c'] ?></span>
            </div>
            <div class="top-bar"><div class="top-fill" style="width: <?= round(($t['c']/$tmax)*100) ?>%"></div></div>
          </li>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>
  </div>
</div>

<form method="get" class="audit-filters card">
  <input type="hidden" name="r" value="audit">
  <div class="filter-row">
    <div class="filter-field">
      <label>Pesquisar</label>
      <input type="text" name="q" value="<?= e($filters['q']) ?>" placeholder="Ação, entidade, detalhes…">
    </div>
    <div class="filter-field">
      <label>Utilizador</label>
      <select name="user_id">
        <option value="">Todos</option>
        <?php foreach ($users as $u): ?>
          <option value="<?= e($u['id']) ?>" <?= $filters['user_id']===$u['id']?'selected':'' ?>>
            <?= e($u['username']) ?> — <?= e($u['full_name']) ?>
          </option>
        <?php endforeach; ?>
      </select>
    </div>
    <div class="filter-field">
      <label>Ação</label>
      <select name="action">
        <option value="">Todas</option>
        <?php foreach ($actions as $a): ?>
          <option value="<?= e($a) ?>" <?= $filters['action']===$a?'selected':'' ?>><?= e($a) ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div class="filter-field">
      <label>Entidade</label>
      <select name="entity">
        <option value="">Todas</option>
        <?php foreach ($entities as $en): ?>
          <option value="<?= e($en) ?>" <?= $filters['entity']===$en?'selected':'' ?>><?= e($en) ?></option>
        <?php endforeach; ?>
      </select>
    </div>
  </div>
  <div class="filter-row">
    <div class="filter-field">
      <label>ID da entidade</label>
      <input type="text" name="entity_id" value="<?= e($filters['entity_id']) ?>" placeholder="UUID">
    </div>
    <div class="filter-field">
      <label>TXN ID</label>
      <input type="text" name="txn_id" value="<?= e($filters['txn_id']) ?>" placeholder="UUID da transação">
    </div>
    <div class="filter-field">
      <label>De</label>
      <input type="date" name="from" value="<?= e($filters['from']) ?>">
    </div>
    <div class="filter-field">
      <label>Até</label>
      <input type="date" name="to" value="<?= e($filters['to']) ?>">
    </div>
    <div class="filter-actions">
      <button class="btn btn-primary">Filtrar</button>
      <a href="<?= url('audit') ?>" class="btn btn-ghost">Limpar</a>
    </div>
  </div>
</form>

<div class="card">
  <table class="audit-table">
    <thead>
      <tr>
        <th>Data/Hora</th>
        <th>Utilizador</th>
        <th>Ação</th>
        <th>Entidade</th>
        <th>ID</th>
        <th>Detalhes</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      <?php if (!$result['rows']): ?>
        <tr><td colspan="7" class="empty">Nenhum registo encontrado com os filtros aplicados.</td></tr>
      <?php else: foreach ($result['rows'] as $r): ?>
        <tr>
          <td class="nowrap"><?= formatDateTime($r['created_at']) ?></td>
          <td>
            <?php if ($r['username']): ?>
              <div class="user-cell">
                <strong><?= e($r['username']) ?></strong>
                <small><?= e($r['full_name']) ?></small>
              </div>
            <?php else: ?>
              <span class="muted">—</span>
            <?php endif; ?>
          </td>
          <td><span class="chip chip-<?= self_action_class($r['action']) ?>"><?= e($r['action']) ?></span></td>
          <td><span class="entity-tag"><?= e($r['entity']) ?></span></td>
          <td class="mono small"><?= e(substr((string)$r['entity_id'], 0, 8)) ?><?= $r['entity_id'] ? '…' : '' ?></td>
          <td class="details-cell">
            <?php $det = (string)$r['details']; ?>
            <div class="details-preview"><?= e(mb_strimwidth($det, 0, 120, '…')) ?></div>
          </td>
          <td><a href="<?= url('audit/view') . '&id=' . e($r['id']) ?>" class="btn btn-ghost btn-sm">Ver</a></td>
        </tr>
      <?php endforeach; endif; ?>
    </tbody>
  </table>

  <?php if ($result['pages'] > 1): ?>
    <div class="pagination">
      <?php
        $qs = $_GET; unset($qs['page']);
        $base = url('audit') . '&' . http_build_query($qs);
        $cur = $result['page']; $tot = $result['pages'];
      ?>
      <?php if ($cur > 1): ?>
        <a href="<?= $base . '&page=' . ($cur-1) ?>" class="btn btn-ghost btn-sm">← Anterior</a>
      <?php endif; ?>
      <span class="page-info">Página <?= $cur ?> de <?= $tot ?> · <?= number_format($result['total'],0,',','.') ?> registos</span>
      <?php if ($cur < $tot): ?>
        <a href="<?= $base . '&page=' . ($cur+1) ?>" class="btn btn-ghost btn-sm">Seguinte →</a>
      <?php endif; ?>
    </div>
  <?php endif; ?>
</div>

<?php
function self_action_class(string $a): string {
    $a = strtolower($a);
    if (str_contains($a,'delete') || str_contains($a,'remove') || str_contains($a,'refund')) return 'danger';
    if (str_contains($a,'create') || str_contains($a,'insert') || str_contains($a,'open'))    return 'success';
    if (str_contains($a,'update') || str_contains($a,'edit')   || str_contains($a,'adjust'))  return 'warning';
    if (str_contains($a,'login')  || str_contains($a,'logout') || str_contains($a,'auth'))    return 'info';
    return 'neutral';
}
?>
