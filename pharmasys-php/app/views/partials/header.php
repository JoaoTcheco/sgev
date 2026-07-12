<?php
$u = currentUser();

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
  'labels'           => 'Etiquetas',
  'products'         => 'Produtos',
  'categories'       => 'Categorias',
  'suppliers'        => 'Fornecedores',
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
  <div class="header-left">
    <button type="button" class="sb-toggle" id="sb-toggle" aria-label="Abrir menu" aria-expanded="false">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
    <div class="header-title"><?= e($pageTitle) ?></div>
  </div>

  <div class="header-user">
    <span class="user-name"><?= e($u['full_name'] ?? '') ?></span>
    <span class="user-badge"><?= e($u['role'] ?? '') ?></span>
  </div>
</header>
<div class="sb-overlay" id="sb-overlay" hidden></div>
