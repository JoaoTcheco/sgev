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
    <div class="nav-section">Próximos pacotes</div>
    <span class="nav-item disabled">Vendas (PDV)</span>
    <span class="nav-item disabled">Histórico de Vendas</span>
    <span class="nav-item disabled">Produtos</span>
    <span class="nav-item disabled">Estoque</span>
    <span class="nav-item disabled">Caixa</span>
    <span class="nav-item disabled">Relatórios</span>
    <span class="nav-item disabled">Utilizadores</span>
    <span class="nav-item disabled">Configurações</span>
  </nav>
  <a href="<?= url('logout') ?>" class="nav-logout">Sair</a>
</aside>
