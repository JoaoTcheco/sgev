<?php $item = $item ?? null; ?>
<section class="apar-form">
  <div class="crud-header">
    <h1 class="page-title"><?= e($title) ?></h1>
    <a href="<?= url('receivables') ?>" class="btn btn-ghost">← Voltar</a>
  </div>

  <form method="POST" action="<?= url('receivables/save') ?>" class="form-card">
    <?= csrfField() ?>
    <?php if ($item): ?><input type="hidden" name="id" value="<?= e($item['id']) ?>"><?php endif; ?>

    <div class="grid-2">
      <label>Cliente
        <select name="customer_id">
          <option value="">— Nenhum —</option>
          <?php foreach ($customers as $c): ?>
            <option value="<?= e($c['id']) ?>" <?= ($item['customer_id'] ?? '')===$c['id']?'selected':'' ?>><?= e($c['full_name']) ?></option>
          <?php endforeach; ?>
        </select>
      </label>
      <label>Descrição *
        <input type="text" name="description" required value="<?= e($item['description'] ?? '') ?>">
      </label>
      <label>Valor total (MZN) *
        <input type="number" step="0.01" min="0.01" name="amount" required value="<?= e($item['amount'] ?? '') ?>">
      </label>
      <label>Data de emissão *
        <input type="date" name="issue_date" required value="<?= e($item['issue_date'] ?? date('Y-m-d')) ?>">
      </label>
      <label>Data de vencimento *
        <input type="date" name="due_date" required value="<?= e($item['due_date'] ?? date('Y-m-d', strtotime('+30 days'))) ?>">
      </label>
    </div>
    <label>Notas
      <textarea name="notes" rows="3"><?= e($item['notes'] ?? '') ?></textarea>
    </label>
    <div class="form-actions">
      <button class="btn btn-primary"><?= $item ? 'Guardar' : 'Criar' ?></button>
      <a href="<?= url('receivables') ?>" class="btn btn-ghost">Cancelar</a>
    </div>
  </form>
</section>
<link rel="stylesheet" href="<?= asset('css/ap_ar.css') ?>">
