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
  <div class="header-title"><?= e($pageTitle) ?></div>

  <div class="header-user">
    <span class="user-name"><?= e($u['full_name'] ?? '') ?></span>
    <span class="user-badge"><?= e($u['role'] ?? '') ?></span>
  </div>
</header>
