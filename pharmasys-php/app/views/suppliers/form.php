<section class="crud">
  <h1 class="page-title"><?= $editing ? 'Editar fornecedor' : 'Novo fornecedor' ?></h1>
  <form method="POST" action="<?= url('suppliers/save') ?>" class="form-card">
    <?= csrfField() ?>
    <input type="hidden" name="id" value="<?= e($editing['id'] ?? '') ?>">

    <div class="grid-2">
      <div><label>Nome legal *</label>
        <input type="text" name="legal_name" required value="<?= e($editing['legal_name'] ?? '') ?>"></div>
      <div><label>NUIT</label>
        <input type="text" name="tax_id" value="<?= e($editing['tax_id'] ?? '') ?>"></div>
      <div><label>Contacto</label>
        <input type="text" name="contact_name" value="<?= e($editing['contact_name'] ?? '') ?>"></div>
      <div><label>Telefone</label>
        <input type="text" name="phone" value="<?= e($editing['phone'] ?? '') ?>"></div>
      <div><label>Email</label>
        <input type="email" name="email" value="<?= e($editing['email'] ?? '') ?>"></div>
      <div><label>Endereço</label>
        <input type="text" name="address" value="<?= e($editing['address'] ?? '') ?>"></div>
    </div>
    <label>Observações</label>
    <textarea name="notes" rows="3"><?= e($editing['notes'] ?? '') ?></textarea>

    <label class="checkbox">
      <input type="checkbox" name="active" <?= (!$editing || $editing['active']) ? 'checked' : '' ?>>
      Fornecedor activo
    </label>

    <div class="form-actions">
      <a class="btn btn-ghost" href="<?= url('suppliers') ?>">Cancelar</a>
      <button class="btn btn-primary" type="submit">Guardar</button>
    </div>
  </form>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
