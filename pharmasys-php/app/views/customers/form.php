<section class="crud">
  <h1 class="page-title"><?= $editing ? 'Editar cliente' : 'Novo cliente' ?></h1>
  <form method="POST" action="<?= url('customers/save') ?>" class="form-card">
    <?= csrfField() ?>
    <input type="hidden" name="id" value="<?= e($editing['id'] ?? '') ?>">

    <div class="grid-2">
      <div><label>Nome *</label>
        <input type="text" name="name" required value="<?= e($editing['name'] ?? '') ?>"></div>
      <div><label>NUIT</label>
        <input type="text" name="nuit" value="<?= e($editing['nuit'] ?? '') ?>"></div>
      <div><label>Telefone</label>
        <input type="text" name="phone" value="<?= e($editing['phone'] ?? '') ?>"></div>
      <div><label>Email</label>
        <input type="email" name="email" value="<?= e($editing['email'] ?? '') ?>"></div>
    </div>
    <label>Endereço</label>
    <input type="text" name="address" value="<?= e($editing['address'] ?? '') ?>">
    <label>Observações</label>
    <textarea name="notes" rows="3"><?= e($editing['notes'] ?? '') ?></textarea>

    <div class="form-actions">
      <a class="btn btn-ghost" href="<?= url('customers') ?>">Cancelar</a>
      <button class="btn btn-primary" type="submit">Guardar</button>
    </div>
  </form>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
