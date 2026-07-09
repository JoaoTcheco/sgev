<div class="login-wrapper">
  <form class="login-card" method="POST" action="<?= url('login/submit') ?>">
    <?= csrfField() ?>
    <div class="login-logo">PS</div>
    <h1 class="login-title">PharmaSys</h1>
    <p class="login-subtitle">Gestão de Farmácia</p>

    <label class="login-label" for="username">Utilizador</label>
    <input class="login-input" type="text" name="username" id="username" required autofocus>

    <label class="login-label" for="password">Senha</label>
    <input class="login-input" type="password" name="password" id="password" required>

    <button class="login-btn" type="submit">Entrar</button>

    <p class="login-hint">Padrão: <strong>admin</strong> / <strong>PharmaAdmin@2026</strong></p>
  </form>
</div>
