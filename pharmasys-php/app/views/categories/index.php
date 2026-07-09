<section class="crud">
  <div class="crud-header">
    <div>
      <h1 class="page-title">Categorias</h1>
      <p class="page-subtitle">Organiza produtos em categorias</p>
    </div>
  </div>

  <div class="crud-layout">
    <form method="POST" action="<?= url('categories/save') ?>" class="crud-form-card">
      <?= csrfField() ?>
      <input type="hidden" name="id" value="<?= e($editing['id'] ?? '') ?>">
      <h3><?= $editing ? 'Editar categoria' : 'Nova categoria' ?></h3>
      <label>Nome *</label>
      <input type="text" name="name" required value="<?= e($editing['name'] ?? '') ?>">
      <label>Descrição</label>
      <textarea name="description" rows="3"><?= e($editing['description'] ?? '') ?></textarea>
      <div class="form-actions">
        <?php if ($editing): ?><a class="btn btn-ghost" href="<?= url('categories') ?>">Cancelar</a><?php endif; ?>
        <button class="btn btn-primary" type="submit"><?= $editing ? 'Actualizar' : 'Criar' ?></button>
      </div>
    </form>

    <div class="crud-table-card">
      <table class="data-table">
        <thead><tr><th>Nome</th><th>Descrição</th><th style="width:120px;">Acções</th></tr></thead>
        <tbody>
        <?php if (!$items): ?>
          <tr><td colspan="3" class="empty">Nenhuma categoria criada.</td></tr>
        <?php else: foreach ($items as $c): ?>
          <tr>
            <td><strong><?= e($c['name']) ?></strong></td>
            <td><?= e($c['description'] ?? '—') ?></td>
            <td class="actions">
              <a href="<?= url('categories') ?>&edit=<?= e($c['id']) ?>" class="btn btn-sm">Editar</a>
              <form method="POST" action="<?= url('categories/delete') ?>" onsubmit="return confirm('Remover?')" style="display:inline;">
                <?= csrfField() ?><input type="hidden" name="id" value="<?= e($c['id']) ?>">
                <button class="btn btn-sm btn-danger">×</button>
              </form>
            </td>
          </tr>
        <?php endforeach; endif; ?>
        </tbody>
      </table>
    </div>
  </div>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
