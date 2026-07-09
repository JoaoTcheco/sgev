<?php $edit = !empty($item); ?>
<section class="crud">
  <div class="crud-header">
    <div>
      <h1 class="page-title"><?= $edit ? 'Editar conta' : 'Nova conta' ?></h1>
      <p class="page-subtitle">Contas onde entra o dinheiro das vendas ou movimentações manuais.</p>
    </div>
    <a href="<?= url('accounts') ?>" class="btn">← Voltar</a>
  </div>

  <form method="POST" action="<?= url('accounts/save') ?>" class="crud-form">
    <?= csrfField() ?>
    <?php if ($edit): ?><input type="hidden" name="id" value="<?= e($item['id']) ?>"><?php endif; ?>

    <div class="grid-2">
      <label>Nome *
        <input name="name" required maxlength="120" value="<?= e($item['name'] ?? '') ?>"
               <?= !empty($item['is_system']) ? 'readonly' : '' ?>>
      </label>
      <label>Tipo
        <select name="type" <?= !empty($item['is_system']) ? 'disabled' : '' ?>>
          <?php
          $types = ['bank'=>'Banco','mpesa'=>'M-Pesa','emola'=>'E-Mola','card'=>'Cartão','transfer'=>'Transferência','cash'=>'Numerário','other'=>'Outro'];
          $cur = $item['type'] ?? 'other';
          foreach ($types as $k=>$v):
          ?>
            <option value="<?= e($k) ?>" <?= $cur===$k?'selected':'' ?>><?= e($v) ?></option>
          <?php endforeach; ?>
        </select>
      </label>
    </div>

    <label>Notas
      <textarea name="notes" rows="3" maxlength="500"><?= e($item['notes'] ?? '') ?></textarea>
    </label>

    <label class="chk">
      <input type="checkbox" name="active" value="1" <?= (!$edit || !empty($item['active'])) ? 'checked' : '' ?>>
      Activa (visível no PDV)
    </label>

    <div class="form-actions">
      <button class="btn btn-primary"><?= $edit ? 'Guardar alterações' : 'Criar conta' ?></button>
      <a href="<?= url('accounts') ?>" class="btn">Cancelar</a>
    </div>
  </form>
</section>
<link rel="stylesheet" href="<?= asset('css/crud.css') ?>">
