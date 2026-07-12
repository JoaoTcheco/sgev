<?php
$tab = $tab ?? 'overview';
$tabs = [
    'overview' => 'Visão Geral',
    'sales'    => 'Vendas por Dia',
    'top'      => 'Top Produtos',
    'margins'  => 'Margens',
    'dre'      => 'DRE',
];
$qs = fn($t) => '?r=reports&tab=' . $t . '&from=' . e($from) . '&to=' . e($to);
$exp = fn($t) => '?r=reports/export&type=' . $t . '&from=' . e($from) . '&to=' . e($to);
?>
<link rel="stylesheet" href="<?= asset('css/reports.css') ?>">

<div class="page-head">
  <div>
    <h1>Relatórios</h1>
    <p class="muted">Análise de vendas, margens e desempenho — <?= formatDate($from) ?> a <?= formatDate($to) ?></p>
  </div>
</div>

<form method="GET" class="rep-filter">
  <input type="hidden" name="r" value="reports">
  <input type="hidden" name="tab" value="<?= e($tab) ?>">
  <label>De <input type="date" name="from" value="<?= e($from) ?>"></label>
  <label>Até <input type="date" name="to" value="<?= e($to) ?>"></label>
  <button class="btn btn-primary">Aplicar</button>
  <div class="rep-quick">
    <a class="btn btn-ghost btn-sm" href="?r=reports&tab=<?= e($tab) ?>&from=<?= date('Y-m-d') ?>&to=<?= date('Y-m-d') ?>">Hoje</a>
    <a class="btn btn-ghost btn-sm" href="?r=reports&tab=<?= e($tab) ?>&from=<?= date('Y-m-d', strtotime('-6 days')) ?>&to=<?= date('Y-m-d') ?>">7 dias</a>
    <a class="btn btn-ghost btn-sm" href="?r=reports&tab=<?= e($tab) ?>&from=<?= date('Y-m-01') ?>&to=<?= date('Y-m-d') ?>">Este mês</a>
    <a class="btn btn-ghost btn-sm" href="?r=reports&tab=<?= e($tab) ?>&from=<?= date('Y-01-01') ?>&to=<?= date('Y-m-d') ?>">Este ano</a>
  </div>
</form>

<nav class="rep-tabs">
  <?php foreach ($tabs as $k => $label): ?>
    <a href="<?= $qs($k) ?>" class="rep-tab <?= $tab === $k ? 'active' : '' ?>"><?= e($label) ?></a>
  <?php endforeach; ?>
</nav>

<section class="rep-kpis">
  <div class="kpi"><div class="kpi-label">Nº Vendas</div><div class="kpi-value"><?= (int)$kpis['n_sales'] ?></div></div>
  <div class="kpi"><div class="kpi-label">Receita Líquida</div><div class="kpi-value"><?= formatMZN($kpis['revenue']) ?></div></div>
  <div class="kpi"><div class="kpi-label">Custo (CMV)</div><div class="kpi-value"><?= formatMZN($kpis['cogs']) ?></div></div>
  <div class="kpi kpi-accent"><div class="kpi-label">Lucro Bruto</div><div class="kpi-value"><?= formatMZN($kpis['profit']) ?></div><div class="kpi-sub"><?= number_format($kpis['margin_pct'], 1, ',', '.') ?>% margem</div></div>
  <div class="kpi"><div class="kpi-label">Ticket Médio</div><div class="kpi-value"><?= formatMZN($kpis['ticket_avg']) ?></div></div>
  <div class="kpi"><div class="kpi-label">Unidades Vendidas</div><div class="kpi-value"><?= (int)$kpis['units_sold'] ?></div></div>
  <div class="kpi kpi-warn"><div class="kpi-label">Devoluções</div><div class="kpi-value"><?= formatMZN($kpis['refunded_value']) ?></div><div class="kpi-sub"><?= (int)$kpis['refunded_units'] ?> unidades</div></div>
  <div class="kpi"><div class="kpi-label">Descontos</div><div class="kpi-value"><?= formatMZN($kpis['discount']) ?></div></div>
