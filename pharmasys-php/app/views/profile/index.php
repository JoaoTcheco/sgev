<?php
$roleLabels = ['admin'=>'Administrador','pharmacist'=>'Farmacêutico','cashier'=>'Operador de caixa'];
$initials = strtoupper(mb_substr($user['full_name'] ?? 'U', 0, 1));
$parts = preg_split('/\s+/', trim($user['full_name'] ?? ''));
if (count($parts) > 1) $initials .= strtoupper(mb_substr(end($parts), 0, 1));
?>
<section class="crud">
  <div class="crud-header">
    <div>
      <h1 class="page-title">Meu perfil</h1>
      <p class="page-subtitle">Gerir dados pessoais e palavra-passe</p>
    </div>
  </div>

  <div class="profile-grid">
    <aside class="profile-card">
      <div class="profile-avatar"><?= e($initials) ?></div>
      <h2 class="profile-name"><?= e($user['full_name']) ?></h2>
      <div class="profile-username"><code>@<?= e($user['username']) ?></code></div>
      <div class="profile-badges">
        <span class="badge badge-blue"><?= e($roleLabels[$user['role']] ?? ucfirst($user['role'])) ?></span>
        <span class="badge <?= $user['active'] ? 'badge-green' : 'badge-gray' ?>"><?= $user['active'] ? 'Activo' : 'Inactivo' ?></span>
      </div>
      <dl class="profile-meta">
        <dt>Email</dt><dd><?= e($user['email'] ?: '—') ?></dd>
        <dt>Membro desde</dt><dd><?= e(formatDateTime($user['created_at'])) ?></dd>
      </dl>
    </aside>

    <div class="profile-forms">
      <div class="form-card">
        <h3>Dados pessoais</h3>
        <form method="POST" action="<?= url('profile/save') ?>">
          <?= csrfField() ?>
          <div class="grid-2">
            <div><label>Nome completo *</label>
              <input type="text" name="full_name" required value="<?= e($user['full_name']) ?>"></div>
            <div><label>Email</label>
              <input type="email" name="email" value="<?= e($user['email']) ?>"></div>
            <div><label>Utilizador</label>
              <input type="text" value="<?= e($user['username']) ?>" disabled></div>
            <div><label>Papel</label>
              <input type="text" value="<?= e($roleLabels[$user['role']] ?? ucfirst($user['role'])) ?>" disabled></div>
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit">Guardar alterações</button>
          </div>
        </form>
      </div>

      <div class="form-card">
        <h3>Alterar palavra-passe</h3>
        <form method="POST" action="<?= url('profile/password') ?>">
          <?= csrfField() ?>
          <div class="grid-2">
            <div><label>Palavra-passe actual *</label>
              <input type="password" name="current_password" required autocomplete="current-password"></div>
            <div></div>
            <div><label>Nova palavra-passe *</label>
              <input type="password" name="new_password" required minlength="<?= (int)config('password_min_length', 8) ?>" autocomplete="new-password"></div>
            <div><label>Confirmar nova *</label>
              <input type="password" name="confirm_password" required minlength="<?= (int)config('password_min_length', 8) ?>" autocomplete="new-password"></div>
          </div>
          <p class="hint">Mínimo de <?= (int)config('password_min_length', 8) ?> caracteres.</p>
          <div class="form-actions">
            <button class="btn btn-primary" type="submit">Alterar palavra-passe</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
<link rel="stylesheet" href="<?= asset('css/profile.css') ?>">
