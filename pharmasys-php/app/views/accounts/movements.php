<?php $isAdmin = hasRole('admin'); ?>
<section class="accounts">
  <div class="crud-header">
    <div>
      <h1 class="page-title">Extracto — <?= e($account['name']) ?></h1>
      <p class="page-subtitle">Saldo actual: <strong><?= formatMZN($account['balance']) ?></strong></p>
    </div>
    <div style="display:flex;gap:8px;">
      <a href="<?= url('accounts/movements/export') ?>&id=<?= e($account['id']) ?><?= !empty($filters['type'])?'&type='.e($filters['type']):'' ?><?= !empty($filters['date_from'])?'&date_from='.e($filters['date_from']):'' ?><?= !empty($filters['date_to'])?'&date_to='.e($filters['date_to']):'' ?>" class="btn">⬇ Exportar CSV</a>
      <a href="<?= url('accounts') ?>" class="btn">← Contas</a>
    </div>

  </div>

  <div class="acc-summary">
    <div class="acc-tile"><span class="lbl">Entradas (filtro)</span><span class="val pos">+ <?= formatMZN($totals['credits']) ?></span></div>
    <div class="acc-tile"><span class="lbl">Saídas (filtro)</span><span class="val neg">− <?= formatMZN($totals['debits']) ?></span></div>
    <div class="acc-tile"><span class="lbl">Líquido</span><span class="val"><?= formatMZN($totals['net']) ?></span></div>
    <div class="acc-tile"><span class="lbl">Movimentos</span><span class="val"><?= (int)$totals['count'] ?></span></div>
  </div>

  <div class="acc-panels">
    <form method="GET" class="acc-filter">
      <input type="hidden" name="r" value="accounts/movements">
      <input type="hidden" name="id" value="<?= e($account['id']) ?>">
      <label>Tipo
        <select name="type">
          <option value="">Todos</option>
          <option value="credit" <?= ($filters['type']??'')==='credit'?'selected':'' ?>>Entradas</option>
          <option value="debit"  <?= ($filters['type']??'')==='debit' ?'selected':'' ?>>Saídas</option>
        </select>
      </label>
      <label>De <input type="date" name="date_from" value="<?= e($filters['date_from'] ?? '') ?>"></label>
      <label>Até <input type="date" name="date_to" value="<?= e($filters['date_to'] ?? '') ?>"></label>
      <button class="btn btn-primary">Filtrar</button>
      <a href="<?= url('accounts/movements') ?>&id=<?= e($account['id']) ?>" class="btn">Limpar</a>
    </form>

    <?php if ($isAdmin): ?>
      <form method="POST" action="<?= url('accounts/adjust') ?>" class="acc-adjust" onsubmit="return confirm('Aplicar este ajuste?')">
        <?= csrfField() ?>
        <input type="hidden" name="account_id" value="<?= e($account['id']) ?>">
        <strong>Ajuste rápido</strong>
        <select name="adj_type" required>
          <option value="debit">− Subtrair</option>
          <option value="credit">+ Adicionar</option>
          <option value="reset">⟲ Zerar</option>
        </select>
        <input type="number" name="amount" min="0" step="0.01" placeholder="Valor">
        <input name="reason" placeholder="Motivo (ex: levantamento)" maxlength="200">
        <button class="btn">Aplicar</button>
      </form>
    <?php endif; ?>
  </div>

  <div class="crud-table-card">
    <table class="data-table">
      <thead>
        <tr>
          <th>Data</th><th>Tipo</th><th>Motivo</th><th>Recibo</th><th>Utilizador</th><th style="text-align:right;">Valor</th>
        </tr>
      </thead>
      <tbody>
      <?php if (!$movements): ?>
        <tr><td colspan="6" class="empty">Sem movimentos para o filtro seleccionado.</td></tr>
      <?php else: foreach ($movements as $m): ?>
        <tr>
          <td><?= formatDateTime($m['created_at']) ?></td>
          <td>
            <?php if ($m['type']==='credit'): ?>
              <span class="chip chip-pos">Entrada</span>
            <?php else: ?>
              <span class="chip chip-neg">Saída</span>
            <?php endif; ?>
          </td>
          <td><?= e($m['reason'] ?: '—') ?></td>
          <td><?= $m['receipt_number'] ? '<a href="'.e(url('history/view')).'&id='.e($m['sale_id']).'">'.e($m['receipt_number']).'</a>' : '—' ?></td>
          <td><?= e($m['user_name'] ?: '—') ?></td>
          <td style="text-align:right;font-weight:600;" class="<?= $m['type']==='credit'?'pos':'neg' ?>">
            <?= $m['type']==='credit'?'+':'−' ?> <?= formatMZN($m['amount']) ?>
          </td>
        </tr>
      <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</section>
<link rel="stylesheet" href="<?= asset('css/accounts.css') ?>">
