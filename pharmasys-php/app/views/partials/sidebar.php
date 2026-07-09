<?php $u = currentUser(); $r = $_GET['r'] ?? ''; ?>
<aside class="app-sidebar">
  <div class="brand">
    <div class="brand-logo">PS</div>
    <div>
      <div class="brand-name">PharmaSys</div>
      <div class="brand-role"><?= e(ucfirst($u['role'] ?? '')) ?></div>
    </div>
  </div>
  <nav class="nav">
    <a href="<?= url('dashboard') ?>" class="nav-item <?= $r === 'dashboard' ? 'active' : '' ?>">Dashboard</a>

    <div class="nav-section">Operação</div>
    <a href="<?= url('pdv') ?>"      class="nav-item nav-item-primary <?= str_starts_with($r,'pdv')||$r==='sales/checkout'||$r==='sales/receipt' ? 'active' : '' ?>">🛒 PDV — Vendas</a>
    <a href="<?= url('cash') ?>"     class="nav-item <?= str_starts_with($r,'cash') ? 'active' : '' ?>">Caixa</a>
    <a href="<?= url('history') ?>"  class="nav-item <?= str_starts_with($r,'history') ? 'active' : '' ?>">Histórico / Estorno</a>

    <div class="nav-section">Stock</div>
    <a href="<?= url('stock') ?>"    class="nav-item <?= str_starts_with($r,'stock')    ? 'active' : '' ?>">Estoque</a>
    <a href="<?= url('batches') ?>"  class="nav-item <?= str_starts_with($r,'batches')  ? 'active' : '' ?>">Lotes / Entradas</a>
    <a href="<?= url('alerts') ?>"   class="nav-item <?= str_starts_with($r,'alerts')   ? 'active' : '' ?>">
      Alertas
      <?php $n = AlertModel::countOpen(); if ($n): ?><span class="nav-count"><?= $n ?></span><?php endif; ?>
    </a>
    <a href="<?= url('labels') ?>"   class="nav-item <?= str_starts_with($r,'labels')   ? 'active' : '' ?>">Etiquetas</a>

    <div class="nav-section">Cadastros</div>
    <a href="<?= url('products') ?>"   class="nav-item <?= str_starts_with($r,'products')   ? 'active' : '' ?>">Produtos</a>
    <a href="<?= url('categories') ?>" class="nav-item <?= str_starts_with($r,'categories') ? 'active' : '' ?>">Categorias</a>
    <a href="<?= url('suppliers') ?>"  class="nav-item <?= str_starts_with($r,'suppliers')  ? 'active' : '' ?>">Fornecedores</a>
    <a href="<?= url('customers') ?>"  class="nav-item <?= str_starts_with($r,'customers')  ? 'active' : '' ?>">Clientes</a>

    <?php if (hasRole('admin','pharmacist')): ?>
      <div class="nav-section">Análise</div>
      <a href="<?= url('reports') ?>"  class="nav-item <?= str_starts_with($r,'reports')  ? 'active' : '' ?>">Relatórios</a>
      <a href="<?= url('accounts') ?>" class="nav-item <?= str_starts_with($r,'accounts') ? 'active' : '' ?>">Contas Financeiras</a>
    <?php endif; ?>

    <?php if (hasRole('admin')): ?>
      <div class="nav-section">Administração</div>
      <a href="<?= url('users') ?>"    class="nav-item <?= str_starts_with($r,'users')    ? 'active' : '' ?>">Utilizadores</a>
      <a href="<?= url('settings') ?>" class="nav-item <?= str_starts_with($r,'settings') ? 'active' : '' ?>">Configurações</a>
      <a href="<?= url('backup') ?>"   class="nav-item <?= str_starts_with($r,'backup')   ? 'active' : '' ?>">Backup / Importação</a>
    <?php endif; ?>
  </nav>
  <a href="<?= url('logout') ?>" class="nav-logout">Sair</a>
</aside>
