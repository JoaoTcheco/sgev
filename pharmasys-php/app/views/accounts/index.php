<?php
$isAdmin = hasRole('admin');
$typeLabels = [
    'cash' => 'Numerário', 'mpesa' => 'M-Pesa', 'emola' => 'E-Mola',
    'card' => 'Cartão', 'transfer' => 'Transferência', 'bank' => 'Banco', 'other' => 'Outro',
];
?>
<section class="accounts">
  <div class="crud-header">
    <div>
      <h1 class="page-title">Contas Financeiras</h1>
      <p class="page-subtitle"><?= (int)$totals['count'] ?> conta(s) activa(s) — saldo total <strong><?= formatMZN($totals['total']) ?></strong></p>
    </div>
    <div class="header-actions">
      <?php if ($isAdmin): ?>
        <a href="<?= url('accounts/transfer') ?>" class="btn">↔ Transferir</a>
        <a href="<?= url('accounts/new') ?>" class="btn btn-primary">+ Nova conta</a>
      <?php endif; ?>
    </div>
  </div>

  <div class="acc-summary">
    <div class="acc-tile">
      <span class="lbl">Saldo total</span>
      <span class="val"><?= formatMZN($totals['total']) ?></span>
    </div>
    <div class="acc-tile acc-tile-accent">
      <span class="lbl">Saldo em Caixa</span>
      <span class="val"><?= formatMZN($totals['cash']) ?></span>
    </div>
    <div class="acc-tile">
      <span class="lbl">Contas activas</span>
      <span class="val"><?= (int)$totals['count'] ?></span>
    </div>
  </div>

  <div class="acc-grid">
    <?php foreach ($accounts as $a): ?>
      <div class="acc-card <?= !$a['active'] ? 'is-inactive' : '' ?>">
        <div class="acc-card-head">
          <div>
            <h3><?= e($a['name']) ?></h3>
            <div class="acc-meta">
              <span class="chip"><?= e($typeLabels[$a['type']] ?? $a['type']) ?></span>
              <?php if ($a['is_system']): ?><span class="chip chip-muted">SISTEMA</span><?php endif; ?>
              <?php if (!$a['active']): ?><span class="chip chip-off">Inactiva</span><?php endif; ?>
            </div>
          </div>
          <div class="acc-balance <?= (float)$a['balance'] < 0 ? 'neg' : '' ?>">
            <?= formatMZN($a['balance']) ?>
          </div>
        </div>
        <?php if (!empty($a['notes'])): ?>
          <p class="acc-notes"><?= e($a['notes']) ?></p>
        <?php endif; ?>
        <div class="acc-actions">
          <a href="<?= url('accounts/movements') ?>&id=<?= e($a['id']) ?>" class="btn btn-sm">📊 Extracto</a>
          <?php if ($isAdmin): ?>
            <a href="<?= url('accounts/edit') ?>&id=<?= e($a['id']) ?>" class="btn btn-sm">Editar</a>
            <form method="POST" action="<?= url('accounts/delete') ?>" onsubmit="return confirm('Eliminar esta conta? Só é possível se o saldo for zero. Esta acção não pode ser desfeita.')" style="display:inline;">
              <?= csrfField() ?><input type="hidden" name="id" value="<?= e($a['id']) ?>">
              <button class="btn btn-sm btn-danger">×</button>
            </form>
          <?php endif; ?>
        </div>
      </div>
    <?php endforeach; ?>
  </div>
</section>
<link rel="stylesheet" href="<?= asset('css/accounts.css') ?>">
