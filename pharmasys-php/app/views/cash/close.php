<section class="crud">
  <h1 class="page-title">Fechar sessão de caixa</h1>
  <p class="page-subtitle">Conta o dinheiro em caixa (apenas numerário) e regista o valor.</p>

  <div class="cash-card">
    <div class="cash-grid">
      <div class="cash-tile"><small>Fundo inicial</small><strong><?= e(formatMZN($session['opening_amount'])) ?></strong></div>
      <div class="cash-tile"><small>Vendas em numerário</small><strong><?= e(formatMZN($session['cash'])) ?></strong></div>
      <div class="cash-tile"><small>Esperado em caixa</small><strong class="green"><?= e(formatMZN($session['expected'])) ?></strong></div>
    </div>
  </div>

  <form method="POST" action="<?= url('cash/close/submit') ?>" class="form-card">
    <?= csrfField() ?>
    <label>Valor contado em caixa (MT) *</label>
    <input type="number" step="0.01" min="0" name="counted_amount" required autofocus>

    <label>Notas</label>
    <textarea name="notes" rows="3" placeholder="Ex: Diferença justificada por troco…"></textarea>

    <div class="form-actions">
      <a href="<?= url('cash') ?>" class="btn btn-ghost">Cancelar</a>
      <button class="btn btn-primary" type="submit">Fechar caixa</button>
    </div>
  </form>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
<link rel="stylesheet" href="<?= asset('css/cash.css') ?>">
