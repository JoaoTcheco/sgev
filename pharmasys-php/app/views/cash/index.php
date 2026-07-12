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
      <div class="cash-grid">
        <div class="cash-tile mini"><small>➖ Sangrias</small><strong class="red"><?= e(formatMZN($current['sangrias'])) ?></strong></div>
        <div class="cash-tile mini"><small>➕ Reforços</small><strong class="green"><?= e(formatMZN($current['reforcos'])) ?></strong></div>
      </div>
    </div>

    <h3 class="form-section">Movimentos de caixa (turno)</h3>
    <div class="cash-ops-grid">
      <form method="POST" action="<?= url('cash/sangria') ?>" class="cash-op-form" onsubmit="return confirm('Registar sangria do caixa?');">
        <?= csrfField() ?>
        <strong>➖ Sangria (retirada)</strong>
        <label>Valor (MZN) <input type="number" name="amount" min="0.01" step="0.01" required></label>
        <label>Motivo <input name="reason" maxlength="200" placeholder="Ex: pagamento fornecedor, despesa"></label>
        <button class="btn">Registar sangria</button>
      </form>
      <form method="POST" action="<?= url('cash/reforco') ?>" class="cash-op-form" onsubmit="return confirm('Registar reforço no caixa?');">
        <?= csrfField() ?>
        <strong>➕ Reforço (aporte / troco)</strong>
        <label>Valor (MZN) <input type="number" name="amount" min="0.01" step="0.01" required></label>
        <label>Motivo <input name="reason" maxlength="200" placeholder="Ex: fundo de troco, aporte"></label>
        <button class="btn">Registar reforço</button>
      </form>
    </div>

    <?php if (!empty($movements)): ?>
      <div class="crud-table-card">
        <table class="data-table">
          <thead><tr><th>Data</th><th>Tipo</th><th>Motivo</th><th>Utilizador</th><th style="text-align:right;">Valor</th></tr></thead>
          <tbody>
          <?php foreach ($movements as $m): ?>
            <tr>
              <td><small><?= e(formatDateTime($m['created_at'])) ?></small></td>
              <td><?= $m['type']==='credit' ? '<span class="badge badge-green">Reforço</span>' : '<span class="badge badge-red">Sangria</span>' ?></td>
              <td><?= e($m['reason'] ?: '—') ?></td>
              <td><?= e($m['user_name'] ?: '—') ?></td>
              <td style="text-align:right;font-weight:600;"><?= $m['type']==='credit'?'+':'−' ?> <?= e(formatMZN($m['amount'])) ?></td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      </div>
    <?php endif; ?>
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
          <td><?= e(accountTypeLabel($a['type'])) ?></td>
          <td><strong><?= e(formatMZN($a['balance'])) ?></strong></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </div>

  <h3 class="form-section">Sessões anteriores</h3>
  <form method="GET" class="acc-filter" style="margin-bottom:12px;">
    <input type="hidden" name="r" value="cash">
    <label>De <input type="date" name="date_from" value="<?= e($filters['date_from'] ?? '') ?>"></label>
    <label>Até <input type="date" name="date_to" value="<?= e($filters['date_to'] ?? '') ?>"></label>
    <label>Estado
      <select name="status">
        <option value="">Todos</option>
        <option value="open"   <?= ($filters['status']??'')==='open'?'selected':'' ?>>Abertas</option>
        <option value="closed" <?= ($filters['status']??'')==='closed'?'selected':'' ?>>Fechadas</option>
      </select>
    </label>
    <button class="btn btn-primary">Filtrar</button>
    <a href="<?= url('cash') ?>" class="btn">Limpar</a>
  </form>
  <div class="crud-table-card">
    <table class="data-table">
      <thead><tr><th>Utilizador</th><th>Aberto</th><th>Fechado</th><th>Fundo</th><th>Contado</th><th>Diferença</th><th>Estado</th><th></th></tr></thead>
      <tbody>
      <?php if (!$history): ?>
        <tr><td colspan="8" class="empty">Sem sessões para o filtro.</td></tr>
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
          <td><a class="btn btn-sm" href="<?= url('cash/view') ?>&id=<?= e($s['id']) ?>">Ver</a></td>
        </tr>
      <?php endforeach; endif; ?>
      </tbody>
    </table>
  </div>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
<link rel="stylesheet" href="<?= asset('css/cash.css') ?>">
<link rel="stylesheet" href="<?= asset('css/accounts.css') ?>">
<style>
.cash-ops-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;}
.cash-op-form{background:#fff;border:1px solid #e5efe9;border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:8px;}
.cash-op-form strong{color:#0f766e;}
.cash-op-form label{display:flex;flex-direction:column;font-size:12px;color:#5a726c;gap:4px;}
.cash-op-form input{padding:8px 10px;border:1px solid #d7e3de;border-radius:8px;font-size:14px;}
.cash-op-form button{align-self:flex-start;}
.cash-tile .red{color:#dc2626;} .cash-tile .green{color:#16a34a;}
@media(max-width:720px){.cash-ops-grid{grid-template-columns:1fr;}}
</style>
