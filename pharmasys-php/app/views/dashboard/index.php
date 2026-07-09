<?php
/**
 * Dashboard — layout alinhado ao frontend Lovable.
 * PHP puro + HTML/CSS/SVG (sem frameworks nem libs de gráficos).
 */
$u             = $user ?? currentUser();
$firstName     = trim(explode(' ', $u['full_name'] ?? 'Utilizador')[0]);
$isAdmin       = hasRole('admin','pharmacist');
$series        = $salesSeries ?? [];
$payments      = $paymentSeries ?? [];
$topProducts   = $topProducts ?? [];
$recentSales   = $recentSales ?? [];
$s             = $stats ?? [];

/* Labels de método de pagamento */
$payLabels = [
    'cash' => 'Numerário', 'card' => 'Cartão', 'mpesa' => 'M-Pesa',
    'emola' => 'e-Mola', 'transfer' => 'Transferência',
    'credit' => 'Crédito', 'mixed' => 'Misto', 'electronic' => 'Digital',
];
$payColors = ['#0f766e','#16a34a','#d97706','#dc2626','#2563eb','#7c3aed','#0891b2'];

/* ============================================================
   Gerador do gráfico de área (SVG) — 7 dias
   ============================================================ */
function ds_area_chart(array $series, int $w = 720, int $h = 220, int $pad = 28): string {
    $n = count($series);
    if ($n < 2) return '<div class="ds-empty">Sem dados no período.</div>';
    $max = 0; foreach ($series as $r) { if ($r['total'] > $max) $max = $r['total']; }
    if ($max <= 0) $max = 1;
    $innerW = $w - $pad * 2;
    $innerH = $h - $pad * 2;
    $step   = $innerW / ($n - 1);
    $pts = [];
    foreach ($series as $i => $r) {
        $x = $pad + $i * $step;
        $y = $pad + $innerH - ($r['total'] / $max) * $innerH;
        $pts[] = [$x, $y];
    }
    $line = implode(' ', array_map(fn($p) => number_format($p[0],2,'.','').','.number_format($p[1],2,'.',''), $pts));
    $area = "M{$pts[0][0]},".($pad+$innerH)." L".$line." L".$pts[count($pts)-1][0].",".($pad+$innerH)." Z";

    /* Grid horizontal (4 linhas) */
    $grid = '';
    for ($g = 0; $g <= 4; $g++) {
        $gy = $pad + ($innerH * $g / 4);
        $grid .= "<line x1=\"$pad\" y1=\"$gy\" x2=\"".($pad+$innerW)."\" y2=\"$gy\" stroke=\"#e8efec\" stroke-dasharray=\"3 3\"/>";
    }
    /* Labels do eixo X — só mostra ~7 marcas quando são muitos pontos */
    $xl = '';
    $labelEvery = max(1, (int)ceil($n / 7));
    foreach ($series as $i => $r) {
        if ($i % $labelEvery !== 0 && $i !== $n-1) continue;
        $x = $pad + $i * $step;
        $xl .= "<text x=\"$x\" y=\"".($pad+$innerH+18)."\" text-anchor=\"middle\" font-size=\"11\" fill=\"#5a726c\">".htmlspecialchars($r['label'])."</text>";
    }
    /* Marcadores + pontos — quando > 14 pontos, esconde os círculos e mantém só a linha */
    $dots = '';
    if ($n <= 14) {
        foreach ($pts as $i => $p) {
            $val = number_format($series[$i]['total'], 2, ',', '.').' MT';
            $dots .= "<g><circle cx=\"{$p[0]}\" cy=\"{$p[1]}\" r=\"4\" fill=\"#0f766e\" stroke=\"#fff\" stroke-width=\"2\">
                      <title>{$series[$i]['ymd']} — $val</title></circle></g>";
        }
    }

    return <<<SVG
<svg viewBox="0 0 $w $h" preserveAspectRatio="none" width="100%" height="$h" class="ds-svg" role="img" aria-label="Vendas nos últimos 7 dias">
  <defs>
    <linearGradient id="dsFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"  stop-color="#0f766e" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#0f766e" stop-opacity="0"/>
    </linearGradient>
  </defs>
  $grid
  <path d="$area" fill="url(#dsFill)"/>
  <polyline points="$line" fill="none" stroke="#0f766e" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
  $dots
  $xl
</svg>
SVG;
}

/* ============================================================
   Gerador de donut (SVG) — métodos de pagamento
   ============================================================ */
