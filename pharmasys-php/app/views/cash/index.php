<section class="crud">
  <div class="crud-header">
    <div>
      <h1 class="page-title">Caixa</h1>
      <p class="page-subtitle">Abre uma sessão para começar a vender, e fecha ao final do turno para conferência.</p>
    </div>
    <?php if ($current): ?>
      <a href="<?= url('cash/close') ?>" class="btn btn-primary">Fechar caixa</a>
    <?php else: ?>
      <a href="<?= url('cash/open') ?>" class="btn btn-primary">Abrir caixa</a>
    <?php endif; ?>
  </div>

  <?php if ($current): ?>
    <div class="cash-card">
      <div class="cash-card-hdr">
        <div>
          <small>SESSÃO ABERTA · <?= e(formatDateTime($current['opened_at'])) ?></small>
          <h2>Fundo inicial: <?= e(formatMZN($current['opening_amount'])) ?></h2>
        </div>
        <a href="<?= url('pdv') ?>" class="btn btn-ghost">→ Ir para o PDV</a>
      </div>
      <div class="cash-grid">
        <div class="cash-tile"><small>Vendas</small><strong><?= (int)$current['sales_count'] ?></strong></div>
        <div class="cash-tile"><small>Total vendido</small><strong><?= e(formatMZN($current['sales_total'])) ?></strong></div>
        <div class="cash-tile"><small>Numerário esperado</small><strong class="green"><?= e(formatMZN($current['expected'])) ?></strong></div>
      </div>
      <div class="cash-grid">
        <div class="cash-tile mini"><small>💵 Numerário</small><strong><?= e(formatMZN($current['cash'])) ?></strong></div>
        <div class="cash-tile mini"><small>📱 M-Pesa</small><strong><?= e(formatMZN($current['mpesa'])) ?></strong></div>
        <div class="cash-tile mini"><small>📱 E-Mola</small><strong><?= e(formatMZN($current['emola'])) ?></strong></div>
        <div class="cash-tile mini"><small>💳 Cartão</small><strong><?= e(formatMZN($current['card'])) ?></strong></div>
        <div class="cash-tile mini"><small>🏦 Transf.</small><strong><?= e(formatMZN($current['transfer'])) ?></strong></div>
      </div>
    </div>
  <?php else: ?>
    <div class="cash-empty">
      <p>Não há sessão de caixa aberta. <a href="<?= url('cash/open') ?>">Abrir agora →</a></p>
    </div>
  <?php endif; ?>

  <h3 class="form-section">Contas financeiras</h3>
  <div class="crud-table-card">
    <table class="data-table">
      <thead><tr><th>Conta</th><th>Tipo</th><th>Saldo</th></tr></thead>
      <tbody>
      <?php foreach ($accounts as $a): ?>
        <tr>
          <td><strong><?= e($a['name']) ?></strong></td>
          <td><?= e(strtoupper($a['type'])) ?></td>
          <td><strong><?= e(formatMZN($a['balance'])) ?></strong></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>

  <h3 class="form-section">Sessões anteriores</h3>
  <div class="crud-table-card">
    <table class="data-table">
      <thead><tr><th>Utilizador</th><th>Aberto</th><th>Fechado</th><th>Fundo</th><th>Contado</th><th>Diferença</th><th>Estado</th></tr></thead>
      <tbody>
      <?php if (!$history): ?>
        <tr><td colspan="7" class="empty">Sem sessões anteriores.</td></tr>
      <?php else: foreach ($history as $s): ?>
        <tr>
          <td><?= e($s['user_name']) ?></td>
          <td><small><?= e(formatDateTime($s['opened_at'])) ?></small></td>
          <td><small><?= $s['closed_at'] ? e(formatDateTime($s['closed_at'])) : '—' ?></small></td>
          <td><?= e(formatMZN($s['opening_amount'])) ?></td>
          <td><?= $s['counted_amount'] !== null ? e(formatMZN($s['counted_amount'])) : '—' ?></td>
          <td>
            <?php if ($s['difference'] === null): ?>—
            <?php elseif ((float)$s['difference'] == 0): ?><span class="badge badge-green">OK</span>
            <?php elseif ((float)$s['difference'] > 0): ?><span class="badge badge-blue">+<?= e(formatMZN($s['difference'])) ?></span>
            <?php else: ?><span class="badge badge-red"><?= e(formatMZN($s['difference'])) ?></span><?php endif; ?>
          </td>
          <td><span class="badge <?= $s['status']==='open'?'badge-orange':'badge-gray' ?>"><?= e($s['status']) ?></span></td>
        </tr>
      <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
<link rel="stylesheet" href="<?= asset('css/cash.css') ?>">