</section>

<?php if ($tab === 'overview' || $tab === 'sales'): ?>
  <div class="card">
    <div class="card-head">
      <h2>Vendas por Dia</h2>
      <a class="btn btn-ghost btn-sm" href="<?= $exp('sales') ?>">Exportar CSV</a>
    </div>
    <?php
      $maxRev = 0;
      foreach (($byDay ?? []) as $d) $maxRev = max($maxRev, (float)$d['revenue']);
    ?>
    <?php if (empty($byDay)): ?>
      <p class="muted">Sem vendas no período.</p>
    <?php else: ?>
      <div class="rep-chart">
        <?php foreach ($byDay as $d):
          $h = $maxRev > 0 ? max(4, ((float)$d['revenue'] / $maxRev) * 180) : 4; ?>
          <div class="bar" title="<?= formatDate($d['d']) ?> — <?= formatMZN($d['revenue']) ?>">
            <div class="bar-fill" style="height: <?= $h ?>px"></div>
            <div class="bar-label"><?= date('d/m', strtotime($d['d'])) ?></div>
          </div>
        <?php endforeach; ?>
      </div>
      <table class="table">
        <thead><tr><th>Data</th><th class="num">Nº Vendas</th><th class="num">Receita</th><th class="num">Custo</th><th class="num">Lucro</th></tr></thead>
        <tbody>
          <?php foreach ($byDay as $d): $p = (float)$d['revenue'] - (float)$d['cogs']; ?>
            <tr>
              <td><?= formatDate($d['d']) ?></td>
              <td class="num"><?= (int)$d['n_sales'] ?></td>
              <td class="num"><?= formatMZN($d['revenue']) ?></td>
              <td class="num"><?= formatMZN($d['cogs']) ?></td>
              <td class="num <?= $p >= 0 ? 'ok' : 'bad' ?>"><?= formatMZN($p) ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>
  </div>

  <div class="rep-grid-2">
    <div class="card">
      <div class="card-head">
        <h2>Por Método de Pagamento</h2>
        <a class="btn btn-ghost btn-sm" href="<?= $exp('payments') ?>">CSV</a>
      </div>
      <?php if (empty($byPayment)): ?><p class="muted">Sem dados.</p><?php else: ?>
        <table class="table">
          <thead><tr><th>Método</th><th class="num">Nº</th><th class="num">Total</th></tr></thead>
          <tbody>
            <?php foreach ($byPayment as $p): ?>
              <tr>
                <td><?= e(paymentMethodLabel($p['payment_method'])) ?></td>
                <td class="num"><?= (int)$p['n'] ?></td>
                <td class="num"><?= formatMZN($p['total']) ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </div>

    <div class="card">
      <div class="card-head">
        <h2>Por Operador</h2>
        <a class="btn btn-ghost btn-sm" href="<?= $exp('users') ?>">CSV</a>
      </div>
      <?php if (empty($byUser)): ?><p class="muted">Sem dados.</p><?php else: ?>
        <table class="table">
          <thead><tr><th>Utilizador</th><th class="num">Nº Vendas</th><th class="num">Total</th></tr></thead>
          <tbody>
            <?php foreach ($byUser as $u): ?>
              <tr>
                <td><?= e($u['full_name']) ?> <span class="muted">@<?= e($u['username']) ?></span></td>
                <td class="num"><?= (int)$u['n_sales'] ?></td>
                <td class="num"><?= formatMZN($u['total']) ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      <?php endif; ?>
    </div>
  </div>
<?php endif; ?>