function ds_donut(array $series, array $labels, array $colors, int $size = 200): string {
    $total = 0; foreach ($series as $r) { $total += (float)$r['t']; }
    if ($total <= 0) return '<div class="ds-empty">Sem dados no período.</div>';
    $cx = $cy = $size / 2;
    $r  = $size * 0.42;
    $stroke = $size * 0.18;
    $circ = 2 * M_PI * $r;
    $offset = 0;
    $arcs = '';
    foreach ($series as $i => $row) {
        $pct = (float)$row['t'] / $total;
        $len = $circ * $pct;
        $color = $colors[$i % count($colors)];
        $arcs .= "<circle cx=\"$cx\" cy=\"$cy\" r=\"$r\" fill=\"none\" stroke=\"$color\" stroke-width=\"$stroke\"
                 stroke-dasharray=\"$len ".($circ - $len)."\" stroke-dashoffset=\"-$offset\" transform=\"rotate(-90 $cx $cy)\"/>";
        $offset += $len;
    }
    $centerVal = number_format($total, 2, ',', '.').' MT';
    return <<<SVG
<svg viewBox="0 0 $size $size" width="$size" height="$size" class="ds-donut" role="img">
  <circle cx="$cx" cy="$cy" r="$r" fill="none" stroke="#eef4f2" stroke-width="$stroke"/>
  $arcs
  <text x="$cx" y="$cy" text-anchor="middle" font-size="11" fill="#5a726c" dy="-4">Total 7d</text>
  <text x="$cx" y="$cy" text-anchor="middle" font-size="14" font-weight="700" fill="#10231f" dy="14">$centerVal</text>
</svg>
SVG;
}
?>
<section class="ds">

  <!-- ===== Cabeçalho ===== -->
  <div class="ds-head">
    <div>
      <h1 class="ds-title">Olá, <?= e($firstName) ?> 👋</h1>
      <p class="ds-subtitle">
        <?= $isAdmin ? 'Visão geral da operação da farmácia.' : 'Resumo da operação de hoje.' ?>
      </p>
    </div>
    <div class="ds-actions">
      <a href="<?= url('reports') ?>" class="ds-btn ds-btn-outline">Estatísticas ↗</a>
      <a href="<?= url('pdv') ?>" class="ds-btn ds-btn-primary">Nova venda</a>
    </div>
  </div>

  <!-- ===== KPIs primários ===== -->
  <div class="ds-kpi-grid">
    <?php
      $svgCart  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>';
      $svgTrend = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>';
      $svgAct   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>';
      $svgAlert = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>';
    ?>
    <div class="ds-kpi tone-primary" data-live-kpi="today">
      <div class="ds-kpi-body">
        <p class="ds-kpi-title">Faturado hoje</p>
        <p class="ds-kpi-value" data-k="today"><?= e(formatMZN($s['today'])) ?></p>
        <p class="ds-kpi-sub"><span data-k="today_count"><?= (int)$s['today_count'] ?></span> vendas · ticket <span data-k="ticket_today"><?= e(formatMZN($s['ticket_today'])) ?></span></p>
      </div>
      <div class="ds-kpi-icon"><?= $svgCart ?></div>
    </div>
    <div class="ds-kpi tone-success">
      <div class="ds-kpi-body">
        <p class="ds-kpi-title">Últimos 7 dias</p>
        <p class="ds-kpi-value" data-k="total7"><?= e(formatMZN($s['total7'])) ?></p>
        <p class="ds-kpi-sub">Média/dia <span data-k="avg7"><?= e(formatMZN($s['avg7'])) ?></span></p>
      </div>
      <div class="ds-kpi-icon"><?= $svgTrend ?></div>
    </div>
    <div class="ds-kpi tone-muted">
      <div class="ds-kpi-body">
        <p class="ds-kpi-title">Últimos 30 dias</p>
        <p class="ds-kpi-value" data-k="total30"><?= e(formatMZN($s['total30'])) ?></p>
        <p class="ds-kpi-sub"><span data-k="count30"><?= (int)$s['count30'] ?></span> vendas concluídas</p>
      </div>
      <div class="ds-kpi-icon"><?= $svgAct ?></div>
    </div>
    <div class="ds-kpi tone-warning">
      <div class="ds-kpi-body">
        <p class="ds-kpi-title">Alertas activos</p>
        <p class="ds-kpi-value" data-k="alerts_active"><?= (int)$s['alerts_active'] ?></p>
        <p class="ds-kpi-sub"><span data-k="alerts_crit"><?= (int)$s['alerts_crit'] ?></span> críticos · <span data-k="alerts_low"><?= (int)$s['alerts_low'] ?></span> de stock</p>
      </div>
      <div class="ds-kpi-icon"><?= $svgAlert ?></div>
    </div>
  </div>


  <!-- ===== Mini-KPIs ===== -->
  <div class="ds-mini-grid">
    <?php
      $svgBox   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8 12 3 3 8l9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>';
      $svgUsers = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>';
      $svgCal   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>';
      $svgWall  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/></svg>';
    ?>
    <div class="ds-mini"><div class="ds-mini-ic"><?= $svgBox ?></div>  <div><p>Produtos activos</p><strong><?= (int)$s['products']  ?></strong></div></div>
    <div class="ds-mini"><div class="ds-mini-ic"><?= $svgUsers ?></div><div><p>Clientes registados</p><strong><?= (int)$s['customers'] ?></strong></div></div>
    <div class="ds-mini"><div class="ds-mini-ic"><?= $svgCal ?></div>  <div><p>Lotes a expirar (60d)</p><strong><?= (int)$s['expiring']  ?></strong></div></div>
    <div class="ds-mini"><div class="ds-mini-ic"><?= $svgWall ?></div> <div><p>Ticket médio (hoje)</p><strong><?= e(formatMZN($s['ticket_today'])) ?></strong></div></div>
  </div>

  <!-- ===== Gráficos ===== -->
  <div class="ds-charts">
    <div class="ds-card ds-card-lg">
      <div class="ds-card-head">
        <div>
          <h2>Vendas — últimos 7 dias</h2>
          <p>Faturação diária em MZN</p>
        </div>
      </div>
      <div class="ds-card-body ds-chart-wrap">
        <?= ds_area_chart($series) ?>
      </div>
    </div>

    <div class="ds-card">
      <div class="ds-card-head">
        <div>
          <h2>Métodos de pagamento</h2>
          <p>Distribuição (7 dias)</p>
        </div>
      </div>
      <div class="ds-card-body ds-donut-wrap">
        <?= ds_donut($payments, $payLabels, $payColors) ?>
        <ul class="ds-legend">
          <?php $total = array_sum(array_map(fn($r)=>(float)$r['t'], $payments)); ?>
          <?php foreach ($payments as $i => $p): $col = $payColors[$i % count($payColors)]; ?>
            <li>
              <span class="dot" style="background: <?= $col ?>"></span>
              <span class="lbl"><?= e($payLabels[$p['method']] ?? $p['method']) ?></span>
              <span class="val"><?= e(formatMZN($p['t'])) ?></span>
            </li>
          <?php endforeach; ?>
          <?php if (empty($payments)): ?>
            <li class="ds-empty-line">Sem vendas no período.</li>
          <?php endif; ?>
        </ul>
      </div>
    </div>
  </div>

  <!-- ===== Top produtos + vendas recentes ===== -->
  <div class="ds-lists">
    <div class="ds-card">
      <div class="ds-card-head">
        <div><h2>Top produtos (30 dias)</h2><p>Por faturação</p></div>
      </div>
      <div class="ds-card-body">
        <?php if (empty($topProducts)): ?>
          <p class="ds-empty">Sem vendas no período.</p>
        <?php else:
          $max = max(array_map(fn($p) => (float)$p['total'], $topProducts));
          if ($max <= 0) $max = 1;
        ?>
          <ul class="ds-bars">
            <?php foreach ($topProducts as $p):
              $pct = min(100, ((float)$p['total'] / $max) * 100);
            ?>
              <li>
                <div class="ds-bar-row">
                  <span class="ds-bar-name"><?= e($p['name']) ?></span>
                  <span class="ds-bar-val"><?= e(formatMZN($p['total'])) ?></span>
                </div>
                <div class="ds-bar-track"><div class="ds-bar-fill" style="width: <?= number_format($pct,2,'.','') ?>%"></div></div>
                <div class="ds-bar-meta"><?= (int)$p['qty'] ?> unidades</div>
              </li>
            <?php endforeach; ?>
          </ul>
        <?php endif; ?>
      </div>
    </div>

    <div class="ds-card">
      <div class="ds-card-head">
        <div><h2>Vendas recentes</h2><p>Últimas transacções concluídas</p></div>
        <a href="<?= url('history') ?>" class="ds-link">Ver tudo →</a>
      </div>
      <div class="ds-card-body">
        <?php if (empty($recentSales)): ?>
          <p class="ds-empty">Sem vendas recentes.</p>
        <?php else: ?>
          <ul class="ds-recent">
            <?php foreach ($recentSales as $r): ?>
              <li>
                <div class="ds-recent-main">
                  <p class="ds-recent-title">Recibo <?= e($r['receipt_number']) ?></p>
                  <p class="ds-recent-time"><?= e(formatDateTime($r['created_at'])) ?></p>
                </div>
                <div class="ds-recent-right">
                  <p class="ds-recent-total"><?= e(formatMZN($r['total'])) ?></p>
                  <span class="ds-pill"><?= e($payLabels[$r['payment_method']] ?? $r['payment_method']) ?></span>
                </div>
              </li>
            <?php endforeach; ?>
          </ul>
        <?php endif; ?>
      </div>
    </div>
  </div>

</section>
<link rel="stylesheet" href="<?= asset('css/dashboard-page.css') ?>">
<script>
(function(){
  const url = <?= json_encode(url('dashboard/kpis')) ?>;
  async function tick(){
    try {
      const r = await fetch(url, { headers: { 'X-Requested-With':'XMLHttpRequest' }, credentials:'same-origin' });
      if (!r.ok) return;
      const d = await r.json();
      document.querySelectorAll('[data-k]').forEach(el => {
        const k = el.dataset.k;
        if (d[k] !== undefined && d[k] !== null) el.textContent = d[k];
      });
    } catch(e){}
  }
  setInterval(tick, 30000);
})();
</script>

