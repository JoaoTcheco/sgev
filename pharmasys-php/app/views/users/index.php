<section class="crud">
  <div class="crud-header">
    <div>
      <h1 class="page-title">Utilizadores</h1>
      <p class="page-subtitle">Gestão de contas e papéis</p>
    </div>
    <a href="<?= url('users/new') ?>" class="btn btn-primary">+ Novo utilizador</a>
  </div>

  <div class="crud-table-card">
    <table class="data-table">
      <thead><tr><th>Nome</th><th>Utilizador</th><th>Email</th><th>Papel</th><th>Estado</th><th style="width:130px;">Acções</th></tr></thead>
      <tbody>
      <?php foreach ($items as $u): ?>
        <tr>
          <td><strong><?= e($u['full_name']) ?></strong></td>
          <td><code><?= e($u['username']) ?></code></td>
          <td><?= e($u['email'] ?: '—') ?></td>
          <td><span class="badge badge-blue"><?= e(ucfirst($u['role'])) ?></span></td>
          <td><span class="badge <?= $u['active'] ? 'badge-green' : 'badge-gray' ?>"><?= $u['active'] ? 'Activo' : 'Inactivo' ?></span></td>
          <td class="actions">
            <a href="<?= url('users/edit') ?>&id=<?= e($u['id']) ?>" class="btn btn-sm">Editar</a>
            <?php if (currentUser()['id'] !== $u['id']): ?>
              <?php if ($u['active']): ?>
                <form method="POST" action="<?= url('users/delete') ?>" onsubmit="return confirm('Desactivar utilizador?')" style="display:inline;">
                  <?= csrfField() ?><input type="hidden" name="id" value="<?= e($u['id']) ?>">
                  <button class="btn btn-sm btn-danger" title="Desactivar">×</button>
                </form>
              <?php else: ?>
                <form method="POST" action="<?= url('users/activate') ?>" style="display:inline;">
                  <?= csrfField() ?><input type="hidden" name="id" value="<?= e($u['id']) ?>">
                  <button class="btn btn-sm btn-success" title="Reactivar">✓</button>
                </form>
              <?php endif; ?>
            <?php endif; ?>
          </td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
