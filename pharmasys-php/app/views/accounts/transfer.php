<section class="crud">
  <div class="crud-header">
    <div>
      <h1 class="page-title">Transferir entre contas</h1>
      <p class="page-subtitle">Mova saldo de uma conta para outra (ex: depósito de caixa no banco).</p>
    </div>
    <a href="<?= url('accounts') ?>" class="btn">← Voltar</a>
  </div>

  <form method="POST" action="<?= url('accounts/transfer/submit') ?>" class="crud-form">
    <?= csrfField() ?>
    <div class="grid-2">
      <label>De (origem) *
        <select name="from_id" required>
          <option value="">— seleccionar —</option>
          <?php foreach ($accounts as $a): ?>
            <option value="<?= e($a['id']) ?>"><?= e($a['name']) ?> — <?= formatMZN($a['balance']) ?></option>
          <?php endforeach; ?>
        </select>
      </label>
      <label>Para (destino) *
        <select name="to_id" required>
          <option value="">— seleccionar —</option>
          <?php foreach ($accounts as $a): ?>
            <option value="<?= e($a['id']) ?>"><?= e($a['name']) ?> — <?= formatMZN($a['balance']) ?></option>
          <?php endforeach; ?>
        </select>
      </label>
    </div>
    <div class="grid-2">
      <label>Valor (MZN) *
        <input type="number" name="amount" min="0.01" step="0.01" required>
      </label>
      <label>Motivo
        <input name="reason" maxlength="200" placeholder="Ex: Depósito bancário, fundo de troco...">
      </label>
    </div>
    <div class="form-actions">
      <button class="btn btn-primary">↔ Executar transferência</button>
      <a href="<?= url('accounts') ?>" class="btn">Cancelar</a>
    </div>
  </form>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
