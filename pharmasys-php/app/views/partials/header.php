<?php
$u = currentUser();
$unread = 0;
try { $unread = NotificationModel::countUnread($u); } catch (Throwable $e) { $unread = 0; }
?>
<header class="app-header">
  <div class="header-title">Painel</div>
  <div class="header-user" style="display:flex; align-items:center;">
    <div class="notif-bell">
      <button id="notifBell" class="notif-bell-btn" title="Notificações"
              data-feed="<?= url('notifications/feed') ?>"
              data-list="<?= url('notifications') ?>">
        🔔
        <span id="notifCount" class="notif-bell-count" style="<?= $unread ? '' : 'display:none' ?>">
          <?= $unread > 99 ? '99+' : (int)$unread ?>
        </span>
      </button>
      <div id="notifPanel" class="notif-panel">
        <header>
          <span>Notificações</span>
          <a href="<?= url('notifications') ?>">Ver todas</a>
        </header>
        <div id="notifPanelList"><div class="np-empty">A carregar…</div></div>
        <footer><a href="<?= url('notifications') ?>">Abrir centro de notificações</a></footer>
      </div>
    </div>
    <span class="user-name"><?= e($u['full_name'] ?? '') ?></span>
    <span class="user-badge"><?= e($u['role'] ?? '') ?></span>
  </div>
</header>
<link rel="stylesheet" href="<?= asset('css/notifications.css') ?>">
<script src="<?= asset('js/notifications.js') ?>" defer></script>
