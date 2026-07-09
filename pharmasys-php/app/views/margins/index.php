<?php /** @var array $rows */ /** @var array $stats */ ?>
<link rel="stylesheet" href="<?= asset('css/margins.css') ?>">

<div class="page-header">
  <div><h1>Margens & Custos</h1><p class="muted">Análise de rentabilidade por lote em stock.</p></div>
</div>

<div class="mg-stats">
  <div class="mg-stat mg-good"><div class="label">Boa (≥ <?= (int)$good ?>%)</div><div class="value"><?= $stats['good'] ?></div></div>
  <div class="mg-stat mg-ok"><div class="label">OK (≥ <?= (int)$ok ?>%)</div><div class="value"><?= $stats['ok'] ?></div></div>
  <div class="mg-stat mg-low"><div class="label">Baixa (< <?= (int)$ok ?>%)</div><div class="value"><?= $stats['low'] ?></div></div>
  <div class="mg-stat mg-loss"><div class="label">Prejuízo</div><div class="value"><?= $stats['loss'] ?></div></div>
  <div class="mg-stat"><div class="label">Valor stock (custo)</div><div class="value"><?= formatMZN($stock_value_cost) ?></div></div>
  <div class="mg-stat"><div class="label">Valor stock (venda)</div><div class="value"><?= formatMZN($stock_value_sale) ?></div></div>
</div>

<form method="get" class="card mg-filters">
  <input type="hidden" name="r" value="margins">
  <input type="text" name="q" value="<?= e($q) ?>" placeholder="Produto ou lote…">
  <select name="bucket">
    <option value="">Todas as faixas</option>
    <option value="good" <?= $bucket==='good'?'selected':'' ?>>Boa</option>
    <option value="ok"   <?= $bucket==='ok'  ?'selected':'' ?>>OK</option>
    <option value="low"  <?= $bucket==='low' ?'selected':'' ?>>Baixa</option>
    <option value="loss" <?= $bucket==='loss'?'selected':'' ?>>Prejuízo</option>
  </select>
  <label>Boa ≥ <input type="number" name="good" value="<?= (int)$good ?>" min="0" style="width:70px"> %</label>
  <label>OK ≥ <input type="number" name="ok"   value="<?= (int)$ok   ?>" min="0" style="width:70px"> %</label>
  <button class="btn btn-primary">Filtrar</button>
  <a href="<?= url('margins') ?>" class="btn btn-ghost">Limpar</a>
  <a href="<?= url('margins/export') ?>&<?= http_build_query(['q'=>$q,'bucket'=>$bucket,'good'=>$good,'ok'=>$ok]) ?>" class="btn btn-ghost">⬇ CSV</a>
</form>

<div class="card">
  <table class="mg-table">
    <thead><tr>
      <th>Produto</th><th>Lote</th><th>Validade</th>
      <th class="right">Qtd</th><th class="right">Custo</th><th class="right">Venda</th>
      <th class="right">Margem</th><th class="right">%</th><th>Faixa</th>
    </tr></thead>
    <tbody>
    <?php if (!$rows): ?>
      <tr><td colspan="9" class="empty">Sem lotes correspondentes.</td></tr>
    <?php else: foreach ($rows as $r): ?>
      <tr>
        <td><?= e($r['name']) ?></td>
        <td><?= e($r['batch_number']) ?></td>
        <td class="nowrap"><?= formatDate($r['expiry_date']) ?></td>
        <td class="right"><?= (int)$r['quantity'] ?></td>
        <td class="right"><?= formatMZN($r['cost_price']) ?></td>
        <td class="right"><?= formatMZN($r['sale_price']) ?></td>
        <td class="right"><?= formatMZN($r['margin_abs']) ?></td>
        <td class="right"><strong><?= number_format((float)$r['margin_pct'],1,',','.') ?>%</strong></td>
        <td><span class="mg-badge mg-<?= e($r['bucket']) ?>">
          <?= ['good'=>'Boa','ok'=>'OK','low'=>'Baixa','loss'=>'Prejuízo'][$r['bucket']] ?>
        </span></td>
      </tr>
    <?php endforeach; endif; ?>
    </tbody>
  </table>
</div>
