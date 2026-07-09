<?php /** @var array $log */ /** @var array $related */ ?>
<link rel="stylesheet" href="<?= asset('css/audit.css') ?>">

<div class="page-header">
  <div>
    <h1>Detalhe do Log</h1>
    <p class="muted">Registo #<span class="mono"><?= e($log['id']) ?></span></p>
  </div>
  <div class="page-actions">
    <a href="<?= url('audit') ?>" class="btn btn-ghost">← Voltar</a>
  </div>
</div>

<div class="card">
  <div class="audit-detail">
    <div><span class="dl-label">Data/Hora</span><span class="dl-value"><?= formatDateTime($log['created_at']) ?></span></div>
    <div><span class="dl-label">Utilizador</span><span class="dl-value"><?= $log['username'] ? e($log['username']).' — '.e($log['full_name']) : '<em>Sistema</em>' ?></span></div>
    <div><span class="dl-label">Ação</span><span class="dl-value"><code><?= e($log['action']) ?></code></span></div>
    <div><span class="dl-label">Entidade</span><span class="dl-value"><?= e($log['entity']) ?></span></div>
    <div><span class="dl-label">ID Entidade</span><span class="dl-value mono"><?= e($log['entity_id'] ?: '—') ?></span></div>
    <div><span class="dl-label">TXN</span><span class="dl-value mono"><?= e($log['txn_id'] ?: '—') ?></span></div>
  </div>

  <h3>Detalhes</h3>
  <?php
    $raw = (string)$log['details'];
    $decoded = json_decode($raw, true);
    $pretty = ($decoded !== null) ? json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : $raw;
  ?>
  <pre class="details-block"><?= e($pretty ?: '—') ?></pre>
</div>

<?php if ($related && count($related) > 1): ?>
  <div class="card">
    <h3>Eventos da mesma transação (<?= count($related) ?>)</h3>
    <table class="audit-table">
      <thead>
        <tr>
          <th>Data/Hora</th>
          <th>Utilizador</th>
          <th>Ação</th>
          <th>Entidade</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($related as $r): ?>
          <tr class="<?= $r['id']===$log['id']?'current-row':'' ?>">
            <td class="nowrap"><?= formatDateTime($r['created_at']) ?></td>
            <td><?= $r['username'] ? e($r['username']) : '—' ?></td>
            <td><code><?= e($r['action']) ?></code></td>
            <td><?= e($r['entity']) ?></td>
            <td>
              <?php if ($r['id']!==$log['id']): ?>
                <a href="<?= url('audit/view').'&id='.e($r['id']) ?>" class="btn btn-ghost btn-sm">Ver</a>
              <?php else: ?>
                <span class="chip chip-info">Atual</span>
              <?php endif; ?>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
<?php endif; ?>
