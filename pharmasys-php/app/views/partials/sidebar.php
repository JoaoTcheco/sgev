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

    <div class="nav-section">Cadastros</div>
    <a href="<?= url('products') ?>"   class="nav-item <?= str_starts_with($r,'products')   ? 'active' : '' ?>">Produtos</a>
    <a href="<?= url('categories') ?>" class="nav-item <?= str_starts_with($r,'categories') ? 'active' : '' ?>">Categorias</a>
    <a href="<?= url('suppliers') ?>"  class="nav-item <?= str_starts_with($r,'suppliers')  ? 'active' : '' ?>">Fornecedores</a>
    <a href="<?= url('customers') ?>"  class="nav-item <?= str_starts_with($r,'customers')  ? 'active' : '' ?>">Clientes</a>

    <?php if (hasRole('admin')): ?>
      <div class="nav-section">Administração</div>
      <a href="<?= url('users') ?>"    class="nav-item <?= str_starts_with($r,'users')    ? 'active' : '' ?>">Utilizadores</a>
      <a href="<?= url('settings') ?>" class="nav-item <?= str_starts_with($r,'settings') ? 'active' : '' ?>">Configurações</a>
    <?php endif; ?>

    <div class="nav-section">Próximos pacotes</div>
    <span class="nav-item disabled">Estoque / Lotes</span>
    <span class="nav-item disabled">Vendas (PDV)</span>
    <span class="nav-item disabled">Caixa</span>
    <span class="nav-item disabled">Histórico de Vendas</span>
    <span class="nav-item disabled">Relatórios</span>
  </nav>
  <a href="<?= url('logout') ?>" class="nav-logout">Sair</a>
</aside>
