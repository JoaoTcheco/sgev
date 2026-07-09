<?php
$u = currentUser();
$unread = 0;
try { $unread = NotificationModel::countUnread($u); } catch (Throwable $e) { $unread = 0; }

/* Título dinâmico a partir da rota (?r=...) */
$route = $_GET['r'] ?? 'dashboard';
$titles = [
  'dashboard'        => 'Painel',
  'pdv'              => 'PDV — Vendas',
  'cash'             => 'Caixa',
  'history'          => 'Histórico / Estorno',
  'stock'            => 'Estoque',
  'batches'          => 'Lotes & Entradas',
  'alerts'           => 'Alertas',
  'notifications'    => 'Notificações',
  'labels'           => 'Etiquetas',
  'products'         => 'Produtos',
  'categories'       => 'Categorias',
  'suppliers'        => 'Fornecedores',
  'customers'        => 'Clientes',
  'purchases'        => 'Ordens de Compra',
  'supplier-returns' => 'Devoluções a Fornecedor',
  'accounts'         => 'Contas Financeiras',
  'payables'         => 'Contas a Pagar',
  'receivables'      => 'Contas a Receber',
  'reports'          => 'Relatórios',
  'margins'          => 'Margens & Custos',
  'users'            => 'Utilizadores',
  'settings'         => 'Configurações',
  'audit'            => 'Auditoria / Logs',
  'backup'           => 'Backup / Importação',
];
$base = explode('/', $route)[0];
$pageTitle = $titles[$base] ?? 'Painel';
?>
<header class="app-header">
  <div class="header-title"><?= e($pageTitle) ?></div>

  <div class="header-user">
    <div class="notif-bell">
      <button id="notifBell" class="notif-bell-btn" title="Notificações"
              data-feed="<?= url('notifications/feed') ?>"
              data-list="<?= url('notifications') ?>">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M10.268 21a2 2 0 0 0 3.464 0"/>
          <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326Z"/>
        </svg>
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
