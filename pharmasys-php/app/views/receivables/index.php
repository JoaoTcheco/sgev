<?php
$statusLabels = ['open'=>'Em aberto','partial'=>'Parcial','paid'=>'Recebido','canceled'=>'Cancelada'];
?>
<section class="ap-ar">
  <div class="crud-header">
    <div>
      <h1 class="page-title">Contas a Receber</h1>
      <p class="page-subtitle">Valores a receber de clientes</p>
    </div>
    <div class="header-actions" style="display:flex;gap:8px;">
      <a href="<?= url('receivables/export') ?>&<?= http_build_query($filters) ?>" class="btn btn-ghost">⬇ CSV</a>
      <a href="<?= url('receivables/new') ?>" class="btn btn-primary">+ Nova conta</a>
    </div>
  </div>

  <div class="apar-kpis">
    <div class="apar-tile"><span class="lbl">Em aberto</span><span class="val"><?= formatMZN($kpis['open']) ?></span></div>
    <div class="apar-tile apar-danger"><span class="lbl">Vencidas</span><span class="val"><?= formatMZN($kpis['overdue']) ?></span></div>
    <div class="apar-tile apar-warn"><span class="lbl">A vencer (7d)</span><span class="val"><?= formatMZN($kpis['due_7d']) ?></span></div>
    <div class="apar-tile"><span class="lbl">Recebido no mês</span><span class="val"><?= formatMZN($kpis['received_month']) ?></span></div>
  </div>

  <form method="GET" class="apar-filters">
    <input type="hidden" name="r" value="receivables">
    <input type="text" name="q" placeholder="Descrição ou cliente…" value="<?= e($filters['q']) ?>">
    <select name="status">
      <option value="">Todos os estados</option>
      <?php foreach ($statusLabels as $k=>$v): ?>
        <option value="<?= $k ?>" <?= $filters['status']===$k?'selected':'' ?>><?= $v ?></option>
      <?php endforeach; ?>
    </select>
    <input type="date" name="due_from" value="<?= e($filters['due_from']) ?>">
    <input type="date" name="due_to"   value="<?= e($filters['due_to']) ?>">
    <label class="chk"><input type="checkbox" name="overdue" value="1" <?= $filters['overdue']?'checked':'' ?>> Só vencidas</label>
    <button class="btn">Filtrar</button>
    <a href="<?= url('receivables') ?>" class="btn btn-ghost">Limpar</a>
  </form>

  <div class="apar-table">
    <table>
      <thead>
        <tr>
          <th>Vencimento</th><th>Cliente</th><th>Descrição</th>
          <th class="right">Valor</th><th class="right">Recebido</th><th class="right">Saldo</th>
          <th>Estado</th><th></th>
        </tr>
      </thead>
      <tbody>
        <?php if (!$data['rows']): ?>
          <tr><td colspan="8" class="empty">Sem registos.</td></tr>
        <?php else: foreach ($data['rows'] as $p):
          $isOverdue = in_array($p['status'], ['open','partial'], true) && (int)$p['days_to_due'] < 0;
          $isSoon    = in_array($p['status'], ['open','partial'], true) && (int)$p['days_to_due'] >= 0 && (int)$p['days_to_due'] <= 7;
        ?>
          <tr class="<?= $isOverdue?'row-overdue':($isSoon?'row-soon':'') ?>">
            <td>
              <?= e(date('d/m/Y', strtotime($p['due_date']))) ?>
              <?php if ($isOverdue): ?><span class="chip chip-danger">+<?= abs((int)$p['days_to_due']) ?>d</span>
              <?php elseif ($isSoon): ?><span class="chip chip-warning"><?= (int)$p['days_to_due'] ?>d</span><?php endif; ?>
            </td>
            <td><?= e($p['customer_name'] ?? '—') ?><?php if ($p['receipt_number']): ?><br><small><?= e($p['receipt_number']) ?></small><?php endif; ?></td>
            <td><?= e($p['description']) ?></td>
            <td class="right"><?= formatMZN($p['amount']) ?></td>
            <td class="right"><?= formatMZN($p['paid_amount']) ?></td>
            <td class="right"><strong><?= formatMZN($p['balance']) ?></strong></td>
            <td><span class="chip chip-<?= e($p['status']) ?>"><?= e($statusLabels[$p['status']]) ?></span></td>
            <td><a href="<?= url('receivables/view') ?>&id=<?= e($p['id']) ?>" class="btn btn-sm">Abrir</a></td>
          </tr>
        <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>

  <?php if ($data['pages'] > 1): ?>
    <div class="pager">
      <?php for ($i=1; $i<=$data['pages']; $i++):
        $qs = $_GET; $qs['page'] = $i; ?>
        <a class="<?= $i===$data['page']?'active':'' ?>" href="?<?= http_build_query($qs) ?>"><?= $i ?></a>
      <?php endfor; ?>
    </div>
  <?php endif; ?>
</section>
<link rel="stylesheet" href="<?= asset('css/ap_ar.css') ?>">
