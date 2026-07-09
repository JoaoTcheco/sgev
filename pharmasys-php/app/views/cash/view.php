<section class="crud">
  <div class="crud-header">
    <div>
      <h1 class="page-title">Sessão de caixa</h1>
      <p class="page-subtitle">Detalhe da sessão — <?= e($session['user_name'] ?? '') ?></p>
    </div>
    <a href="<?= url('cash') ?>" class="btn">← Caixa</a>
  </div>

  <div class="cash-card">
    <div class="cash-card-hdr">
      <div>
        <small>ABERTA · <?= e(formatDateTime($session['opened_at'])) ?></small>
        <?php if (!empty($session['closed_at'])): ?>
          <small>FECHADA · <?= e(formatDateTime($session['closed_at'])) ?></small>
        <?php endif; ?>
        <h2>Fundo inicial: <?= e(formatMZN($session['opening_amount'])) ?></h2>
      </div>
      <span class="badge <?= $session['status']==='open'?'badge-orange':'badge-gray' ?>"><?= e($session['status']) ?></span>
    </div>
    <div class="cash-grid">
      <div class="cash-tile"><small>Vendas</small><strong><?= (int)$session['sales_count'] ?></strong></div>
      <div class="cash-tile"><small>Total vendido</small><strong><?= e(formatMZN($session['sales_total'])) ?></strong></div>
      <div class="cash-tile"><small>Numerário esperado</small><strong class="green"><?= e(formatMZN($session['expected'])) ?></strong></div>
      <?php if ($session['counted_amount'] !== null): ?>
        <div class="cash-tile"><small>Contado</small><strong><?= e(formatMZN($session['counted_amount'])) ?></strong></div>
        <div class="cash-tile"><small>Diferença</small><strong class="<?= (float)$session['difference']==0?'green':((float)$session['difference']>0?'':'red') ?>"><?= e(formatMZN($session['difference'])) ?></strong></div>
      <?php endif; ?>
    </div>
    <div class="cash-grid">
      <div class="cash-tile mini"><small>💵 Numerário</small><strong><?= e(formatMZN($session['cash'])) ?></strong></div>
      <div class="cash-tile mini"><small>📱 M-Pesa</small><strong><?= e(formatMZN($session['mpesa'])) ?></strong></div>
      <div class="cash-tile mini"><small>📱 E-Mola</small><strong><?= e(formatMZN($session['emola'])) ?></strong></div>
      <div class="cash-tile mini"><small>💳 Cartão</small><strong><?= e(formatMZN($session['card'])) ?></strong></div>
      <div class="cash-tile mini"><small>🏦 Transf.</small><strong><?= e(formatMZN($session['transfer'])) ?></strong></div>
      <div class="cash-tile mini"><small>➖ Sangrias</small><strong class="red"><?= e(formatMZN($session['sangrias'])) ?></strong></div>
      <div class="cash-tile mini"><small>➕ Reforços</small><strong class="green"><?= e(formatMZN($session['reforcos'])) ?></strong></div>
    </div>
    <?php if (!empty($session['notes'])): ?>
      <p style="margin-top:12px;color:#5a726c;"><strong>Notas:</strong> <?= nl2br(e($session['notes'])) ?></p>
    <?php endif; ?>
  </div>

  <h3 class="form-section">Movimentos do turno</h3>
  <div class="crud-table-card">
    <table class="data-table">
      <thead><tr><th>Data</th><th>Tipo</th><th>Motivo</th><th>Utilizador</th><th style="text-align:right;">Valor</th></tr></thead>
      <tbody>
      <?php if (!$movements): ?>
        <tr><td colspan="5" class="empty">Sem sangrias/reforços neste turno.</td></tr>
      <?php else: foreach ($movements as $m): ?>
        <tr>
          <td><small><?= e(formatDateTime($m['created_at'])) ?></small></td>
          <td><?= $m['type']==='credit' ? '<span class="badge badge-green">Reforço</span>' : '<span class="badge badge-red">Sangria</span>' ?></td>
          <td><?= e($m['reason'] ?: '—') ?></td>
          <td><?= e($m['user_name'] ?: '—') ?></td>
          <td style="text-align:right;font-weight:600;"><?= $m['type']==='credit'?'+':'−' ?> <?= e(formatMZN($m['amount'])) ?></td>
        </tr>
      <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
<link rel="stylesheet" href="<?= asset('css/cash.css') ?>">
<style>.cash-tile .red{color:#dc2626;}.cash-tile .green{color:#16a34a;}</style>
