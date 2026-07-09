<section class="crud">
  <div class="crud-header">
    <div>
      <h1 class="page-title">Clientes</h1>
      <p class="page-subtitle"><?= count($items) ?> cliente(s) registados</p>
    </div>
    <a href="<?= url('customers/new') ?>" class="btn btn-primary">+ Novo cliente</a>
  </div>

  <div class="crud-table-card">
    <table class="data-table">
      <thead><tr><th>Nome</th><th>NUIT</th><th>Telefone</th><th>Email</th><th style="width:130px;">Acções</th></tr></thead>
      <tbody>
      <?php if (!$items): ?>
        <tr><td colspan="5" class="empty">Nenhum cliente. <a href="<?= url('customers/new') ?>">Criar o primeiro</a></td></tr>
      <?php else: foreach ($items as $c): ?>
        <tr>
          <td><strong><?= e($c['name']) ?></strong></td>
          <td><?= e($c['nuit'] ?: '—') ?></td>
          <td><?= e($c['phone'] ?: '—') ?></td>
          <td><?= e($c['email'] ?: '—') ?></td>
          <td class="actions">
            <a href="<?= url('customers/edit') ?>&id=<?= e($c['id']) ?>" class="btn btn-sm">Editar</a>
            <form method="POST" action="<?= url('customers/delete') ?>" onsubmit="return confirm('Remover?')" style="display:inline;">
              <?= csrfField() ?><input type="hidden" name="id" value="<?= e($c['id']) ?>">
              <button class="btn btn-sm btn-danger">×</button>
            </form>
          </td>
        </tr>
      <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
