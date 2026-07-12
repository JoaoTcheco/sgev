<section class="crud">
  <div class="crud-header">
    <div>
      <h1 class="page-title">Fornecedores</h1>
      <p class="page-subtitle"><?= count($items) ?> fornecedor(es) registados</p>
    </div>
    <div style="display:flex;gap:8px;">
      <a href="<?= url('nfe') ?>" class="btn">⬆ Importar NF-e (XML)</a>
      <a href="<?= url('suppliers/new') ?>" class="btn btn-primary">+ Novo fornecedor</a>
    </div>
  </div>

  <div class="crud-table-card">
    <table class="data-table">
      <thead>
        <tr>
          <th>Nome</th><th>NUIT</th><th>Contacto</th><th>Telefone</th><th>Email</th>
          <th>Estado</th><th style="width:130px;">Acções</th>
        </tr>
      </thead>
      <tbody>
      <?php if (!$items): ?>
        <tr><td colspan="7" class="empty">Nenhum fornecedor. <a href="<?= url('suppliers/new') ?>">Criar o primeiro</a></td></tr>
      <?php else: foreach ($items as $s): ?>
        <tr>
          <td><strong><?= e($s['legal_name']) ?></strong></td>
          <td><?= e($s['tax_id'] ?: '—') ?></td>
          <td><?= e($s['contact_name'] ?: '—') ?></td>
          <td><?= e($s['phone'] ?: '—') ?></td>
          <td><?= e($s['email'] ?: '—') ?></td>
          <td><span class="badge <?= $s['active'] ? 'badge-green' : 'badge-gray' ?>"><?= $s['active'] ? 'Activo' : 'Inactivo' ?></span></td>
          <td class="actions">
            <a href="<?= url('suppliers/view') ?>&id=<?= e($s['id']) ?>" class="btn btn-sm btn-primary">Ver</a>
            <a href="<?= url('suppliers/edit') ?>&id=<?= e($s['id']) ?>" class="btn btn-sm">Editar</a>
            <form method="POST" action="<?= url('suppliers/delete') ?>" onsubmit="return confirm('Remover?')" style="display:inline;">
              <?= csrfField() ?><input type="hidden" name="id" value="<?= e($s['id']) ?>">
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
