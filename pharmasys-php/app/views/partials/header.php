<?php $u = currentUser(); ?>
<header class="app-header">
  <div class="header-title">Painel</div>
  <div class="header-user">
    <span class="user-name"><?= e($u['full_name'] ?? '') ?></span>
    <span class="user-badge"><?= e($u['role'] ?? '') ?></span>
  </div>
</header>
