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
            <button type="button" class="btn btn-sm btn-primary" onclick="pharmaToggleAdjust('<?= e($a['id']) ?>')">💰 Ajustar</button>
            <form method="POST" action="<?= url('accounts/delete') ?>" onsubmit="return confirm('Eliminar esta conta? Só é possível se o saldo for zero. Esta acção não pode ser desfeita.')" style="display:inline;">
              <?= csrfField() ?><input type="hidden" name="id" value="<?= e($a['id']) ?>">
              <button class="btn btn-sm btn-danger" title="Eliminar conta">×</button>
            </form>
          <?php endif; ?>
        </div>
        <?php if ($isAdmin): ?>
          <div class="acc-quick" id="adj-<?= e($a['id']) ?>" style="display:none;margin-top:10px;padding:10px;border-top:1px dashed #cbd5e1;background:#f8fafc;border-radius:8px;">
            <form method="POST" action="<?= url('accounts/adjust') ?>" onsubmit="return confirm('Confirmar este ajuste ao saldo?')" style="display:flex;gap:6px;flex-wrap:wrap;align-items:end;">
              <?= csrfField() ?>
              <input type="hidden" name="account_id" value="<?= e($a['id']) ?>">
              <input type="hidden" name="back" value="list">
              <label style="flex:0 0 auto;font-size:11px;">Acção<br>
                <select name="adj_type" required style="padding:6px;">
                  <option value="credit">+ Adicionar</option>
                  <option value="debit">− Remover</option>
                  <option value="reset">⟲ Zerar</option>
                </select>
              </label>
              <label style="flex:1 1 100px;font-size:11px;">Valor (MT)<br>
                <input type="number" name="amount" min="0" step="0.01" placeholder="0,00" style="width:100%;padding:6px;">
              </label>
              <label style="flex:2 1 160px;font-size:11px;">Motivo<br>
                <input name="reason" placeholder="Ex: entrega de troco" maxlength="200" style="width:100%;padding:6px;">
              </label>
              <button class="btn btn-sm btn-primary">Aplicar</button>
            </form>
            <p style="margin:6px 0 0;font-size:11px;color:#64748b;">Cada ajuste fica registado no extracto da conta (auditoria).</p>
          </div>
        <?php endif; ?>

</section>
<link rel="stylesheet" href="<?= asset('css/accounts.css') ?>">
