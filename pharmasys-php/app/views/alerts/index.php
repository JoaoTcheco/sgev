<?php /** @var array $items */ /** @var array $filters */ /** @var array $stats */ ?>
<section class="crud">
  <div class="crud-header">
    <div>
      <h1 class="page-title">Alertas</h1>
      <p class="page-subtitle">
        <?= (int)$stats['total'] ?> em aberto ·
        <span class="orange"><?= (int)$stats['high'] ?> altos</span> ·
        <?= (int)$stats['medium'] ?> médios ·
        <?= (int)$stats['low'] ?> baixos
      </p>
    </div>
    <div style="display:flex;gap:8px;">
      <form method="POST" action="<?= url('alerts/refresh') ?>" style="display:inline;">
        <?= csrfField() ?>
        <button class="btn btn-primary" title="Recalcula manualmente todos os alertas com base no estado actual de stocks e validades.">↻ Actualizar agora</button>
      </form>
      <a class="btn btn-ghost" href="<?= url('alerts/export') ?>&<?= http_build_query($filters) ?>">⬇ CSV</a>
      <a class="btn btn-ghost" href="<?= url('alerts') ?>&print=1&<?= http_build_query($filters) ?>" target="_blank">🖨️ PDF</a>
      <?php if ($items && ($filters['status'] ?? 'open') === 'open'): ?>
        <form method="POST" action="<?= url('alerts/resolve-all') ?>" style="display:inline;"
              onsubmit="return confirm('Resolver todos os alertas filtrados?');">
          <?= csrfField() ?>
          <?php foreach ($filters as $k=>$v): if ($v !== ''): ?>
            <input type="hidden" name="<?= e($k) ?>" value="<?= e($v) ?>">
          <?php endif; endforeach; ?>
          <button class="btn btn-ghost">✓ Resolver todos</button>
        </form>
      <?php endif; ?>
    </div>
  </div>

  <form method="get" class="card" style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;padding:14px;margin-bottom:12px;">
    <input type="hidden" name="r" value="alerts">
    <div><label>Estado</label>
      <select name="status">
        <?php foreach (['open'=>'Abertos','resolved'=>'Resolvidos','all'=>'Todos'] as $k=>$l): ?>
          <option value="<?= $k ?>" <?= ($filters['status']??'open')===$k?'selected':'' ?>><?= $l ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div><label>Severidade</label>
      <select name="severity">
        <option value="">— Todas —</option>
        <?php foreach (['high'=>'Alta','medium'=>'Média','low'=>'Baixa'] as $k=>$l): ?>
          <option value="<?= $k ?>" <?= $filters['severity']===$k?'selected':'' ?>><?= $l ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div><label>Tipo</label>
      <select name="type">
        <option value="">— Todos —</option>
        <?php foreach (['low_stock'=>'Stock baixo','expiring'=>'A expirar','expired'=>'Expirado'] as $k=>$l): ?>
          <option value="<?= $k ?>" <?= $filters['type']===$k?'selected':'' ?>><?= $l ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div><label>De</label>
      <input type="date" name="from" value="<?= e($filters['from'] ?? '') ?>">
    </div>
    <div><label>Até</label>
      <input type="date" name="to" value="<?= e($filters['to'] ?? '') ?>">
    </div>
    <?php if (!empty($filters['product_id'])): ?>
      <input type="hidden" name="product_id" value="<?= e($filters['product_id']) ?>">
    <?php endif; ?>
    <div style="flex:1;min-width:180px;"><label>Pesquisa</label>
      <input type="text" name="q" value="<?= e($filters['q']) ?>" placeholder="Produto, lote ou mensagem…">
    </div>
    <div style="display:flex;gap:8px;">
      <button class="btn btn-primary">Filtrar</button>
      <a href="<?= url('alerts') ?>" class="btn btn-ghost">Limpar</a>
    </div>
  </form>

  <div class="crud-table-card">
    <table class="data-table">
      <thead><tr>
        <th style="width:100px;">Severidade</th>
        <th style="width:110px;">Tipo</th>
        <th>Produto / Lote</th>
        <th>Mensagem</th>
        <th style="width:140px;">Data</th>
        <th style="width:120px;">Estado</th>
        <th style="width:100px;">Acção</th>
      </tr></thead>
      <tbody>
      <?php if (!$items): ?>
        <tr><td colspan="7" class="empty">✅ Sem alertas para os filtros seleccionados.</td></tr>
      <?php else: foreach ($items as $a):
        $sev  = ['high'=>'badge-red','medium'=>'badge-orange','low'=>'badge-blue'][$a['severity']] ?? 'badge-gray';
        $type = ['low_stock'=>'Stock baixo','expiring'=>'A expirar','expired'=>'Expirado'][$a['type']] ?? $a['type'];
      ?>
        <tr>
          <td><span class="badge <?= $sev ?>"><?= e(strtoupper($a['severity'])) ?></span></td>
          <td><?= e($type) ?></td>
          <td>
            <?php if ($a['product_name']): ?><strong><?= e($a['product_name']) ?></strong><?php endif; ?>
            <?php if ($a['batch_number']): ?><br><small>Lote <?= e($a['batch_number']) ?> · val. <?= e(formatDate($a['expiry_date'])) ?></small><?php endif; ?>
          </td>
          <td><?= e($a['message']) ?></td>
          <td><small><?= e(formatDateTime($a['created_at'])) ?></small></td>
          <td>
            <?php if ((int)$a['resolved'] === 1): ?>
              <span class="badge badge-green">Resolvido</span>
            <?php else: ?>
              <span class="badge badge-gray">Aberto</span>
            <?php endif; ?>
          </td>
          <td>
            <?php if ((int)$a['resolved'] === 0): ?>
              <form method="POST" action="<?= url('alerts/resolve') ?>" style="display:inline;">
                <?= csrfField() ?><input type="hidden" name="id" value="<?= e($a['id']) ?>">
                <button class="btn btn-sm">Resolver</button>
              </form>
            <?php else: ?>
              <small class="muted"><?= e(formatDateTime($a['resolved_at'])) ?></small>
            <?php endif; ?>
          </td>
        </tr>
      <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
