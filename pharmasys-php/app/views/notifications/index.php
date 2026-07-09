<?php
/** @var array $data */
/** @var array $filters */
/** @var int $unread */
$sevClass = ['high'=>'danger','medium'=>'warning','low'=>'info','info'=>'muted'];
?>
<link rel="stylesheet" href="<?= asset('css/notifications.css') ?>">

<div class="page-header">
  <div>
    <h1>Notificações</h1>
    <p class="page-subtitle"><?= (int)$data['total'] ?> no total · <strong><?= (int)$unread ?></strong> por ler</p>
  </div>
  <div class="page-actions">
    <form method="post" action="<?= url('notifications/refresh') ?>" style="display:inline">
      <?= csrfField() ?>
      <button class="btn btn-secondary" type="submit">Actualizar</button>
    </form>
    <form method="post" action="<?= url('notifications/read-all') ?>" style="display:inline">
      <?= csrfField() ?>
      <button class="btn btn-secondary" type="submit" <?= $unread ? '' : 'disabled' ?>>Marcar todas lidas</button>
    </form>
    <form method="post" action="<?= url('notifications/clear-read') ?>" style="display:inline"
          onsubmit="return confirm('Remover todas as notificações lidas?')">
      <?= csrfField() ?>
      <button class="btn btn-danger-outline" type="submit">Limpar lidas</button>
    </form>
  </div>
</div>

<form method="get" class="filters-bar">
  <input type="hidden" name="r" value="notifications">
  <input type="text" name="q" placeholder="Pesquisar…" value="<?= e($filters['q']) ?>">
  <select name="type">
    <option value="">Todos os tipos</option>
    <?php foreach (['low_stock'=>'Stock baixo','expiring'=>'A expirar','expired'=>'Expirado','po_pending'=>'OC pendente','info'=>'Info'] as $k=>$v): ?>
      <option value="<?= $k ?>" <?= $filters['type']===$k?'selected':'' ?>><?= $v ?></option>
    <?php endforeach; ?>
  </select>
  <select name="severity">
    <option value="">Todas severidades</option>
    <?php foreach (['high'=>'Alta','medium'=>'Média','low'=>'Baixa','info'=>'Info'] as $k=>$v): ?>
      <option value="<?= $k ?>" <?= $filters['severity']===$k?'selected':'' ?>><?= $v ?></option>
    <?php endforeach; ?>
  </select>
  <label class="chk">
    <input type="checkbox" name="unread" value="1" <?= $filters['unread']==='1'?'checked':'' ?>> Só não lidas
  </label>
  <button class="btn btn-primary" type="submit">Filtrar</button>
</form>

<div class="notif-list">
  <?php if (!$data['rows']): ?>
    <div class="empty">Sem notificações.</div>
  <?php else: foreach ($data['rows'] as $n): ?>
    <div class="notif-item notif-<?= e($sevClass[$n['severity']] ?? 'muted') ?> <?= empty($n['read_at']) ? 'is-unread':'' ?>">
      <div class="notif-dot"></div>
      <div class="notif-body">
        <div class="notif-title">
          <?= e($n['title']) ?>
          <span class="chip chip-<?= e($sevClass[$n['severity']] ?? 'muted') ?>"><?= e($n['severity']) ?></span>
          <span class="notif-type"><?= e($n['type']) ?></span>
        </div>
        <div class="notif-msg"><?= nl2br(e($n['message'])) ?></div>
        <div class="notif-meta">
          <?= formatDateTime($n['created_at']) ?>
          <?php if ($n['link']): ?> · <a href="<?= url($n['link']) ?>">Abrir</a><?php endif; ?>
        </div>
      </div>
      <div class="notif-actions">
        <?php if (empty($n['read_at'])): ?>
          <form method="post" action="<?= url('notifications/read') ?>">
            <?= csrfField() ?><input type="hidden" name="id" value="<?= e($n['id']) ?>">
            <button class="btn btn-mini" type="submit">Lida</button>
          </form>
        <?php endif; ?>
        <form method="post" action="<?= url('notifications/delete') ?>" onsubmit="return confirm('Remover?')">
          <?= csrfField() ?><input type="hidden" name="id" value="<?= e($n['id']) ?>">
          <button class="btn btn-mini btn-danger-outline" type="submit">×</button>
        </form>
      </div>
    </div>
  <?php endforeach; endif; ?>
</div>

<?php if ($data['pages'] > 1): ?>
  <div class="pagination">
    <?php for ($i=1;$i<=$data['pages'];$i++):
      $q = $_GET; $q['page'] = $i; $qs = http_build_query($q); ?>
      <a href="?<?= $qs ?>" class="<?= $i===$data['page']?'active':'' ?>"><?= $i ?></a>
    <?php endfor; ?>
  </div>
<?php endif; ?>
