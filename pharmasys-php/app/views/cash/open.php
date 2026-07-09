<section class="crud">
  <h1 class="page-title">Abrir sessão de caixa</h1>
  <p class="page-subtitle">Indica o valor em numerário disponível no início do turno.</p>

  <form method="POST" action="<?= url('cash/open/submit') ?>" class="form-card">
    <?= csrfField() ?>
    <label>Fundo inicial (MT) *</label>
    <input type="number" step="0.01" min="0" name="opening_amount" required autofocus>

    <label>Notas</label>
    <textarea name="notes" rows="2" placeholder="Ex: Turno da manhã, fundo entregue por João…"></textarea>

    <div class="form-actions">
      <a href="<?= url('cash') ?>" class="btn btn-ghost">Cancelar</a>
      <button class="btn btn-primary" type="submit">Abrir caixa</button>
    </div>
  </form>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
