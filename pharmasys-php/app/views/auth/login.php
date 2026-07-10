<div class="auth-shell">
  <div class="auth-brand">
    <div class="auth-logo" aria-hidden="true">
      <!-- Pílula (mesma identidade do frontend Lovable) -->
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path>
        <path d="m8.5 8.5 7 7"></path>
      </svg>
    </div>
    <h1 class="auth-brand-title">PharmaSys</h1>
    <p class="auth-brand-subtitle">Gestão de vendas e estoque para farmácias</p>
  </div>

  <form class="auth-card" method="POST" action="<?= url('login/submit') ?>">
    <?= csrfField() ?>

    <div class="auth-card-header">
      <h2 class="auth-card-title">Bem-vindo</h2>
      <p class="auth-card-desc">Entre com a sua conta para continuar.</p>
    </div>

    <div class="auth-field">
      <label class="auth-label" for="username">Utilizador</label>
      <input class="auth-input" type="text" name="username" id="username"
             placeholder="admin" required autofocus autocomplete="username">
    </div>

    <div class="auth-field">
      <label class="auth-label" for="password">Palavra-passe</label>
      <input class="auth-input" type="password" name="password" id="password"
             placeholder="••••••••" required autocomplete="current-password">
    </div>

    <button class="auth-btn" type="submit">Entrar</button>

    <p class="auth-hint">Use as credenciais fornecidas pelo administrador.</p>
  </form>

  <p class="auth-footer">© <?= date('Y') ?> PharmaSys · Todos os direitos reservados</p>
</div>