<?php if ($tab === 'top'): ?>
  <div class="card">
    <div class="card-head">
      <h2>Top Produtos</h2>
      <a class="btn btn-ghost btn-sm" href="<?= $exp('top') ?>">Exportar CSV</a>
    </div>
    <?php if (empty($top)): ?><p class="muted">Sem vendas no período.</p><?php else: ?>
      <table class="table">
        <thead>
          <tr>
            <th>#</th><th>Produto</th><th>Código</th>
            <th class="num">Unidades</th><th class="num">Receita</th>
            <th class="num">Custo</th><th class="num">Lucro</th><th class="num">Margem</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($top as $i => $p):
            $rev = (float)$p['revenue']; $prof = (float)$p['profit'];
            $m = $rev > 0 ? ($prof / $rev) * 100 : 0; ?>
            <tr>
              <td><?= $i + 1 ?></td>
              <td><?= e($p['name']) ?></td>
              <td class="muted"><?= e($p['barcode'] ?? '—') ?></td>
              <td class="num"><?= (int)$p['units'] ?></td>
              <td class="num"><?= formatMZN($rev) ?></td>
              <td class="num"><?= formatMZN($p['cogs']) ?></td>
              <td class="num <?= $prof >= 0 ? 'ok' : 'bad' ?>"><?= formatMZN($prof) ?></td>
              <td class="num"><?= number_format($m, 1, ',', '.') ?>%</td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>
  </div>
<?php endif; ?>

<?php if ($tab === 'margins'): ?>
  <div class="card">
    <div class="card-head">
      <h2>Margens por Categoria</h2>
      <a class="btn btn-ghost btn-sm" href="<?= $exp('margins') ?>">Exportar CSV</a>
    </div>
    <?php if (empty($categories)): ?><p class="muted">Sem dados.</p><?php else: ?>
      <table class="table">
        <thead>
          <tr>
            <th>Categoria</th><th class="num">Unidades</th>
            <th class="num">Receita</th><th class="num">Custo</th>
            <th class="num">Lucro</th><th class="num">Margem</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($categories as $c):
            $rev = (float)$c['revenue']; $cost = (float)$c['cogs']; $prof = $rev - $cost;
            $m = $rev > 0 ? ($prof / $rev) * 100 : 0; ?>
            <tr>
              <td><?= e($c['category']) ?></td>
              <td class="num"><?= (int)$c['units'] ?></td>
              <td class="num"><?= formatMZN($rev) ?></td>
              <td class="num"><?= formatMZN($cost) ?></td>
              <td class="num <?= $prof >= 0 ? 'ok' : 'bad' ?>"><?= formatMZN($prof) ?></td>
              <td class="num"><?= number_format($m, 1, ',', '.') ?>%</td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    <?php endif; ?>
  </div>
<?php endif; ?>

<?php if ($tab === 'dre'): ?>
  <div class="card">
    <div class="card-head"><h2>DRE Simplificada</h2></div>
    <table class="table dre">
      <tbody>
        <tr><td>Receita Bruta</td><td class="num"><?= formatMZN($kpis['gross'] + $kpis['discount']) ?></td></tr>
        <tr class="dre-neg"><td>(−) Descontos concedidos</td><td class="num">−<?= formatMZN($kpis['discount']) ?></td></tr>
        <tr class="dre-neg"><td>(−) Devoluções</td><td class="num">−<?= formatMZN($kpis['refunded_value']) ?></td></tr>
        <tr class="dre-total"><td><strong>Receita Líquida</strong></td><td class="num"><strong><?= formatMZN($kpis['revenue']) ?></strong></td></tr>
        <tr class="dre-neg"><td>(−) Custo dos Produtos Vendidos (CMV)</td><td class="num">−<?= formatMZN($kpis['cogs']) ?></td></tr>
        <tr class="dre-total <?= $kpis['profit'] >= 0 ? 'ok' : 'bad' ?>">
          <td><strong>Lucro Bruto</strong></td>
          <td class="num"><strong><?= formatMZN($kpis['profit']) ?></strong> <span class="muted">(<?= number_format($kpis['margin_pct'], 2, ',', '.') ?>%)</span></td>
        </tr>
      </tbody>
    </table>
    <p class="muted small">DRE simplificada — não inclui despesas operacionais (salários, renda, utilidades, impostos), que devem ser lançadas separadamente.</p>
  </div>
<?php endif; ?>
