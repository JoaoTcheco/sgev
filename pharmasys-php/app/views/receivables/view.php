<?php
$statusLabels = ['open'=>'Em aberto','partial'=>'Parcial','paid'=>'Recebido','canceled'=>'Cancelada'];
$balance = (float)$item['amount'] - (float)$item['paid_amount'];
$canPay  = in_array($item['status'], ['open','partial'], true);
?>
<section class="apar-view">
  <div class="crud-header">
    <div>
      <h1 class="page-title"><?= e($item['description']) ?></h1>
      <p class="page-subtitle">
        <?php if ($item['receipt_number']): ?>Venda <?= e($item['receipt_number']) ?> · <?php endif; ?>
        Vencimento <?= e(date('d/m/Y', strtotime($item['due_date']))) ?>
      </p>
    </div>
    <div class="header-actions">
      <a href="<?= url('receivables') ?>" class="btn btn-ghost">← Voltar</a>
      <?php if ($canPay): ?>
        <a href="<?= url('receivables/edit') ?>&id=<?= e($item['id']) ?>" class="btn">Editar</a>
      <?php endif; ?>
    </div>
  </div>

  <div class="apar-kpis">
    <div class="apar-tile"><span class="lbl">Valor total</span><span class="val"><?= formatMZN($item['amount']) ?></span></div>
    <div class="apar-tile"><span class="lbl">Recebido</span><span class="val"><?= formatMZN($item['paid_amount']) ?></span></div>
    <div class="apar-tile apar-<?= $balance>0?'warn':'ok' ?>"><span class="lbl">Saldo</span><span class="val"><?= formatMZN($balance) ?></span></div>
    <div class="apar-tile"><span class="lbl">Estado</span><span class="val"><span class="chip chip-<?= e($item['status']) ?>"><?= e($statusLabels[$item['status']]) ?></span></span></div>
  </div>

  <?php if ($canPay && $balance > 0): ?>
    <div class="card">
      <h3>Registar recebimento</h3>
      <form method="POST" action="<?= url('receivables/receive') ?>" class="pay-form">
        <?= csrfField() ?>
        <input type="hidden" name="id" value="<?= e($item['id']) ?>">
        <div class="grid-4">
          <label>Valor *
            <input type="number" step="0.01" min="0.01" max="<?= number_format($balance,2,'.','') ?>" name="amount" required value="<?= number_format($balance,2,'.','') ?>">
          </label>
          <label>Conta destino *
            <select name="account_id" required>
              <?php foreach ($accounts as $a): ?>
                <option value="<?= e($a['id']) ?>"><?= e($a['name']) ?> (<?= formatMZN($a['balance']) ?>)</option>
              <?php endforeach; ?>
            </select>
          </label>
          <label>Data *
            <input type="date" name="paid_at" required value="<?= date('Y-m-d') ?>">
          </label>
          <label>Método
            <input type="text" name="method" placeholder="Ex: numerário">
          </label>
        </div>
        <label>Notas
          <input type="text" name="notes">
        </label>
        <div class="form-actions">
          <button class="btn btn-primary">Receber <?= formatMZN($balance) ?></button>
        </div>
      </form>
    </div>
  <?php endif; ?>

  <div class="card">
    <h3>Histórico de recebimentos</h3>
    <?php if (!$payments): ?>
      <p class="empty">Sem recebimentos.</p>
    <?php else: ?>
      <table>
        <thead><tr><th>Data</th><th>Conta</th><th>Método</th><th class="right">Valor</th><th>Utilizador</th><th>Notas</th></tr></thead>
        <tbody>
          <?php foreach ($payments as $pay): ?>
            <tr>
              <td><?= e(date('d/m/Y', strtotime($pay['paid_at']))) ?></td>
              <td><?= e($pay['account_name'] ?? '—') ?></td>
              <td><?= e($pay['method'] ?? '—') ?></td>
              <td class="right"><?= formatMZN($pay['amount']) ?></td>
              <td><?= e($pay['user_name'] ?? '—') ?></td>
              <td><?= e($pay['notes'] ?? '') ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>
  </div>

  <?php if ($item['notes']): ?>
    <div class="card"><h3>Notas</h3><p><?= nl2br(e($item['notes'])) ?></p></div>
  <?php endif; ?>

  <?php if ($canPay): ?>
    <div class="danger-zone">
      <?php if ((float)$item['paid_amount'] == 0): ?>
        <form method="POST" action="<?= url('receivables/cancel') ?>" onsubmit="return confirm('Cancelar esta conta?')" style="display:inline">
          <?= csrfField() ?><input type="hidden" name="id" value="<?= e($item['id']) ?>">
          <button class="btn btn-warning">Cancelar conta</button>
        </form>
        <form method="POST" action="<?= url('receivables/delete') ?>" onsubmit="return confirm('Eliminar permanentemente?')" style="display:inline">
          <?= csrfField() ?><input type="hidden" name="id" value="<?= e($item['id']) ?>">
          <button class="btn btn-danger">Eliminar</button>
        </form>
      <?php endif; ?>
    </div>
  <?php endif; ?>
</section>
<link rel="stylesheet" href="<?= asset('css/ap_ar.css') ?>">
