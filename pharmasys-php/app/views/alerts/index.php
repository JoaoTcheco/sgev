<section class="crud">
  <div class="crud-header">
    <div>
      <h1 class="page-title">Alertas</h1>
      <p class="page-subtitle"><?= count($items) ?> alerta(s) em aberto</p>
    </div>
    <form method="POST" action="<?= url('alerts/refresh') ?>" style="display:inline;">
      <?= csrfField() ?>
      <button class="btn btn-primary">↻ Recalcular alertas</button>
    </form>
  </div>

  <div class="crud-table-card">
    <table class="data-table">
      <thead><tr><th>Severidade</th><th>Tipo</th><th>Mensagem</th><th>Data</th><th style="width:100px;">Acção</th></tr></thead>
      <tbody>
      <?php if (!$items): ?>
        <tr><td colspan="5" class="empty">✅ Sem alertas abertos. Usa "Recalcular alertas" para verificar o estado actual.</td></tr>
      <?php else: foreach ($items as $a):
        $sev = ['high'=>'badge-red','medium'=>'badge-orange','low'=>'badge-blue'][$a['severity']] ?? 'badge-gray';
        $type = ['low_stock'=>'Stock baixo','expiring'=>'A expirar','expired'=>'Expirado'][$a['type']] ?? $a['type'];
      ?>
        <tr>
          <td><span class="badge <?= $sev ?>"><?= e(strtoupper($a['severity'])) ?></span></td>
          <td><?= e($type) ?></td>
          <td><?= e($a['message']) ?></td>
          <td><small><?= e(formatDateTime($a['created_at'])) ?></small></td>
          <td>
            <form method="POST" action="<?= url('alerts/resolve') ?>" style="display:inline;">
              <?= csrfField() ?><input type="hidden" name="id" value="<?= e($a['id']) ?>">
              <button class="btn btn-sm">Resolver</button>
            </form>
          </td>
        </tr>
      <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
