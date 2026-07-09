<section class="crud">
  <h1 class="page-title"><?= $editing ? 'Editar utilizador' : 'Novo utilizador' ?></h1>
  <form method="POST" action="<?= url('users/save') ?>" class="form-card">
    <?= csrfField() ?>
    <input type="hidden" name="id" value="<?= e($editing['id'] ?? '') ?>">

    <div class="grid-2">
      <div><label>Nome completo *</label>
        <input type="text" name="full_name" required value="<?= e($editing['full_name'] ?? '') ?>"></div>
      <div><label>Utilizador *</label>
        <input type="text" name="username" required value="<?= e($editing['username'] ?? '') ?>"></div>
      <div><label>Email</label>
        <input type="email" name="email" value="<?= e($editing['email'] ?? '') ?>"></div>
      <div><label>Papel *</label>
        <select name="role" required>
          <?php foreach (['admin'=>'Administrador','pharmacist'=>'Farmacêutico','cashier'=>'Operador de caixa'] as $k=>$v): ?>
            <option value="<?= $k ?>" <?= ($editing['role'] ?? 'cashier') === $k ? 'selected' : '' ?>><?= $v ?></option>
          <?php endforeach; ?>
        </select></div>
    </div>
    <label>Senha <?= $editing ? '(deixa vazio para manter)' : '*' ?></label>
    <input type="password" name="password" <?= $editing ? '' : 'required' ?> minlength="8">

    <label class="checkbox">
      <input type="checkbox" name="active" <?= (!$editing || $editing['active']) ? 'checked' : '' ?>>
      Conta activa
    </label>

    <div class="form-actions">
      <a class="btn btn-ghost" href="<?= url('users') ?>">Cancelar</a>
      <button class="btn btn-primary" type="submit">Guardar</button>
    </div>
  </form>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
