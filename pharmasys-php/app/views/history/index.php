<?php
$today = date('Y-m-d');
$ranges = [
    'today' => ['label'=>'Hoje',    'from'=>$today, 'to'=>$today],
    '7d'    => ['label'=>'7 dias',  'from'=>date('Y-m-d', strtotime('-6 days')),  'to'=>$today],
    '30d'   => ['label'=>'30 dias', 'from'=>date('Y-m-d', strtotime('-29 days')), 'to'=>$today],
    'month' => ['label'=>'Mês',     'from'=>date('Y-m-01'), 'to'=>$today],
];
$activeRange = '';
foreach ($ranges as $k=>$rg) {
    if ($filters['from']===$rg['from'] && $filters['to']===$rg['to']) { $activeRange = $k; break; }
}
?>
<section class="crud">
  <div class="crud-header">
    <h1 class="page-title">Histórico de vendas</h1>
    <div class="hist-totals">
      <div><small>Vendas</small><strong><?= (int)$totals['count'] ?></strong></div>
      <div><small>Total bruto</small><strong><?= e(formatMZN($totals['gross'])) ?></strong></div>
      <div><small>Líquido (s/ estorno)</small><strong class="green"><?= e(formatMZN($totals['net'])) ?></strong></div>
      <div><small>Com estorno</small><strong class="orange"><?= (int)$totals['refunded_count'] ?></strong></div>
    </div>
  </div>

  <form method="GET" class="hist-filters">
    <input type="hidden" name="r" value="history">
    <div><label>De</label>   <input type="date" name="from" value="<?= e($filters['from']) ?>"></div>
    <div><label>Até</label>  <input type="date" name="to"   value="<?= e($filters['to'])   ?>"></div>
    <div><label>Recibo</label><input type="text" name="receipt" value="<?= e($filters['receipt']) ?>" placeholder="ex: 2026-000123"></div>
    <div><label>Cliente</label>
      <select name="customer_id">
        <option value="">— Todos —</option>
        <?php foreach ($customers as $c): ?>
          <option value="<?= e($c['id']) ?>" <?= $filters['customer_id']===$c['id']?'selected':'' ?>><?= e($c['full_name']) ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div><label>Pagamento</label>
      <select name="payment_method">
        <option value="">— Todos —</option>
        <?php foreach (['cash'=>'Numerário','mpesa'=>'M-Pesa','emola'=>'E-Mola','card'=>'Cartão','transfer'=>'Transferência'] as $k=>$l): ?>
          <option value="<?= $k ?>" <?= $filters['payment_method']===$k?'selected':'' ?>><?= $l ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div><label>Estado</label>
      <select name="status">
        <option value="">— Todos —</option>
        <option value="completed"      <?= $filters['status']==='completed'?'selected':''      ?>>Concluída</option>
        <option value="partial_refund" <?= $filters['status']==='partial_refund'?'selected':'' ?>>Estorno parcial</option>
        <option value="refunded"       <?= $filters['status']==='refunded'?'selected':''       ?>>Estornada</option>
      </select>
    </div>
    <div style="display:flex;gap:8px;">
      <button class="btn btn-primary">Filtrar</button>
      <a class="btn btn-ghost" href="<?= url('history/export') ?>&<?= http_build_query($filters) ?>">⬇ CSV</a>
    </div>
  </form>

  <div class="crud-table-card">
    <table class="data-table">
      <thead><tr><th>Recibo</th><th>Data</th><th>Cliente</th><th>Atendente</th><th>Itens</th><th>Total</th><th>Pagamento</th><th>Estado</th><th style="width:120px;">Acções</th></tr></thead>
      <tbody>
      <?php if (!$items): ?>
        <tr><td colspan="9" class="empty">Sem vendas para os filtros seleccionados.</td></tr>
      <?php else: foreach ($items as $s):
        $badge = ['completed'=>'badge-green','partial_refund'=>'badge-orange','refunded'=>'badge-red'][$s['status']] ?? 'badge-gray';
        $label = ['completed'=>'OK','partial_refund'=>'Parcial','refunded'=>'Estornada'][$s['status']] ?? $s['status'];
      ?>
        <tr>
          <td><strong><?= e($s['receipt_number']) ?></strong></td>
          <td><small><?= e(formatDateTime($s['created_at'])) ?></small></td>
          <td><?= e($s['customer_name'] ?: '—') ?></td>
          <td><?= e($s['user_name']) ?></td>
          <td><?= (int)$s['total_qty'] ?><?= $s['refunded_qty']>0 ? ' <small class="orange">(-'.(int)$s['refunded_qty'].')</small>' : '' ?></td>
          <td><strong><?= e(formatMZN($s['total'])) ?></strong></td>
          <td><small><?= e(strtoupper($s['payment_method'])) ?></small></td>
          <td><span class="badge <?= $badge ?>"><?= e($label) ?></span></td>
          <td>
            <a href="<?= url('history/view') ?>&id=<?= e($s['id']) ?>" class="btn btn-sm">Ver</a>
            <a href="<?= url('sales/receipt') ?>&id=<?= e($s['id']) ?>" target="_blank" class="btn btn-sm btn-ghost">🖨️</a>
          </td>
        </tr>
      <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
<link rel="stylesheet" href="<?= asset('css/history.css') ?>">
